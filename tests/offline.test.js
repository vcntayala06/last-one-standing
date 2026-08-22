"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {chromium}=require("playwright");
const {createAppServer}=require("../server");

const ROOT=path.resolve(__dirname,"..");
const REQUIRED_FILES=[
 "index.html","app.css","app.js","host-provider.js","service-worker-register.js","question-bank-data.js",
 "question-bank-batch-1.js","question-bank-batch-2.js","question-bank-batch-3.js",
 "question-bank.js","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png"
];

function listen(server){return new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",()=>resolve(`http://127.0.0.1:${server.address().port}`))})}
function close(server){return server.listening?new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())):Promise.resolve()}
function launch(){
 const bundled=path.join(process.env.LOCALAPPDATA||"","ms-playwright","chromium-1234","chrome-win64","chrome.exe");
 return chromium.launch({headless:true,...(fs.existsSync(bundled)?{executablePath:bundled}:{})});
}

test("Build 6.24 service worker precaches the complete production shell",()=>{
 const source=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
 const appSource=fs.readFileSync(path.join(ROOT,"app.js"),"utf8"),index=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
 const build=appSource.match(/const BUILD_INFO=\{stage:"([^"]+)"/)?.[1];
 const cacheVersion=source.match(/const CACHE_VERSION="([^"]+)"/)?.[1];
 assert.ok(build,"app.js exposes a production build stage");
 assert.equal(cacheVersion,build,"service-worker cache version matches the production build");
 for(const file of REQUIRED_FILES){
  assert.equal(fs.existsSync(path.join(ROOT,file)),true,`${file} exists`);
  assert.match(source,new RegExp(`"\\./${file.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}"`),`${file} is precached`);
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,"manifest.webmanifest"),"utf8"));
 assert.match(index,new RegExp(`<title>[^<]*Build ${build.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}<\\/title>`));
 assert.match(manifest.name,new RegExp(`Build ${build.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`));
 assert.equal(manifest.start_url,`./?build=${build}`);
 assert.equal(manifest.scope,"./");
 assert.equal(manifest.id,"./?app=last-one-standing-6-0-8");
});

test("Build 6.24 activation removes an older app-shell cache only",async()=>{
 const listeners={},deleted=[];
 const context={URL,self:{location:{origin:"https://example.test"},addEventListener:(type,listener)=>{listeners[type]=listener},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{keys:async()=>["last-one-standing-shell-6.23","last-one-standing-shell-6.24","unrelated-cache"],delete:async key=>{deleted.push(key);return true},open:async()=>({addAll:async()=>{}}),match:async()=>null},fetch:async()=>new Response("ok")};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8"),context,{filename:"service-worker.js"});
 let activation;listeners.activate({waitUntil:promise=>{activation=promise}});await activation;
 assert.deepEqual(deleted,["last-one-standing-shell-6.23"]);
});

test("installed game reloads and reaches a Champion through manual play with network removed",{timeout:60000},async()=>{
 const server=createAppServer({rootDir:ROOT,env:{},loadEnvFile:false});
 let browser=null,context=null;
 try{
  const base=await listen(server);browser=await launch();context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(base,{waitUntil:"load"});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}))});
  await page.reload({waitUntil:"load"});
  assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),true);

  const saved={version:1,savedAt:Date.now(),mode:"original",quick:false,duration:15,questionSeconds:1,categories:[],industry:"",difficulty:"medium",answerLanguage:"en",readQuestions:false,players:[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}],game:{players:[{id:"p1",name:"Alex",correct:0,wrong:0,timeout:0,strikes:2,eliminated:false},{id:"p2",name:"Blair",correct:1,wrong:0,timeout:0,strikes:2,eliminated:false}],startingCount:2,idx:0,qnum:1,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:""}};
  await page.evaluate(payload=>{localStorage.setItem("los5_voice","false");localStorage.setItem("los5_read_questions","false");localStorage.setItem("los5_active_game",JSON.stringify(payload))},saved);

  await context.setOffline(true);
  const offlinePage=await context.newPage();
  await offlinePage.goto(`${base}/?offline-test=1`,{waitUntil:"load"});
  await offlinePage.locator("#resumeSaved").click();
  await offlinePage.locator("#typedAnswer").waitFor({state:"visible",timeout:10000});
  assert.equal(await offlinePage.locator("#typedAnswer").isEnabled(),true);
  const correctAnswer=await offlinePage.evaluate(()=>{const prompt=document.querySelector(".question-text")?.textContent?.trim(),sources=[window.LOS_QUESTION_BANK_DATA,window.LOS_QUESTION_BANK_BATCH_1,window.LOS_QUESTION_BANK_BATCH_2,window.LOS_QUESTION_BANK_BATCH_3];return sources.flatMap(source=>source.questions).find(question=>question.prompt===prompt)?.answer?.canonical||null});
  assert.ok(correctAnswer,"offline question resolves to its canonical answer");
  await offlinePage.locator("#typedAnswer").fill(correctAnswer);
  await offlinePage.locator("#lockAnswer").click();
  await offlinePage.locator(".result-correct").waitFor({state:"visible"});
  assert.match(await offlinePage.locator(".standing-row").filter({hasText:"Alex"}).textContent(),/✓\s*1/);
  await offlinePage.locator(".champion-name").waitFor({state:"visible",timeout:25000});
  assert.equal(await offlinePage.locator(".champion-name").textContent(),"Alex");
  assert.equal(await offlinePage.locator(".complete-stage").count(),1);
 }finally{await Promise.allSettled([context?.close(),browser?.close(),close(server)])}
});
