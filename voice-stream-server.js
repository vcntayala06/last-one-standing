"use strict";

const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");

const PUBLIC_FILES=new Map([
 ["/",["voice-stream-test.html","text/html; charset=utf-8"]],
 ["/voice-stream-test.html",["voice-stream-test.html","text/html; charset=utf-8"]],
 ["/voice-stream-test.js",["voice-stream-test.js","text/javascript; charset=utf-8"]],
 ["/voice-stream-worklet.js",["voice-stream-worklet.js","text/javascript; charset=utf-8"]]
]);

function readEnvFile(root,env){
 const file=path.join(root,".env");if(!fs.existsSync(file))return env;
 for(const line of fs.readFileSync(file,"utf8").split(/\r?\n/)){const match=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(match&&env[match[1]]==null)env[match[1]]=match[2].replace(/^['"]|['"]$/g,"")}
 return env
}
function json(res,status,value){const body=Buffer.from(JSON.stringify(value));res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":body.length,"cache-control":"no-store"});res.end(body)}
function safeProviderMessage(value){return String(value?.error||value?.message||"Temporary token request failed").slice(0,180)}

function createVoiceStreamServer(options={}){
 const root=path.resolve(options.rootDir||__dirname),env=options.loadEnvFile===false?{...(options.env||process.env)}:readEnvFile(root,{...(options.env||process.env)}),fetchImpl=options.fetchImpl||globalThis.fetch;
 const apiKey=String(env.ASSEMBLYAI_API_KEY||"").trim();
 return http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/","http://localhost");
  try{
   if(req.method==="GET"&&url.pathname==="/api/assemblyai-token"){
    if(!apiKey)return json(res,503,{error:"ASSEMBLYAI_API_KEY is not configured on the streaming test server"});
    if(!fetchImpl)return json(res,503,{error:"Server fetch support is unavailable"});
    const upstream=await fetchImpl("https://streaming.assemblyai.com/v3/token?expires_in_seconds=60&max_session_duration_seconds=900",{headers:{Authorization:apiKey,Accept:"application/json"}});
    const value=await upstream.json().catch(()=>({}));
    if(!upstream.ok||!value.token)return json(res,upstream.status===401||upstream.status===403?401:502,{error:safeProviderMessage(value),providerStatus:upstream.status});
    return json(res,200,{token:String(value.token),expires_in_seconds:Number(value.expires_in_seconds)||60})
   }
   if(req.method!=="GET"&&req.method!=="HEAD")return json(res,405,{error:"Method not allowed"});
   const entry=PUBLIC_FILES.get(url.pathname);if(!entry)return json(res,404,{error:"Not found"});
   const [relative,mime]=entry,file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))return json(res,403,{error:"Forbidden"});
   const stat=await fs.promises.stat(file).catch(()=>null);if(!stat?.isFile())return json(res,404,{error:"Prototype file not found"});
   res.writeHead(200,{"content-type":mime,"content-length":stat.size,"cache-control":"no-store","x-content-type-options":"nosniff"});if(req.method==="HEAD")return res.end();fs.createReadStream(file).pipe(res)
  }catch(error){return json(res,502,{error:"Streaming token service unavailable",detail:String(error?.message||error).slice(0,160)})}
 })
}

if(require.main===module){const port=Math.max(1,Number(process.env.VOICE_STREAM_PORT)||8081),server=createVoiceStreamServer();server.listen(port,()=>console.log(`Streaming Voice Test: http://localhost:${port}/voice-stream-test.html`))}
module.exports={createVoiceStreamServer,readEnvFile};
