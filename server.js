"use strict";

const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const childProcess=require("node:child_process");

const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".webmanifest":"application/manifest+json; charset=utf-8",".txt":"text/plain; charset=utf-8"};
const APPROVED_VISUAL_SCREENS=["HOME","YOURE_UP","QUESTION","CORRECT","WRONG","TIMES_UP","CURRENT_STANDINGS","ELIMINATED","FINAL_SHOWDOWN_MATCHUP","FINAL_SHOWDOWN_QUESTION","PAUSE","WINNER"];
const APPROVED_VISUAL_REFERENCES=APPROVED_VISUAL_SCREENS.flatMap(screen=>["LANDSCAPE","PORTRAIT","ULTRAWIDE"].map(format=>`assets/visual-6.36/references/LOS_${screen}_6_36_${format}_FINAL.png`));
const APPROVED_VISUAL_RUNTIME=APPROVED_VISUAL_SCREENS.filter(screen=>screen!=="HOME").flatMap(screen=>["LANDSCAPE","PORTRAIT","ULTRAWIDE"].map(format=>`assets/visual-6.36/references/LOS_${screen}_6_36_${format}_RUNTIME.png`));
const PUBLIC_FILES=new Set(["index.html","app.js","app.css","assets/visual-6.36/los-home-hero.png",...APPROVED_VISUAL_REFERENCES,...APPROVED_VISUAL_RUNTIME,"assets/visual-6.36/los-avatar-atlas-v2.png","assets/visual-6.36/los-avatar-style-expansion-v3.png","host-provider.js","question-bank-data.js","question-bank-batch-1.js","question-bank-batch-2.js","question-bank-batch-3.js","question-bank-batch-4.js","question-bank-batch-5.js","question-bank-batch-6.js","question-bank-batch-7.js","question-bank-batch-8.js","question-bank-batch-9.js","question-bank-batch-10.js","question-bank.js","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png","service-worker.js","service-worker-register.js"]);
function readEnvFile(root,env){
 const file=path.join(root,".env");if(!fs.existsSync(file))return env;
 for(const line of fs.readFileSync(file,"utf8").split(/\r?\n/)){const match=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(match&&env[match[1]]==null)env[match[1]]=match[2].replace(/^['"]|['"]$/g,"")}
 return env;
}
function createLru(max=96){
 const values=new Map();return {get(key){if(!values.has(key))return null;const value=values.get(key);values.delete(key);values.set(key,value);return value},set(key,value){values.delete(key);values.set(key,value);while(values.size>max)values.delete(values.keys().next().value)},size:()=>values.size};
}
function json(res,status,value){const body=Buffer.from(JSON.stringify(value));res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":body.length,"cache-control":"no-store"});res.end(body)}
function safeNetworkError(error){const cause=error?.cause||{};return {name:String(error?.name||"Error"),message:String(error?.message||"Host provider request failed").slice(0,180),cause:{code:cause.code||null,errno:cause.errno||null,syscall:cause.syscall||null,hostname:cause.hostname||null,address:cause.address||null,port:cause.port||null}}}
function failureCategory(error,{timedOut=false,clientAborted=false}={}){
 if(clientAborted)return "client_abort";if(timedOut||error?.name==="AbortError")return "network_timeout";
 const code=String(error?.cause?.code||error?.code||"").toUpperCase();
 if(code==="ENOTFOUND"||code==="EAI_AGAIN")return "network_dns";
 if(code.startsWith("CERT_")||code.includes("TLS")||code.includes("SSL"))return "network_tls";
 if(code==="ECONNRESET"||code==="EPIPE"||code==="UND_ERR_SOCKET")return "network_reset";
 if(code==="ETIMEDOUT"||code==="UND_ERR_CONNECT_TIMEOUT"||code==="UND_ERR_HEADERS_TIMEOUT"||code==="UND_ERR_BODY_TIMEOUT")return "network_timeout";
 if(code==="ECONNREFUSED")return "network_refused";return "unknown"
}
function safeProviderDetail(raw){try{const value=JSON.parse(raw),detail=value?.detail||value;return {status:String(detail?.status||detail?.code||"").slice(0,80)||null,message:String(detail?.message||"").slice(0,180)||null}}catch{return {status:null,message:null}}}
const transientStatus=status=>[502,503,504].includes(status);
const transientCategory=category=>["network_dns","network_reset","network_timeout","network_refused","unknown"].includes(category);
async function bodyJson(req,limit=16384){
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(new Error("Request too large"),{status:413});chunks.push(chunk)}
 try{return JSON.parse(Buffer.concat(chunks).toString("utf8")||"{}") }catch{throw Object.assign(new Error("Invalid JSON"),{status:400})}
}
function createAppServer(options={}){
 const root=path.resolve(options.rootDir||__dirname),baseEnv={...(options.env||process.env)},env=options.loadEnvFile===false?baseEnv:readEnvFile(root,baseEnv),fetchImpl=options.fetchImpl||globalThis.fetch;
 const serverStartedAt=new Date().toISOString(),sha256=relative=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,relative))).digest("hex"),gitValue=args=>{try{return childProcess.execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim()}catch{return"unavailable"}};
 const apiKey=String(env.ELEVENLABS_API_KEY||""),voiceId=String(env.ELEVENLABS_VOICE_ID||""),model=String(env.ELEVENLABS_MODEL_ID||"eleven_flash_v2_5");
 const timeoutMs=Math.max(500,Number(env.LOS_HOST_REQUEST_TIMEOUT_MS)||8000),cache=createLru(Math.max(1,Number(env.LOS_HOST_CACHE_SIZE)||96));
 const configured=!!(apiKey&&voiceId&&fetchImpl);let lastHostRequest={result:"not-requested",source:null,providerRequest:"not-attempted",at:null,event:null,upstreamStatus:null,bytes:0,mimeType:null,latencyMs:null,retryAttempted:false};
 async function synthesize({text,event,priority,signal}){
  const speed=priority==="critical"?1.02:event==="fastCorrect"?1.07:1,url=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`,started=Date.now();let retryAttempted=false;
  for(let attempt=1;attempt<=2;attempt++){
   const controller=new AbortController();let timedOut=false,clientAborted=false;
   const relayAbort=()=>{clientAborted=true;controller.abort()};if(signal?.aborted)relayAbort();else signal?.addEventListener("abort",relayAbort,{once:true});
   const timer=setTimeout(()=>{timedOut=true;controller.abort()},timeoutMs);
   try{
    const upstream=await fetchImpl(url,{method:"POST",headers:{"content-type":"application/json","accept":"audio/mpeg","xi-api-key":apiKey},signal:controller.signal,body:JSON.stringify({text,model_id:model,voice_settings:{stability:.42,similarity_boost:.72,style:.38,use_speaker_boost:true,speed}})});
    if(transientStatus(upstream.status)&&attempt===1){retryAttempted=true;await upstream.arrayBuffer().catch(()=>{});continue}
    const type=String(upstream.headers.get("content-type")||""),audio=upstream.ok?Buffer.from(await upstream.arrayBuffer()):null,providerDetail=upstream.ok?null:safeProviderDetail(await upstream.text());
    let category=upstream.status===401||upstream.status===403?"provider_auth":upstream.status===429?"provider_rate_limit":upstream.status>=500?"provider_5xx":upstream.ok?null:"provider_4xx";
    if(providerDetail?.status==="quota_exceeded")category="provider_quota";
    return {ok:upstream.ok,status:upstream.status,type,audio,category,providerDetail,retryAttempted,latencyMs:Date.now()-started,endpoint:"/v1/text-to-speech/:voice_id/stream",method:"POST",model,textLength:text.length}
   }catch(error){
    const category=failureCategory(error,{timedOut,clientAborted});
    if(!clientAborted&&attempt===1&&transientCategory(category)){retryAttempted=true;continue}
    return {ok:false,status:0,type:null,audio:null,category,retryAttempted,latencyMs:Date.now()-started,error:safeNetworkError(error),endpoint:"/v1/text-to-speech/:voice_id/stream",method:"POST",model,textLength:text.length}
   }finally{clearTimeout(timer);signal?.removeEventListener?.("abort",relayAbort)}
  }
 }
 return http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/","http://localhost");
  try{
   const requestHost=String(req.headers.host||"").split(":")[0].toLowerCase(),isLocalRequest=requestHost==="localhost"||requestHost==="127.0.0.1"||requestHost==="[::1]";
   if(req.method==="GET"&&url.pathname==="/__los_build_proof"){
    if(!isLocalRequest)return json(res,404,{error:"Not found"});
    return json(res,200,{repoPath:root,serverPid:process.pid,branch:gitValue(["branch","--show-current"]),head:gitValue(["rev-parse","HEAD"]),sha256:{"app.js":sha256("app.js"),"app.css":sha256("app.css"),"LOS_QUESTION_6_36_LANDSCAPE_RUNTIME.png":sha256("assets/visual-6.36/references/LOS_QUESTION_6_36_LANDSCAPE_RUNTIME.png")},serverStartedAt})
   }
   if(req.method==="GET"&&url.pathname==="/api/host-status")return json(res,200,{available:configured,status:configured?(lastHostRequest.result==="audio-ready"||lastHostRequest.result==="cache-hit"?"available":lastHostRequest.result==="not-requested"?"pending":"unavailable"):"unavailable",configured,provider:"elevenlabs",model,voice:configured?"configured":"missing",cache:"bounded-memory",lastHostRequest});
   const healthCheck=req.method==="POST"&&url.pathname==="/api/host-health";
   if(req.method==="POST"&&(url.pathname==="/api/host-speech"||healthCheck)){
    if(!configured)return json(res,503,{error:"Natural Host is not configured"});
    const input=healthCheck?{}:await bodyJson(req),text=healthCheck?"Host audio test.":String(input.text||"").trim(),event=healthCheck?"health":String(input.event||"").slice(0,40);
    if(!text||text.length>500)return json(res,400,{error:"Host text must contain 1-500 characters"});
    const cacheable=input.cacheable===true,speed=input.priority==="critical"?1.02:event==="fastCorrect"?1.07:1,key=crypto.createHash("sha256").update(JSON.stringify({provider:"elevenlabs",model,voiceId,text,speed,style:"los-host-v1"})).digest("hex");
    const cached=cacheable&&cache.get(key);if(cached){lastHostRequest={result:"cache-hit",source:"cache",providerRequest:"not-attempted",at:Date.now(),event,upstreamStatus:null,bytes:cached.length,mimeType:"audio/mpeg",latencyMs:0,retryAttempted:false};res.writeHead(200,{"content-type":"audio/mpeg","content-length":cached.length,"cache-control":"private, max-age=3600","x-los-host-cache":"hit","x-los-host-source":"cache"});return res.end(cached)}
    const clientController=new AbortController();req.once("aborted",()=>clientController.abort());res.once("close",()=>{if(!res.writableEnded)clientController.abort()});
    const result=await synthesize({text,event,priority:input.priority,signal:clientController.signal}),audio=result.audio,type=result.type||"";
    lastHostRequest={result:result.ok?"response-received":"provider-failed",source:"live",providerRequest:result.ok?"completed":"failed",at:Date.now(),event,upstreamStatus:result.status||null,bytes:audio?.length||0,mimeType:type||null,latencyMs:result.latencyMs,retryAttempted:result.retryAttempted,category:result.category,providerDetail:result.providerDetail||null,error:result.error||null,endpoint:result.endpoint,method:result.method,model:result.model,voiceIdPresent:!!voiceId,textLength:result.textLength};
    if(!result.ok){const status=["provider_rate_limit","provider_quota"].includes(result.category)?429:result.category==="provider_auth"?401:result.category==="client_abort"?499:result.category==="network_timeout"?504:502;return json(res,status,{error:"Host provider unavailable",category:result.category,providerStatus:result.providerDetail?.status||undefined,retryAttempted:result.retryAttempted,network:result.error||undefined})}
    if(!type.startsWith("audio/")){lastHostRequest.result="invalid-content-type";lastHostRequest.category="invalid_audio";return json(res,502,{error:"Invalid Host provider response",category:"invalid_audio"})}
    if(!audio?.length){lastHostRequest.result="empty-audio";lastHostRequest.category="empty_audio";return json(res,502,{error:"Empty Host provider response",category:"empty_audio"})}
    lastHostRequest.result="audio-ready";
    lastHostRequest.category=null;
    if(healthCheck)return json(res,200,{configured:true,upstreamReachable:true,authorizationAccepted:true,audioBytes:audio.length,mimeType:type,latencyMs:result.latencyMs,retryAttempted:result.retryAttempted});
    if(cacheable)cache.set(key,audio);
    res.writeHead(200,{"content-type":type,"content-length":audio.length,"cache-control":"private, max-age=3600","x-los-host-cache":"miss","x-los-host-source":"live"});return res.end(audio);
   }
   if(req.method!=="GET"&&req.method!=="HEAD")return json(res,405,{error:"Method not allowed"});
   const relative=decodeURIComponent(url.pathname==="/"?"/index.html":url.pathname).replace(/^\/+/,"");if(!PUBLIC_FILES.has(relative))return json(res,404,{error:"Not found"});
   const file=path.resolve(root,relative);if(file!==root&&!file.startsWith(root+path.sep))return json(res,403,{error:"Forbidden"});
   const stat=await fs.promises.stat(file).catch(()=>null);if(!stat?.isFile())return json(res,404,{error:"Not found"});
   const headers={"content-type":MIME[path.extname(file).toLowerCase()]||"application/octet-stream","content-length":stat.size,"cache-control":isLocalRequest?"no-store, max-age=0":"no-cache"};if(isLocalRequest)headers.pragma="no-cache";res.writeHead(200,headers);if(req.method==="HEAD")return res.end();fs.createReadStream(file).pipe(res);
  }catch(error){if(error?.name==="AbortError"){lastHostRequest={...lastHostRequest,result:"timeout",at:Date.now(),failureType:"AbortError"};return json(res,504,{error:"Host provider timed out"})}lastHostRequest={...lastHostRequest,result:"server-failure",at:Date.now(),failureType:String(error?.name||"Error"),failureMessage:String(error?.message||"Host speech failed").slice(0,180)};return json(res,error.status||500,{error:error.status?error.message:"Host speech failed"})}
 });
}
if(require.main===module){const server=createAppServer(),port=Math.max(1,Number(process.env.PORT)||8080);server.listen(port,()=>console.log(`Last One Standing: http://localhost:${port}`))}
module.exports={createAppServer,createLru};
