(()=>{
"use strict";

const diagnostics={requests:0,cacheHits:0,cancellations:0,failures:0,lastStartLatencyMs:null,lastPlaybackMs:null,lastError:"",lastFailureCategory:null,providerStatus:"pending",activated:false,history:[]};
let masterVolume=.65,current=null,requestId=0,statusReady=null;
const media=new Audio();media.preload="auto";
const record=(type,data={})=>{
 diagnostics.history.push({type,at:Date.now(),...data});
 if(diagnostics.history.length>80)diagnostics.history.shift();
};
const provider={
 name:"elevenlabs-natural-host",
 available:null,
 async activate(){
  if(diagnostics.activated)return true;
  try{media.muted=true;media.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";await media.play();media.pause();media.removeAttribute("src");media.load();media.muted=false;diagnostics.activated=true;record("audio-activated");return true}catch(error){media.muted=false;record("activation-failure",{error:String(error?.name||error?.message||error)});return false}
 },
 async play(cue){
  const id=++requestId,hostEventId=cue.hostEventId||`provider-${id}`,started=performance.now(),controller=new AbortController();
  if(statusReady)await statusReady;if(provider.available===false)throw new Error("Natural Host is not configured");
  if(current)provider.cancel("superseded");
  const dynamicName=String(cue.context?.name||"").trim();
  const cacheable=!dynamicName||!String(cue.text).toLocaleLowerCase().includes(dynamicName.toLocaleLowerCase());
  diagnostics.requests++;record("request",{id,hostEventId,event:cue.event,screen:cue.context?.screen,runtimeSession:cue.context?.runtimeSession,cacheable});
  current={id,controller,audio:null,url:null,settle:null};
  try{
   record("request-started",{id,hostEventId,event:cue.event,volume:Number(cue.volume??masterVolume),muted:media.muted});const response=await fetch("/api/host-speech",{
    method:"POST",headers:{"content-type":"application/json"},signal:controller.signal,
    body:JSON.stringify({event:cue.event,text:cue.text,priority:cue.priority,context:cue.context||{},cacheable})
   });
   const cache=response.headers.get("x-los-host-cache")||"none",source=response.headers.get("x-los-host-source")||"unknown";
   record("response",{id,hostEventId,status:response.status,ok:response.ok,cache,source});
   if(!response.ok){let detail={};try{detail=await response.json()}catch{}const error=new Error(`Host speech unavailable (${response.status})`);error.category=detail.category||`http_${response.status}`;error.retryAttempted=!!detail.retryAttempted;throw error}
   provider.available=true;diagnostics.providerStatus="available";if(cache==="hit")diagnostics.cacheHits++;
   const blob=await response.blob();record("audio-bytes",{id,hostEventId,bytes:blob.size,mimeType:blob.type});
   if(!blob.size||!String(blob.type||"").startsWith("audio/"))throw new Error("Invalid Host audio response");
   if(!current||current.id!==id)return;
   const url=URL.createObjectURL(blob),audio=media;audio.src=url;audio.load();record("audio-load",{id,hostEventId});
   current.audio=audio;current.url=url;audio.volume=Math.max(0,Math.min(1,Number(cue.volume??masterVolume)));
   await new Promise((resolve,reject)=>{
    if(!current||current.id!==id)return resolve();
    const watchdog=setTimeout(()=>reject(new Error("Host audio playback timed out")),cue.event==="questionRead"?15000:30000),finish=()=>{clearTimeout(watchdog);resolve()},fail=()=>{clearTimeout(watchdog);reject(new Error("Host audio playback failed"))};
    current.settle=finish;
    audio.onloadedmetadata=()=>record("audio-loaded",{id,hostEventId,duration:audio.duration});audio.onended=finish;audio.onerror=fail;record("play-attempt",{id,hostEventId,volume:audio.volume,muted:audio.muted});
    Promise.resolve(audio.play()).then(()=>{if(current?.id===id){diagnostics.lastStartLatencyMs=Math.round(performance.now()-started);record("audio-start",{id,hostEventId,latencyMs:diagnostics.lastStartLatencyMs,currentTime:audio.currentTime,volume:audio.volume,muted:audio.muted});setTimeout(()=>{if(current?.id===id)record("audio-progress",{id,hostEventId,currentTime:audio.currentTime,duration:audio.duration,volume:audio.volume,muted:audio.muted})},250)}}).catch(error=>{error.category="browser_autoplay";record("autoplay-rejection",{id,hostEventId,category:error.category,error:String(error?.name||error?.message||error)});reject(error)});
   });
   if(current?.id===id){diagnostics.lastPlaybackMs=Math.round(performance.now()-started);record("playback-ended",{id,hostEventId,totalMs:diagnostics.lastPlaybackMs,currentTime:audio.currentTime,duration:audio.duration})}
  }catch(error){
   if(error?.name!=="AbortError"){diagnostics.failures++;diagnostics.lastError=String(error?.message||error);diagnostics.lastFailureCategory=error?.category||"unknown";if(["provider_auth","provider_quota","provider_4xx"].includes(diagnostics.lastFailureCategory)){provider.available=false;diagnostics.providerStatus="unavailable"}record("failure",{id,hostEventId,category:diagnostics.lastFailureCategory,retryAttempted:!!error?.retryAttempted,error:diagnostics.lastError})}
   throw error;
  }finally{
   if(current?.id===id){if(current.url)URL.revokeObjectURL(current.url);current=null}
  }
 },
 cancel(reason="cancelled"){
  if(!current)return;
  diagnostics.cancellations++;record("cancel",{id:current.id,reason});
  const active=current;current=null;active.controller.abort();
  if(active.audio){active.audio.pause();active.audio.removeAttribute?.("src");active.audio.load?.()}
  if(active.url)URL.revokeObjectURL(active.url);active.settle?.();
 },
 setVolume(value){
  masterVolume=Math.max(0,Math.min(1,Number(value)||0));
  if(current?.audio)current.audio.volume=masterVolume;
 }
};

window.__LOS_HOST_AUDIO_DIAGNOSTICS__=diagnostics;
window.__LOS_HOST_PROVIDER__=provider;
statusReady=fetch("/api/host-status",{headers:{accept:"application/json"}}).then(r=>r.ok?r.json():null).then(status=>{
 provider.available=status?.configured===false?false:null;diagnostics.providerStatus=status?.status||"pending";record("status",{available:provider.available,status:diagnostics.providerStatus,configured:!!status?.configured,provider:status?.provider||"none",voice:status?.voice||""});
}).catch(error=>{provider.available=null;diagnostics.providerStatus="pending";diagnostics.lastError=String(error?.message||error);record("status-failure",{status:"pending",error:diagnostics.lastError})});
})();
