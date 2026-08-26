"use strict";

const CACHE_VERSION="6.31-75710239699b";
const CACHE_NAME=`last-one-standing-shell-${CACHE_VERSION}`;
const APP_SHELL=[
 "./",
 "./index.html",
 "./app.css",
 "./app.js",
 "./host-provider.js",
 "./service-worker-register.js",
 "./question-bank-data.js",
 "./question-bank-batch-1.js",
 "./question-bank-batch-2.js",
 "./question-bank-batch-3.js",
 "./question-bank-batch-4.js",
 "./question-bank-batch-5.js",
 "./question-bank-batch-6.js",
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
