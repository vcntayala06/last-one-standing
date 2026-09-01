"use strict";

const LOS_LOCAL_HOSTS=new Set(["localhost","127.0.0.1","::1"]),LOS_IS_LOCAL=LOS_LOCAL_HOSTS.has(location.hostname);

if(LOS_IS_LOCAL){
 Promise.all([
 "serviceWorker" in navigator?navigator.serviceWorker.getRegistrations().then(registrations=>Promise.all(registrations.map(registration=>registration.unregister()))):Promise.resolve(),
  "caches" in window?caches.keys().then(names=>Promise.all(names.map(name=>caches.delete(name)))):Promise.resolve()
 ]).then(()=>{
  document.documentElement.dataset.losLocalServiceWorker=navigator.serviceWorker?.controller?"controlled":"none";
  document.documentElement.dataset.losLocalCacheStorage="cleared";
 }).catch(error=>{
  document.documentElement.dataset.losLocalServiceWorker=navigator.serviceWorker?.controller?"controlled":"none";
  document.documentElement.dataset.losLocalCacheStorage="cleanup-error";
  console.warn("Local cache cleanup could not complete.",error);
 });
}else if("serviceWorker" in navigator){
 window.addEventListener("load",()=>{
  let hadController=Boolean(navigator.serviceWorker.controller);
  const showUpdateReady=()=>{
   if(document.getElementById("pwaUpdateReady"))return;
   const button=document.createElement("button");
   button.id="pwaUpdateReady";
   button.type="button";
   button.textContent="UPDATE READY · RELOAD";
   button.setAttribute("aria-label","Update ready. Reload Last One Standing.");
   Object.assign(button.style,{position:"fixed",right:"max(12px, env(safe-area-inset-right))",bottom:"max(12px, env(safe-area-inset-bottom))",zIndex:"10000",padding:"12px 16px",border:"2px solid currentColor",borderRadius:"8px",background:"#111",color:"#fff",font:"700 14px system-ui, sans-serif",cursor:"pointer"});
   button.addEventListener("click",()=>location.reload(),{once:true});
   document.body.appendChild(button);
  };
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
   if(hadController)showUpdateReady();
   hadController=true;
  });
  navigator.serviceWorker.register("./service-worker.js").then(registration=>registration.update()).catch(error=>{
   console.warn("Offline support could not be enabled.",error);
  });
 });
}
