"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {createVoiceStreamServer}=require("../voice-stream-server");
const {StreamingVoiceLab,WS_ENDPOINT,STREAM_PARAMS}=require("../voice-stream-test");

const ROOT=path.resolve(__dirname,"..");
async function withServer(options,fn){const server=createVoiceStreamServer({...options,rootDir:ROOT});await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));try{return await fn(`http://127.0.0.1:${server.address().port}`)}finally{await new Promise(resolve=>server.close(resolve))}}

test("client prototype never embeds the permanent AssemblyAI key",()=>{
 for(const name of ["voice-stream-test.html","voice-stream-test.js","voice-stream-worklet.js"]){const source=fs.readFileSync(path.join(ROOT,name),"utf8");assert.equal(source.includes("ASSEMBLYAI_API_KEY"),false,name);assert.equal(/Authorization\s*[:=]/i.test(source),false,name)}
});

test("temporary-token endpoint handles missing configuration without leaking secrets",async()=>{
 await withServer({env:{},loadEnvFile:false},async base=>{const response=await fetch(base+"/api/assemblyai-token"),text=await response.text();assert.equal(response.status,503);assert.match(text,/ASSEMBLYAI_API_KEY is not configured/);assert.equal(text.includes("server-secret"),false);assert.equal((await fetch(base+"/.env")).status,404)});
});

test("temporary-token endpoint authenticates server-side and returns only temporary fields",async()=>{
 let request;const fetchImpl=async(url,options)=>{request={url,options};return new Response(JSON.stringify({token:"temporary-only",expires_in_seconds:60}),{status:200,headers:{"content-type":"application/json"}})};
 await withServer({env:{ASSEMBLYAI_API_KEY:"server-secret"},loadEnvFile:false,fetchImpl},async base=>{const response=await fetch(base+"/api/assemblyai-token"),value=await response.json();assert.equal(response.status,200);assert.deepEqual(value,{token:"temporary-only",expires_in_seconds:60});assert.equal(JSON.stringify(value).includes("server-secret"),false)});
 assert.match(request.url,/streaming\.assemblyai\.com\/v3\/token/);assert.equal(request.options.headers.Authorization,"server-secret")
});

test("isolated server serves only the prototype files",async()=>{
 await withServer({env:{},loadEnvFile:false},async base=>{for(const name of ["voice-stream-test.html","voice-stream-test.js","voice-stream-worklet.js"]){const response=await fetch(base+"/"+name);assert.equal(response.status,200,name);assert.ok((await response.text()).length>100,name)}assert.equal((await fetch(base+"/app.js")).status,404);assert.equal((await fetch(base+"/server.js")).status,404)});
});

test("streaming client uses Universal Streaming v3 and never deprecated v2",()=>{assert.equal(WS_ENDPOINT,"wss://streaming.assemblyai.com/v3/ws");assert.equal(STREAM_PARAMS.speech_model,"u3-rt-pro");assert.equal(STREAM_PARAMS.sample_rate,"16000");assert.equal(STREAM_PARAMS.encoding,"pcm_s16le");assert.equal(JSON.stringify({WS_ENDPOINT,STREAM_PARAMS}).includes("/v2/"),false)});

test("audio waits for an open socket and stop releases every resource",async()=>{
 const tracks=[{stopped:false,stop(){this.stopped=true}}],stream={getTracks:()=>tracks},events=[];
 class Socket{static OPEN=1;constructor(url){this.url=url;this.readyState=0;this.sent=[];Socket.instance=this}send(value){this.sent.push(value)}close(){this.closed=true;this.readyState=3}}
 const node=()=>({connect(){return this},disconnect(){this.disconnected=true}}),worklet={...node(),port:{onmessage:null}},gain={...node(),gain:{value:1}};
 class Context{constructor(){this.destination={};this.audioWorklet={addModule:async name=>events.push("module:"+name)}}async resume(){events.push("resume")}createMediaStreamSource(){return node()}createGain(){return gain}async close(){this.closed=true;events.push("context-closed")}}
 const previous=global.AudioWorkletNode;global.AudioWorkletNode=function(){return worklet};
 try{
  const lab=new StreamingVoiceLab({fetch:async()=>new Response(JSON.stringify({token:"temporary",expires_in_seconds:60}),{status:200}),WebSocket:Socket,mediaDevices:{getUserMedia:async()=>stream},AudioContext:Context,now:(()=>{let n=0;return()=>++n})(),ui:{status(){},controls(){},live(){},final(){},timings(){},log(){}}});
  await lab.start();const socket=Socket.instance,frame=new ArrayBuffer(1600);assert.match(socket.url,/streaming\.assemblyai\.com\/v3\/ws/);assert.match(socket.url,/token=temporary/);assert.equal(lab.sendAudio(frame),false);assert.equal(socket.sent.length,0);
  socket.readyState=Socket.OPEN;socket.onopen();assert.equal(lab.sendAudio(frame),true);assert.equal(socket.sent[0],frame);
  await lab.stop();assert.equal(JSON.parse(socket.sent[1]).type,"Terminate");assert.equal(socket.closed,true);assert.equal(tracks[0].stopped,true);assert.equal(worklet.disconnected,true);assert.equal(worklet.port.onmessage,null);assert.ok(events.includes("context-closed"));assert.equal(lab.stream,null);assert.equal(lab.audioContext,null)
 }finally{global.AudioWorkletNode=previous}
});
