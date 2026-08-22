"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {createHarness,FakeSpeechRecognition}=require("./helpers/harness");

function lifecycleHarness(options={}){
 const h=createHarness(options);let visibility="visible";
 Object.defineProperty(h.document,"visibilityState",{configurable:true,get:()=>visibility});
 return {...h,hide(){visibility="hidden";h.document.dispatchEvent(new h.window.Event("visibilitychange"))},show(){visibility="visible";h.document.dispatchEvent(new h.window.Event("visibilitychange"))},pagehide(){const event=new h.window.Event("pagehide");Object.defineProperty(event,"persisted",{value:true});h.window.dispatchEvent(event)},pageshow(){const event=new h.window.Event("pageshow");Object.defineProperty(event,"persisted",{value:true});h.window.dispatchEvent(event)}}
}
function activeQuestion(h){
 const state=h.api.getState();state.mode="original";state.voiceOn=true;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.game={players:state.players.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),startingCount:2,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:""};h.api.question();return state
}

test("hidden page invalidates recognition and prevents automatic restart",()=>{
 const h=lifecycleHarness();try{const old=h.recognition(),count=FakeSpeechRecognition.instances.length;h.hide();assert.equal(h.recognition(),null);assert.equal(old.started,false);old.end();h.timers.advance(5000);assert.equal(FakeSpeechRecognition.instances.length,count)}finally{h.close()}
});

test("visible return restores one recognizer with the current owner",()=>{
 const h=lifecycleHarness();try{const state=h.api.getState();state.screen="difficulty";h.api.difficulty();h.hide();const count=FakeSpeechRecognition.instances.length;h.show();assert.equal(FakeSpeechRecognition.instances.length,count+1);assert.ok(h.recognition()?.started);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().recognition.owner.screen,"difficulty");h.show();h.pageshow();assert.equal(FakeSpeechRecognition.instances.length,count+1)}finally{h.close()}
});

test("visible return respects Voice Off and permission blocking",()=>{
 {const h=lifecycleHarness();try{const state=h.api.getState();h.hide();const count=FakeSpeechRecognition.instances.length;state.voiceOn=false;h.show();assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,count)}finally{h.close()}}
 {const h=lifecycleHarness();try{const old=h.recognition();old.error("not-allowed");h.hide();const count=FakeSpeechRecognition.instances.length;h.show();assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,count)}finally{h.close()}}
});

test("stale pre-interruption callbacks cannot score and recovery scores once",()=>{
 const h=lifecycleHarness();try{const state=activeQuestion(h),old=h.recognition(),staleResult=old.onresult,answer=state.game.current.a;h.hide();h.show();const current=h.recognition();assert.notEqual(current,old);const result=[{transcript:answer,confidence:1}];result.isFinal=true;staleResult({resultIndex:0,results:[result]});assert.equal(state.game.players[0].correct,0);assert.equal(state.screen,"question");current.emit(answer,{final:true,confidence:1});assert.equal(state.game.players[0].correct,1);assert.equal(state.screen,"result");staleResult({resultIndex:0,results:[result]});assert.equal(state.game.players[0].correct,1)}finally{h.close()}
});

test("pagehide and repeated lifecycle events never create duplicate recognizers",()=>{
 const h=lifecycleHarness();try{h.pagehide();h.pagehide();const count=FakeSpeechRecognition.instances.length;assert.equal(h.recognition(),null);h.pageshow();assert.equal(FakeSpeechRecognition.instances.length,count+1);h.pageshow();h.show();assert.equal(FakeSpeechRecognition.instances.length,count+1)}finally{h.close()}
});

test("Host playback spanning hide and show owns recognition recovery",async()=>{
 let finishPlayback;const provider={available:true,play:()=>new Promise(resolve=>{finishPlayback=resolve}),cancel(){},setVolume(){}};const h=lifecycleHarness({hostProvider:provider});try{const host=h.api.getHostSystem(),before=FakeSpeechRecognition.instances.length;assert.equal(host.emit("questionRead",{question:"Test question",name:"Alex"}),true);assert.equal(h.recognition(),null);h.hide();h.show();assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,before);finishPlayback();await new Promise(resolve=>setImmediate(resolve));assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,before+1)}finally{h.close()}
});

test("Host completion while hidden waits for foreground recovery",async()=>{
 let finishPlayback;const provider={available:true,play:()=>new Promise(resolve=>{finishPlayback=resolve}),cancel(){},setVolume(){}};const h=lifecycleHarness({hostProvider:provider});try{const host=h.api.getHostSystem(),before=FakeSpeechRecognition.instances.length;assert.equal(host.emit("questionRead",{question:"Test question",name:"Alex"}),true);h.hide();finishPlayback();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,before);h.show();assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,before+1);h.show();assert.equal(FakeSpeechRecognition.instances.length,before+1)}finally{h.close()}
});

test("hiding cancels the error watchdog until foreground recovery",()=>{
 const h=lifecycleHarness();try{const old=h.recognition(),before=FakeSpeechRecognition.instances.length;old.error("network");h.timers.advance(199);assert.equal(h.recognition(),old);h.hide();h.timers.advance(5000);assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,before);h.show();assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,before+1)}finally{h.close()}
});

test("bounded retry behavior remains active only while visible",()=>{
 const h=lifecycleHarness();try{const first=h.recognition(),before=FakeSpeechRecognition.instances.length;FakeSpeechRecognition.startFailures=1;first.end();h.timers.advance(25);assert.equal(FakeSpeechRecognition.instances.length,before+1);assert.equal(h.recognition(),null);h.hide();h.timers.advance(5000);assert.equal(FakeSpeechRecognition.instances.length,before+1);h.show();assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,before+2)}finally{h.close()}
});
