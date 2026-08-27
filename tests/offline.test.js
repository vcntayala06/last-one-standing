"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {chromium}=require("playwright");
const {createAppServer}=require("../server");

const ROOT=path.resolve(__dirname,"..");
const REQUIRED_FILES=[
 "index.html","app.css","app.js","host-provider.js","service-worker-register.js","question-bank-data.js",
 "question-bank-batch-1.js","question-bank-batch-2.js","question-bank-batch-3.js","question-bank-batch-4.js","question-bank-batch-5.js","question-bank-batch-6.js","question-bank-batch-7.js","question-bank-batch-8.js","question-bank-batch-9.js",
 "question-bank.js","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png"
];
const REVISIONED_SHELL_FILES=REQUIRED_FILES.filter(file=>file!=="index.html");

function shellRevision(){
 const hash=crypto.createHash("sha256");
 for(const file of REVISIONED_SHELL_FILES){hash.update(`${file}\0`);hash.update(fs.readFileSync(path.join(ROOT,file)));hash.update("\0")}
 return hash.digest("hex").slice(0,12);
}

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
 assert.equal(cacheVersion,`${build}-${shellRevision()}`,"service-worker cache version fingerprints the current production shell");
 for(const asset of ["app.css","app.js","service-worker-register.js"]){
  assert.match(index,new RegExp(`(?:href|src)="\\./${asset.replace(".","\\.")}\\?v=${cacheVersion}"`),`${asset} uses the current shell revision`);
 }
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
 const source=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
 const cacheVersion=source.match(/const CACHE_VERSION="([^"]+)"/)?.[1];
 const listeners={},deleted=[];
 const context={URL,self:{location:{origin:"https://example.test"},addEventListener:(type,listener)=>{listeners[type]=listener},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{keys:async()=>["last-one-standing-shell-6.23",`last-one-standing-shell-${cacheVersion}`,"unrelated-cache"],delete:async key=>{deleted.push(key);return true},open:async()=>({addAll:async()=>{}})},fetch:async()=>new Response("ok")};
 vm.runInNewContext(source,context,{filename:"service-worker.js"});
 let activation;listeners.activate({waitUntil:promise=>{activation=promise}});await activation;
 assert.deepEqual(deleted,["last-one-standing-shell-6.23"]);
});

test("updated worker serves one current shell, removes stale shells, and still starts offline",async()=>{
 const source=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
 const cacheVersion=source.match(/const CACHE_VERSION="([^"]+)"/)?.[1],currentName=`last-one-standing-shell-${cacheVersion}`,oldName="last-one-standing-shell-6.24";
 assert.notEqual(currentName,oldName,"the deployment advances beyond the original Build 6.24 shell cache");
 const listeners={},stores=new Map([[oldName,new Map([["./app.js",new Response("old app")],["./index.html",new Response("old index")]])]]),deleted=[];
 const cacheFor=name=>({
  addAll:async files=>{const store=stores.get(name)||new Map();for(const file of files)store.set(file,new Response(file==="./app.js"?"new app":file==="./index.html"?"new index":file));stores.set(name,store)},
  match:async request=>{const key=typeof request==="string"?request:new URL(request.url).pathname.split("/").pop();const store=stores.get(name),response=store?.get(key)||store?.get(`./${key}`);return response?.clone()}
 });
 const context={URL,self:{location:{origin:"https://example.test"},addEventListener:(type,listener)=>{listeners[type]=listener},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async name=>cacheFor(name),keys:async()=>[...stores.keys(),"unrelated-cache"],delete:async key=>{deleted.push(key);return stores.delete(key)}},fetch:async()=>{throw new Error("offline")}};
 vm.runInNewContext(source,context,{filename:"service-worker.js"});
 let install;listeners.install({waitUntil:promise=>{install=promise}});await install;
 assert.equal(await (await cacheFor(currentName).match("./app.js")).text(),"new app");
 let activation;listeners.activate({waitUntil:promise=>{activation=promise}});await activation;
 assert.equal(stores.has(oldName),false);assert.equal(stores.has(currentName),true);assert.deepEqual(deleted,[oldName]);
 let appResponse;listeners.fetch({request:{method:"GET",url:"https://example.test/project/app.js?v=stale",mode:"no-cors"},respondWith:promise=>{appResponse=promise}});
 assert.equal(await (await appResponse).text(),"new app","app.js comes only from the active shell cache");
 let navigation;listeners.fetch({request:{method:"GET",url:"https://example.test/project/?installed=1",mode:"navigate"},respondWith:promise=>{navigation=promise}});
 assert.equal(await (await navigation).text(),"new index","current cached index starts while offline");
});

