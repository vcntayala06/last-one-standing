"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const {createAppServer}=require("../server");

async function withServer(options,run){
 const server=createAppServer({...options,rootDir:path.resolve(__dirname,"..")} );await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 try{return await run(`http://127.0.0.1:${server.address().port}`)}finally{await new Promise(resolve=>server.close(resolve))}
}
const configured={ELEVENLABS_API_KEY:"server-secret",ELEVENLABS_VOICE_ID:"original-host",LOS_HOST_REQUEST_TIMEOUT_MS:"100"};

test("credential boundary reports unavailable and never exposes a key to the browser",async()=>{
 await withServer({env:{},loadEnvFile:false},async base=>{const status=await (await fetch(base+"/api/host-status")).json();assert.equal(status.available,false);assert.equal(JSON.stringify(status).includes("server-secret"),false);const response=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Hello"})});assert.equal(response.status,503);assert.equal((await fetch(base+"/.env")).status,404);assert.equal((await fetch(base+"/server.js")).status,404)});
 for(const file of ["app.js","host-provider.js","index.html"]){const source=fs.readFileSync(path.resolve(__dirname,"..",file),"utf8");assert.doesNotMatch(source,/xi-api-key|ELEVENLABS_API_KEY|server-secret/)}
});

test("server sends credentials upstream and returns natural speech audio",async()=>{
 let upstream;
 await withServer({env:configured,fetchImpl:async(url,options)=>{upstream={url,options};return new Response(Buffer.from("natural-audio"),{status:200,headers:{"content-type":"audio/mpeg"}})}},async base=>{
  const response=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event:"correct",text:"There you go.",cacheable:true})});
  assert.equal(response.status,200);assert.equal(await response.text(),"natural-audio");assert.equal(upstream.options.headers["xi-api-key"],"server-secret");assert.match(upstream.url,/original-host\/stream/);assert.equal(JSON.parse(upstream.options.body).model_id,"eleven_flash_v2_5")
 });
});

test("bounded cache reuses generic speech but never persists dynamic player-name lines",async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return new Response(Buffer.from("audio-"+calls),{status:200,headers:{"content-type":"audio/mpeg"}})};
 await withServer({env:configured,fetchImpl},async base=>{
  const speak=body=>fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  assert.equal((await speak({text:"There you go.",event:"correct",cacheable:true})).headers.get("x-los-host-cache"),"miss");
  assert.equal((await speak({text:"There you go.",event:"correct",cacheable:true})).headers.get("x-los-host-cache"),"hit");assert.equal(calls,1);
  await speak({text:"Marcus takes it!",event:"champion",cacheable:false});await speak({text:"Marcus takes it!",event:"champion",cacheable:false});assert.equal(calls,3)
 });
});

