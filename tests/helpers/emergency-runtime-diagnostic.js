"use strict";

const { chromium } = require("playwright");

(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 const events=[];
 page.on("pageerror",error=>events.push({type:"pageerror",message:error.message,stack:error.stack}));
 page.on("console",message=>{if(message.type()==="error")events.push({type:"console",message:message.text()})});
 page.on("requestfailed",request=>events.push({type:"requestfailed",url:request.url(),failure:request.failure()}));
 page.on("response",response=>{if(response.status()>=400)events.push({type:"response",status:response.status(),url:response.url()})});
 const response=await page.goto(process.env.LOS_BASE_URL||"http://127.0.0.1:8087/",{waitUntil:"networkidle"});
 const initial=await page.evaluate(()=>({title:document.title,appText:document.querySelector("#app")?.innerText,home:!!document.querySelector(".los-home-final"),play:!!document.querySelector("#start"),serviceWorker:!!navigator.serviceWorker?.controller}));
 const smoke={};
 try{
  await page.click("#homeHow");smoke.how=await page.locator(".los-home-dialog").getByText("HOW TO PLAY",{exact:true}).isVisible();await page.click(".los-home-dialog [data-close]");
  await page.click("#homeSettings");smoke.settings=await page.locator(".los-home-dialog").getByText("SETTINGS",{exact:true}).isVisible();const mic=page.locator("[data-settings-mic]");if(await mic.getAttribute("aria-pressed")==="true")await mic.click();await page.click(".los-home-dialog [data-close]");
  await page.click("#start");await page.waitForTimeout(250);smoke.chooseGame=await page.locator(".topbar-title").getByText("CHOOSE YOUR GAME",{exact:true}).isVisible();
  await page.click("#back");await page.waitForTimeout(250);smoke.back=await page.locator("#start").isVisible();
  await page.click("#start");await page.waitForTimeout(250);await page.click("#continuePacks");await page.waitForTimeout(250);smoke.whosIn=await page.getByText("WHO’S IN?",{exact:true}).isVisible();
  await page.click("[data-setup-exit]");await page.waitForTimeout(250);smoke.exit=await page.locator("#start").isVisible();
  await page.click("#start");await page.waitForTimeout(250);await page.click("#continuePacks");await page.waitForTimeout(250);
  for(const name of ["Alex","Blair"]){await page.click("#add");await page.locator('.los-player-sheet input[name="firstName"]').fill(name);await page.click('.los-player-sheet button[type="submit"]')}
  await page.click("#continue");await page.waitForTimeout(250);smoke.showtime=await page.locator("#showtimeStart").isVisible();
  await page.click("#showtimeStart");smoke.playerUp=await page.locator("#playerUpMessage").isVisible();
  await page.waitForSelector("#typedAnswer",{timeout:8000});smoke.question=await page.locator("#typedAnswer").isEnabled();
 }catch(error){smoke.error=error.message;smoke.stack=error.stack}
 const pwa=await page.evaluate(async()=>{if(!navigator.serviceWorker)return{supported:false};const registration=await Promise.race([navigator.serviceWorker.ready,new Promise(resolve=>setTimeout(()=>resolve(null),5000))]);return{supported:true,ready:!!registration,active:registration?.active?.state||null}});
 console.log(JSON.stringify({status:response?.status(),initial,smoke,pwa,events},null,2));
 await browser.close();
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
