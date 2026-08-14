"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {JSDOM}=require("jsdom");

const settle=()=>new Promise(resolve=>setImmediate(resolve));
function providerHarness({speechStatus=200,contentType="audio/mpeg",speechBody="audio",autoplayError=null,statusState="pending"}={}){
 const dom=new JSDOM("<!doctype html>",{url:"https://example.test",runScripts:"outside-only",pretendToBeVisual:true}),{window}=dom;
 const requests=[],audios=[];let objectId=0;
 window.fetch=async(url,options={})=>{
  requests.push({url,options});
  if(url==="/api/host-status")return {ok:true,json:async()=>({available:true,configured:true,status:statusState,provider:"elevenlabs",voice:"configured"})};
  return {ok:speechStatus===200,status:speechStatus,headers:{get:name=>name.toLowerCase()==="x-los-host-cache"?"miss":name.toLowerCase()==="x-los-host-source"?"live":null},json:async()=>({category:speechStatus===401?"provider_auth":"provider_5xx"}),blob:async()=>new window.Blob([speechBody],{type:contentType})};
 };
 window.URL.createObjectURL=()=>`blob:test-${++objectId}`;window.URL.revokeObjectURL=()=>{};
 window.Audio=class{
  constructor(src){this.src=src;this.volume=1;this.paused=false;audios.push(this)}
  play(){this.played=true;if(autoplayError)return Promise.reject(autoplayError);this.currentTime=.1;return Promise.resolve()}
  pause(){this.paused=true}
  removeAttribute(){}load(){}
  finish(){this.onended?.()}
 };
 const source=fs.readFileSync(path.resolve(__dirname,"..","host-provider.js"),"utf8");vm.runInContext(source,dom.getInternalVMContext());
 return {window,provider:window.__LOS_HOST_PROVIDER__,diagnostics:window.__LOS_HOST_AUDIO_DIAGNOSTICS__,requests,audios,close:()=>dom.window.close()};
}

test("natural provider fetches same-origin audio without browser credentials and completes playback",async()=>{
 const h=providerHarness();try{await settle();assert.equal(h.provider.available,true);assert.equal(h.diagnostics.providerStatus,"pending");const playing=h.provider.play({event:"correct",text:"There you go.",priority:"optional",volume:.4,context:{}});await settle();assert.equal(h.requests[1].url,"/api/host-speech");assert.equal(h.requests[1].options.headers["xi-api-key"],undefined);assert.equal(h.audios[0].volume,.4);assert.equal(typeof h.diagnostics.lastStartLatencyMs,"number");assert.equal(h.provider.available,true);assert.equal(h.diagnostics.providerStatus,"available");h.audios[0].finish();await playing;assert.equal(h.diagnostics.requests,1);assert.equal(h.diagnostics.failures,0)}finally{h.close()}
});

test("master volume updates an active natural Host clip",async()=>{
 const h=providerHarness();try{await settle();const playing=h.provider.play({event:"opening",text:"Welcome!",priority:"critical",volume:.65,context:{}});await settle();h.provider.setVolume(.2);assert.equal(h.audios[0].volume,.2);h.audios[0].finish();await playing}finally{h.close()}
});

test("cancel aborts and stops active audio without overlap",async()=>{
 const h=providerHarness();try{await settle();const playing=h.provider.play({event:"turn",text:"Alex, you are up.",priority:"optional",volume:.65,context:{name:"Alex"}});await settle();h.provider.cancel("question-started");await playing;assert.equal(h.audios[0]?.paused??true,true);assert.equal(h.diagnostics.cancellations,1)}finally{h.close()}
});

test("provider errors reject cleanly and remain diagnostic-only",async()=>{
 const h=providerHarness({speechStatus:429});try{await settle();await assert.rejects(h.provider.play({event:"wrong",text:"Not this time.",priority:"optional",volume:.65,context:{}}),/429/);assert.equal(h.diagnostics.failures,1)}finally{h.close()}
});

test("player-name lines are explicitly marked non-cacheable",async()=>{
 const h=providerHarness();try{await settle();const playing=h.provider.play({event:"champion",text:"Marcus is the champion!",priority:"critical",volume:.65,context:{name:"Marcus"}});await settle();const sent=JSON.parse(h.requests[1].options.body);assert.equal(sent.cacheable,false);h.audios[0].finish();await playing}finally{h.close()}
});

test("developer diagnostics cover activation request bytes playback progress and completion",async()=>{
 const h=providerHarness();try{await settle();await h.provider.activate();assert.equal(h.diagnostics.activated,true);const playing=h.provider.play({event:"opening",text:"Welcome to the game.",priority:"critical",volume:.55,context:{}});await new Promise(resolve=>setTimeout(resolve,20));const types=h.diagnostics.history.map(x=>x.type);for(const type of ["audio-activated","request","request-started","response","audio-bytes","audio-load","audio-start"])assert.ok(types.includes(type),`${type}: ${types.join(",")}`);assert.equal(h.audios[0].volume,.55);h.audios[0].finish();await playing;assert.ok(h.diagnostics.history.some(x=>x.type==="playback-ended"))}finally{h.close()}
});

test("empty audio and autoplay rejection are categorized separately",async()=>{
 const empty=providerHarness({speechBody:""});try{await settle();await assert.rejects(empty.provider.play({event:"turn",text:"Alex, you are up.",context:{name:"Alex"}}),/Invalid Host audio/);assert.equal(empty.diagnostics.lastFailureCategory,"unknown")}finally{empty.close()}
 const blocked=providerHarness({autoplayError:Object.assign(new Error("play blocked"),{name:"NotAllowedError"})});try{await settle();await assert.rejects(blocked.provider.play({event:"turn",text:"Alex, you are up.",context:{name:"Alex"}}),/play blocked/);assert.equal(blocked.diagnostics.lastFailureCategory,"browser_autoplay");assert.ok(blocked.diagnostics.history.some(x=>x.type==="autoplay-rejection"&&x.category==="browser_autoplay"))}finally{blocked.close()}
});
