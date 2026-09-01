"use strict";

const CACHE_VERSION="6.38-6912cc3da6c1";
const CACHE_NAME=`last-one-standing-shell-${CACHE_VERSION}`;
const APP_SHELL=[
 "./",
 "./index.html",
 "./app.css",
 "./app.js",
 "./assets/visual-6.36/references/LOS_HOME_6_36_LANDSCAPE_FINAL.png",
 "./assets/visual-6.36/references/LOS_HOME_6_36_PORTRAIT_FINAL.png",
 "./assets/visual-6.36/references/LOS_HOME_6_36_ULTRAWIDE_FINAL.png",
 "./assets/visual-6.36/references/LOS_YOURE_UP_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_YOURE_UP_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_YOURE_UP_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_QUESTION_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_QUESTION_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_QUESTION_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_CORRECT_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_CORRECT_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_CORRECT_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_WRONG_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_WRONG_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_WRONG_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_TIMES_UP_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_TIMES_UP_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_TIMES_UP_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_CURRENT_STANDINGS_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_CURRENT_STANDINGS_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_CURRENT_STANDINGS_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_ELIMINATED_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_ELIMINATED_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_ELIMINATED_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_FINAL_SHOWDOWN_MATCHUP_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_FINAL_SHOWDOWN_MATCHUP_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_FINAL_SHOWDOWN_MATCHUP_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_FINAL_SHOWDOWN_QUESTION_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_FINAL_SHOWDOWN_QUESTION_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_FINAL_SHOWDOWN_QUESTION_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_PAUSE_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_PAUSE_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_PAUSE_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_WINNER_6_36_LANDSCAPE_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_WINNER_6_36_PORTRAIT_RUNTIME.png",
 "./assets/visual-6.36/references/LOS_WINNER_6_36_ULTRAWIDE_RUNTIME.png",
 "./assets/visual-6.36/los-avatar-atlas-v2.png",
 "./assets/visual-6.36/los-avatar-style-expansion-v3.png",
 "./host-provider.js",
 "./service-worker-register.js",
 "./question-bank-data.js",
 "./question-bank-batch-1.js",
 "./question-bank-batch-2.js",
 "./question-bank-batch-3.js",
 "./question-bank-batch-4.js",
 "./question-bank-batch-5.js",
 "./question-bank-batch-6.js",
 "./question-bank-batch-7.js",
 "./question-bank-batch-8.js",
 "./question-bank-batch-9.js",
 "./question-bank-batch-10.js",
 "./question-bank.js",
 "./manifest.webmanifest",
 "./apple-touch-icon.png",
 "./icon-192.png",
 "./icon-512.png"
];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("last-one-standing-shell-")&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.includes("/api/"))return;
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).catch(()=>caches.open(CACHE_NAME).then(cache=>cache.match("./index.html"))));
  return;
 }
 event.respondWith(caches.open(CACHE_NAME).then(cache=>cache.match(request,{ignoreSearch:true})).then(cached=>cached||fetch(request)));
});
