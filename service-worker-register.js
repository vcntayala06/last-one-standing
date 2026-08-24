"use strict";

if("serviceWorker" in navigator){
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
