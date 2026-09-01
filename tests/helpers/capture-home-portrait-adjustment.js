"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");

(async()=>{
 const width=Number(process.env.LOS_WIDTH||390),height=Number(process.env.LOS_HEIGHT||844),output=path.resolve(`test-results/home-6.36-portrait-play-adjustment/phone-portrait-${width}x${height}.png`);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:"block"}),errors=[];
  page.on("pageerror",error=>errors.push(error.message));page.on("console",message=>{if(message.type()==="error")errors.push(message.text())});
  await page.goto(process.env.LOS_BASE_URL||"http://127.0.0.1:8090/",{waitUntil:"networkidle"});
  const result=await page.evaluate(()=>{const plate=getComputedStyle(document.querySelector(".los-home-plate")),play=document.querySelector("#start").getBoundingClientRect();return{asset:plate.backgroundImage,play:{top:play.top,bottom:play.bottom,left:play.left,right:play.right},viewport:{width:innerWidth,height:innerHeight}}});
  await page.click("#homeHow");result.howToPlay=await page.locator(".los-home-dialog").getByText("HOW TO PLAY",{exact:true}).isVisible();await page.click(".los-home-dialog [data-close]");
  await page.click("#homeSettings");result.settings=await page.locator(".los-home-dialog").getByText("SETTINGS",{exact:true}).isVisible();await page.click(".los-home-dialog [data-close]");
  await page.screenshot({path:output,animations:"disabled"});
  await page.click("#start");await page.waitForTimeout(250);result.destination=await page.locator(".topbar-title").innerText();result.errors=errors;
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