test("registration exposes one user-controlled update action without a reload loop",async()=>{
 const listeners={},serviceWorkerListeners={},children=[];let updates=0,reloads=0;
 const makeButton=()=>{const handlers={};return{id:"",style:{},setAttribute(){},addEventListener(type,listener,options){handlers[type]={listener,once:options?.once}},click(){const entry=handlers.click;if(!entry)return;entry.listener();if(entry.once)delete handlers.click}}};
 const document={body:{appendChild:node=>children.push(node)},createElement:()=>makeButton(),getElementById:id=>children.find(node=>node.id===id)||null};
 const navigator={serviceWorker:{controller:{},addEventListener:(type,listener)=>{serviceWorkerListeners[type]=listener},register:async url=>{assert.equal(url,"./service-worker.js");return{update:async()=>{updates++}}}}};
 const context={window:{addEventListener:(type,listener)=>{listeners[type]=listener}},navigator,document,location:{reload:()=>{reloads++}},console};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,"service-worker-register.js"),"utf8"),context,{filename:"service-worker-register.js"});
 listeners.load();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(updates,1,"registration explicitly checks for a deployment update");
 serviceWorkerListeners.controllerchange();serviceWorkerListeners.controllerchange();
 assert.equal(children.length,1,"repeated controller changes create one update action");assert.equal(reloads,0,"activation never reloads an open game automatically");
 children[0].click();children[0].click();assert.equal(reloads,1,"the user action reloads exactly once");
});

test("service-worker update code cannot clear saved localStorage data",()=>{
 const worker=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8"),registration=fs.readFileSync(path.join(ROOT,"service-worker-register.js"),"utf8");
 assert.doesNotMatch(worker,/localStorage|indexedDB|storage\.clear/i);
 assert.doesNotMatch(registration,/localStorage\.(?:clear|removeItem)|indexedDB|storage\.clear/i);
});

test("installed game reloads and reaches a Champion through manual play with network removed",{timeout:90000},async()=>{
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
  const correctAnswer=await offlinePage.evaluate(()=>{const prompt=document.querySelector(".question-text")?.textContent?.trim(),sources=[window.LOS_QUESTION_BANK_DATA,window.LOS_QUESTION_BANK_BATCH_1,window.LOS_QUESTION_BANK_BATCH_2,window.LOS_QUESTION_BANK_BATCH_3,window.LOS_QUESTION_BANK_BATCH_4,window.LOS_QUESTION_BANK_BATCH_5,window.LOS_QUESTION_BANK_BATCH_6,window.LOS_QUESTION_BANK_BATCH_7,window.LOS_QUESTION_BANK_BATCH_8,window.LOS_QUESTION_BANK_BATCH_9];return sources.flatMap(source=>source.questions).find(question=>question.prompt===prompt)?.answer?.canonical||null});
  assert.ok(correctAnswer,"offline question resolves to its canonical answer");
  await offlinePage.locator("#typedAnswer").fill(correctAnswer);
  await offlinePage.locator("#lockAnswer").click();
  await offlinePage.locator(".result-correct").waitFor({state:"visible"});
  assert.match(await offlinePage.locator(".standing-row").filter({hasText:"Alex"}).textContent(),/✓\s*1/);
  await offlinePage.locator(".champion-name").waitFor({state:"visible",timeout:25000});
  assert.equal(await offlinePage.locator(".champion-name").textContent(),"Alex");
  assert.equal(await offlinePage.locator(".complete-stage").count(),1);
 }finally{if(context)await context.setOffline(false).catch(()=>{});await Promise.allSettled([context?.close(),browser?.close(),close(server)])}
});