test("rate limits invalid audio and timeouts return safe categorized failures",async()=>{
 let calls=0;
 await withServer({env:configured,fetchImpl:async()=>{calls++;return new Response("limited",{status:429})}},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Nope"})});assert.equal(r.status,429);assert.equal((await r.json()).category,"provider_rate_limit");assert.equal(calls,1)});
 await withServer({env:configured,fetchImpl:async()=>new Response("not audio",{status:200,headers:{"content-type":"text/plain"}})},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Nope"})});assert.equal(r.status,502);assert.equal((await r.json()).category,"invalid_audio")});
 await withServer({env:configured,fetchImpl:async()=>new Response(null,{status:200,headers:{"content-type":"audio/mpeg"}})},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Nope"})});assert.equal(r.status,502);assert.equal((await r.json()).category,"empty_audio")});
 calls=0;await withServer({env:configured,fetchImpl:(_url,options)=>new Promise((_resolve,reject)=>{calls++;options.signal.addEventListener("abort",()=>reject(Object.assign(new Error("aborted"),{name:"AbortError"})))})},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Too slow"})});assert.equal(r.status,504);const body=await r.json();assert.equal(body.category,"network_timeout");assert.equal(body.retryAttempted,true);assert.equal(calls,2)});
});

test("authorization failures retain 401 and are never retried",async()=>{
 for(const status of [401,403]){let calls=0;await withServer({env:configured,fetchImpl:async()=>{calls++;return new Response("denied",{status,headers:{"content-type":"application/json"}})}},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Alex, you are up."})});assert.equal(r.status,401);const body=await r.json();assert.equal(body.category,"provider_auth");assert.equal(body.retryAttempted,false);assert.equal(calls,1)})}
});

test("quota exhaustion is distinct from an invalid API key",async()=>{
 let calls=0;await withServer({env:configured,fetchImpl:async()=>{calls++;return new Response(JSON.stringify({detail:{status:"quota_exceeded",message:"Not enough credits"}}),{status:401,headers:{"content-type":"application/json"}})}},async base=>{const r=await fetch(base+"/api/host-health",{method:"POST"});assert.equal(r.status,429);const body=await r.json();assert.equal(body.category,"provider_quota");assert.equal(body.providerStatus,"quota_exceeded");assert.equal(calls,1)})
});

test("one transient 502 or network reset retry can recover",async()=>{
 for(const first of ["status","network"]){let calls=0;await withServer({env:configured,fetchImpl:async()=>{calls++;if(calls===1){if(first==="status")return new Response("bad gateway",{status:502});const error=new TypeError("fetch failed");error.cause=Object.assign(new Error("reset"),{code:"ECONNRESET",syscall:"read",hostname:"api.elevenlabs.io"});throw error}return new Response(Buffer.from("recovered-audio"),{status:200,headers:{"content-type":"audio/mpeg"}})}},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Alex, you are up."})});assert.equal(r.status,200);assert.equal(calls,2);const status=await (await fetch(base+"/api/host-status")).json();assert.equal(status.lastHostRequest.retryAttempted,true);assert.equal(status.lastHostRequest.bytes,15)})}
});

test("DNS errors expose safe nested diagnostics and health performs real synthesis",async()=>{
 let calls=0;await withServer({env:configured,fetchImpl:async()=>{calls++;const error=new TypeError("fetch failed");error.cause=Object.assign(new Error("lookup failed"),{code:"ENOTFOUND",errno:-3008,syscall:"getaddrinfo",hostname:"api.elevenlabs.io"});throw error}},async base=>{const r=await fetch(base+"/api/host-health",{method:"POST"});assert.equal(r.status,502);const body=await r.json();assert.equal(body.category,"network_dns");assert.equal(body.network.cause.code,"ENOTFOUND");assert.equal(body.network.cause.hostname,"api.elevenlabs.io");assert.equal(calls,2)});
 await withServer({env:configured,fetchImpl:async()=>new Response(Buffer.from("health-audio"),{status:200,headers:{"content-type":"audio/mpeg"}})},async base=>{const r=await fetch(base+"/api/host-health",{method:"POST"});assert.equal(r.status,200);const body=await r.json();assert.equal(body.configured,true);assert.equal(body.upstreamReachable,true);assert.equal(body.authorizationAccepted,true);assert.equal(body.audioBytes,12);assert.equal(body.mimeType,"audio/mpeg")})
});

test("cache status identifies Lock In without claiming a live provider request",async()=>{
 let calls=0;await withServer({env:configured,fetchImpl:async()=>{calls++;return new Response(Buffer.from("lock-audio"),{status:200,headers:{"content-type":"audio/mpeg"}})}},async base=>{const speak=()=>fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event:"lockIn",text:"Lock in.",cacheable:true})});await speak();const cached=await speak();assert.equal(cached.headers.get("x-los-host-source"),"cache");const status=await (await fetch(base+"/api/host-status")).json();assert.equal(status.lastHostRequest.source,"cache");assert.equal(status.lastHostRequest.providerRequest,"not-attempted");assert.equal(calls,1)})
});

test("normal response completion never aborts upstream while a true client disconnect does",async()=>{
 let normalSignal;await withServer({env:configured,fetchImpl:async(_url,options)=>{normalSignal=options.signal;return new Response(Buffer.from("audio"),{status:200,headers:{"content-type":"audio/mpeg"}})}},async base=>{const r=await fetch(base+"/api/host-speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"Normal completion"})});assert.equal(r.status,200);await r.arrayBuffer();await new Promise(resolve=>setImmediate(resolve));assert.equal(normalSignal.aborted,false)});
 let aborted=false,started;const upstreamStarted=new Promise(resolve=>started=resolve);
 await withServer({env:configured,fetchImpl:(_url,options)=>new Promise((_resolve,reject)=>{started();options.signal.addEventListener("abort",()=>{aborted=true;reject(Object.assign(new Error("client left"),{name:"AbortError"}))},{once:true})})},async base=>{const target=new URL(base+"/api/host-speech"),request=http.request({hostname:target.hostname,port:target.port,path:target.pathname,method:"POST",headers:{"content-type":"application/json"}});request.on("error",()=>{});request.end(JSON.stringify({text:"Disconnect test"}));await upstreamStarted;request.destroy();await new Promise(resolve=>setTimeout(resolve,20));assert.equal(aborted,true)});
});
