(function(global){
"use strict";

const WS_ENDPOINT="wss://streaming.assemblyai.com/v3/ws";
const STREAM_PARAMS={sample_rate:"16000",speech_model:"u3-rt-pro",encoding:"pcm_s16le",format_turns:"true"};

class StreamingVoiceLab{
 constructor(options={}){this.fetch=options.fetch||global.fetch?.bind(global);this.WebSocket=options.WebSocket||global.WebSocket;this.mediaDevices=options.mediaDevices||global.navigator?.mediaDevices;this.AudioContext=options.AudioContext||global.AudioContext||global.webkitAudioContext;this.now=options.now||(()=>global.performance.now());this.ui=options.ui||{};this.reset()}
 reset(){this.socket=null;this.stream=null;this.audioContext=null;this.source=null;this.worklet=null;this.silentGain=null;this.running=false;this.stopping=false;this.marks={};this.firstPartialText="";this.setStatus("disconnected");this.renderTimings()}
 mark(name,detail){if(this.marks[name]==null)this.marks[name]=this.now();this.log(name,detail);this.renderTimings()}
 setStatus(value,error=false){this.ui.status?.(value,error)}
 log(event,detail=""){this.ui.log?.(`${Math.round(this.now())}ms  ${event}${detail?`  ${detail}`:""}`)}
 delta(from,to){return this.marks[from]!=null&&this.marks[to]!=null?Math.max(0,Math.round(this.marks[to]-this.marks[from])):null}
 renderTimings(){this.ui.timings?.([
  ["button → mic ready",this.delta("button","micReady")],["button → websocket open",this.delta("button","socketOpen")],
  ["first audio → first partial",this.delta("firstAudio","firstPartial")],["speech start → first partial",this.delta("speechStart","firstPartial")],
  ["first partial → final",this.delta("firstPartial","final")],["first audio → final",this.delta("firstAudio","final")]
 ])}
 async start(){
  if(this.running||this.stopping)return;this.running=true;this.marks={};this.firstPartialText="";this.ui.live?.("");this.ui.final?.("");this.ui.controls?.(true);this.mark("button","START LISTENING");
  try{
   if(!this.mediaDevices?.getUserMedia)throw new Error("getUserMedia is unavailable. Use a secure HTTPS page in Safari.");
   if(!this.AudioContext)throw new Error("Web Audio is unavailable in this browser.");
   this.setStatus("requesting microphone");
   this.stream=await this.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});this.mark("micReady");
   this.audioContext=new this.AudioContext();await this.audioContext.resume?.();await this.audioContext.audioWorklet.addModule("./voice-stream-worklet.js");
   this.source=this.audioContext.createMediaStreamSource(this.stream);this.worklet=new AudioWorkletNode(this.audioContext,"los-pcm16-worklet");this.silentGain=this.audioContext.createGain();this.silentGain.gain.value=0;this.source.connect(this.worklet);this.worklet.connect(this.silentGain);this.silentGain.connect(this.audioContext.destination);this.worklet.port.onmessage=event=>this.sendAudio(event.data);
   this.setStatus("obtaining temporary token");const tokenResponse=await this.fetch("/api/assemblyai-token",{cache:"no-store"}),tokenBody=await tokenResponse.json().catch(()=>({}));if(!tokenResponse.ok||!tokenBody.token)throw new Error(tokenBody.error||`Temporary token request failed (${tokenResponse.status})`);this.mark("tokenReady",`expires ${tokenBody.expires_in_seconds||"?"}s`);
   this.setStatus("connecting");const params=new URLSearchParams({...STREAM_PARAMS,token:tokenBody.token});this.socket=new this.WebSocket(`${WS_ENDPOINT}?${params}`);this.socket.binaryType="arraybuffer";
   this.socket.onopen=()=>{if(!this.running)return;this.mark("socketOpen");this.setStatus("listening")};
   this.socket.onmessage=event=>this.handleMessage(event.data);
   this.socket.onerror=()=>{this.log("websocket-error");this.setStatus("error",true)};
   this.socket.onclose=event=>{this.log("websocket-close",`${event.code} ${event.reason||""}`.trim());if(this.running&&!this.stopping)this.setStatus("error",true)}
  }catch(error){this.log("start-error",error.message);this.setStatus(`error: ${error.message}`,true);await this.stop(false)}
 }
 sendAudio(buffer){if(!this.running||!this.socket||this.socket.readyState!==this.WebSocket.OPEN)return false;this.socket.send(buffer);if(this.marks.firstAudio==null)this.mark("firstAudio",`${buffer.byteLength} bytes`);return true}
 handleMessage(raw){
  let message;try{message=JSON.parse(raw)}catch{this.log("invalid-provider-message");return}
  this.log(`provider:${message.type}`,message.type==="Turn"?`end=${!!message.end_of_turn}`:"");
  if(message.type==="SpeechStarted"){this.mark("speechStart",String(message.confidence??""));return}
  if(message.type!=="Turn")return;const text=String(message.transcript||"").trim();if(!text)return;
  if(this.marks.firstPartial==null){this.firstPartialText=text;this.mark("firstPartial",text);this.mark("firstUsable",text)}
  if(message.end_of_turn){this.ui.final?.(text);this.mark("final",text)}else this.ui.live?.(text)
 }
 async stop(updateStatus=true){
  if(this.stopping)return;this.stopping=true;this.running=false;
  try{if(this.socket?.readyState===this.WebSocket.OPEN)this.socket.send(JSON.stringify({type:"Terminate"}))}catch{}
  try{this.socket?.close()}catch{};this.socket=null;
  try{this.worklet?.disconnect();if(this.worklet?.port)this.worklet.port.onmessage=null}catch{};this.worklet=null;
  try{this.source?.disconnect()}catch{};this.source=null;try{this.silentGain?.disconnect()}catch{};this.silentGain=null;
  for(const track of this.stream?.getTracks?.()||[])try{track.stop()}catch{};this.stream=null;
  try{await this.audioContext?.close?.()}catch{};this.audioContext=null;this.stopping=false;this.ui.controls?.(false);if(updateStatus)this.setStatus("disconnected");this.log("stopped")
 }
}

function installPage(){
 const byId=id=>document.getElementById(id),status=byId("status"),start=byId("start"),stop=byId("stop"),live=byId("live"),final=byId("final"),timings=byId("timings"),log=byId("log");
 const lab=new StreamingVoiceLab({ui:{status:(text,error)=>{status.textContent=text;status.classList.toggle("error",!!error)},controls:running=>{start.disabled=running;stop.disabled=!running},live:text=>live.textContent=text||"—",final:text=>final.textContent=text||"—",timings:rows=>{timings.replaceChildren(...rows.flatMap(([label,value])=>{const a=document.createElement("span"),b=document.createElement("strong");a.textContent=label;b.textContent=value==null?"—":`${value} ms`;return[a,b]}))},log:text=>{log.textContent+=(log.textContent?"\n":"")+text;log.scrollTop=log.scrollHeight}}});
 start.onclick=()=>lab.start();stop.onclick=()=>lab.stop();global.__LOS_STREAMING_VOICE_LAB__=lab
}

global.StreamingVoiceLab=StreamingVoiceLab;if(typeof module!=="undefined"&&module.exports)module.exports={StreamingVoiceLab,WS_ENDPOINT,STREAM_PARAMS};if(global.document)global.addEventListener("DOMContentLoaded",installPage);
})(typeof globalThis!=="undefined"?globalThis:this);
