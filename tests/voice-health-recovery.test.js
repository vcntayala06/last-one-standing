"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {createHarness,FakeSpeechRecognition}=require("./helpers/harness");

function activeQuestion(h){
 const state=h.api.getState();state.mode="original";state.voiceOn=true;state.readQuestions=false;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.game={players:state.players.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),startingCount:2,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:""};h.api.question();return state
}
const health=h=>h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().recognition;

test("start requested without onstart remains a distinct diagnostic phase",()=>{
 const original=FakeSpeechRecognition.prototype.start;FakeSpeechRecognition.prototype.start=function(){this.started=true};
 const h=createHarness({voiceHealth:true});try{const s=health(h);assert.equal(s.state,"starting");assert.equal(s.healthPhase,"start-requested");assert.match(h.document.getElementById("voiceHealthPanel").textContent,/phase: STARTING/)}finally{h.close();FakeSpeechRecognition.prototype.start=original}
});

test("listening, audio, sound, speech, and transcript are distinct without inactivity restarts",()=>{
 const h=createHarness();try{const r=h.recognition(),count=FakeSpeechRecognition.instances.length;assert.equal(health(h).healthPhase,"recognition-started");r.audioStart();assert.equal(health(h).healthPhase,"audio-detected");h.timers.advance(5000);assert.equal(FakeSpeechRecognition.instances.length,count);assert.equal(h.recognition(),r);r.soundStart();assert.equal(health(h).healthPhase,"sound-detected");h.timers.advance(5000);assert.equal(FakeSpeechRecognition.instances.length,count);r.speechStart();assert.equal(health(h).healthPhase,"waiting-for-transcript");r.emit("not a command",{final:true});assert.equal(health(h).healthPhase,"transcript-received")}finally{h.close()}
});

test("speech may wait for a later valid result which scores exactly once",()=>{
 const h=createHarness();try{const state=activeQuestion(h),r=h.recognition();state.game.current={id:"health-answer",q:"What planet is red?",a:"Mars"};r.speechStart();assert.equal(health(h).healthPhase,"waiting-for-transcript");h.timers.advance(500);assert.equal(state.game.players[0].correct,0);r.emit("Mars",{final:true});assert.equal(health(h).healthPhase,"transcript-received");assert.equal(state.game.players[0].correct,1);assert.equal(state.screen,"result")}finally{h.close()}
});

test("manual recovery replaces exactly one recognizer and ignores every stale callback",()=>{
 const h=createHarness();try{const state=activeQuestion(h),old=h.recognition(),before=FakeSpeechRecognition.instances.length,stale=[old.onaudiostart,old.onsoundstart,old.onspeechstart,old.onspeechend,old.onsoundend,old.onaudioend],staleResult=old.onresult;state.game.current={id:"stale-health",q:"What planet is red?",a:"Mars"};h.click("#retryMic");const current=h.recognition(),phase=health(h).healthPhase;assert.notEqual(current,old);assert.equal(FakeSpeechRecognition.instances.length,before+1);assert.equal(old.started,false);stale.forEach(callback=>callback());assert.equal(health(h).healthPhase,phase);const result=[{transcript:"Mars",confidence:1}];result.isFinal=true;staleResult({resultIndex:0,results:[result]});assert.equal(state.game.players[0].correct,0);assert.equal(state.screen,"question");current.emit("Mars",{final:true});assert.equal(state.game.players[0].correct,1)}finally{h.close()}
});

test("manual recovery cancels an already scheduled onend restart",()=>{
 const h=createHarness();try{activeQuestion(h);const old=h.recognition(),before=FakeSpeechRecognition.instances.length;old.end();assert.equal(h.recognition(),null);h.click("#retryMic");const replacement=h.recognition();assert.ok(replacement?.started);assert.equal(FakeSpeechRecognition.instances.length,before+1);h.timers.advance(25);h.timers.advance(5000);assert.equal(h.recognition(),replacement);assert.equal(FakeSpeechRecognition.instances.length,before+1)}finally{h.close()}
});

test("repeated immediate recovery requests cannot create duplicate recognizers",()=>{
 const h=createHarness();try{activeQuestion(h);const button=h.document.getElementById("retryMic"),before=FakeSpeechRecognition.instances.length;button.click();const replacement=h.recognition();button.click();button.click();assert.equal(h.recognition(),replacement);assert.equal(FakeSpeechRecognition.instances.length,before+1);assert.ok(h.api.getVoiceDiagnostics().some(x=>x.stage==="manual-recovery-blocked"&&x.reason==="duplicate-request"))}finally{h.close()}
});

test("manual recovery is blocked while hidden, Voice Off, permission blocked, or Host suppressed",async()=>{
 {const h=createHarness();try{activeQuestion(h);let visibility="hidden";Object.defineProperty(h.document,"visibilityState",{configurable:true,get:()=>visibility});h.document.dispatchEvent(new h.window.Event("visibilitychange"));const before=FakeSpeechRecognition.instances.length;h.click("#retryMic");assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,before);visibility="visible"}finally{h.close()}}
 {const h=createHarness();try{const state=activeQuestion(h),button=h.document.getElementById("retryMic"),current=h.recognition(),before=FakeSpeechRecognition.instances.length;state.voiceOn=false;button.click();assert.equal(h.recognition(),current);assert.equal(FakeSpeechRecognition.instances.length,before)}finally{h.close()}}
 {const h=createHarness();try{activeQuestion(h);const old=h.recognition(),before=FakeSpeechRecognition.instances.length;old.error("not-allowed");h.click("#retryMic");assert.equal(h.recognition(),old);assert.equal(FakeSpeechRecognition.instances.length,before)}finally{h.close()}}
 let finish;const provider={available:true,play:()=>new Promise(resolve=>{finish=resolve}),cancel(){},setVolume(){}};const h=createHarness({hostProvider:provider});try{activeQuestion(h);const before=FakeSpeechRecognition.instances.length;h.api.getHostSystem().emit("questionRead",{question:"Test?",name:"Alex"});assert.equal(h.recognition(),null);h.click("#retryMic");assert.equal(FakeSpeechRecognition.instances.length,before);finish();await new Promise(resolve=>setImmediate(resolve));assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,before+1)}finally{h.close()}
});

test("recovery button availability reflects Voice, API, Host, and permission state",async()=>{
 {const h=createHarness();try{activeQuestion(h);const button=h.document.getElementById("retryMic");assert.ok(button);assert.equal(button.disabled,false);assert.equal(button.textContent,"TRY MIC AGAIN")}finally{h.close()}}
 {const h=createHarness();try{const state=h.api.getState();state.voiceOn=false;activeQuestion(h);state.voiceOn=false;h.api.question();assert.equal(h.document.getElementById("retryMic"),null)}finally{h.close()}}
 {const h=createHarness({speechApi:"none"});try{activeQuestion(h);assert.equal(h.document.getElementById("retryMic"),null)}finally{h.close()}}
 {let finish;const provider={available:true,play:()=>new Promise(resolve=>{finish=resolve}),cancel(){},setVolume(){}};const h=createHarness({hostProvider:provider});try{activeQuestion(h);h.api.getHostSystem().emit("questionRead",{question:"Test?",name:"Alex"});const button=h.document.getElementById("retryMic");assert.equal(button.disabled,true);assert.equal(button.getAttribute("aria-disabled"),"true");assert.equal(button.textContent,"HOST SPEAKING");finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(button.disabled,false);assert.equal(button.textContent,"TRY MIC AGAIN")}finally{h.close()}}
 {const h=createHarness();try{activeQuestion(h);h.recognition().error("not-allowed");const button=h.document.getElementById("retryMic");assert.equal(button.disabled,true);assert.equal(button.getAttribute("aria-disabled"),"true");assert.equal(button.textContent,"MIC PERMISSION NEEDED")}finally{h.close()}}
});

test("manual recovery preserves the running question timer and never scores by itself",()=>{
 const h=createHarness();try{const state=activeQuestion(h);h.timers.advance(2000);const remaining=state.game.questionRemaining,player=state.game.players[0];h.click("#retryMic");assert.equal(state.game.questionRemaining,remaining);assert.equal(player.correct,0);assert.equal(player.wrong,0);assert.equal(player.strikes,0);h.timers.advance(1000);assert.equal(state.game.questionRemaining,remaining-1)}finally{h.close()}
});

test("a rejected transcript remains transcript activity rather than microphone failure",()=>{
 const h=createHarness();try{const state=activeQuestion(h);state.game.current={id:"rejected-health",q:"What planet is red?",a:"Mars"};h.recognition().emit("Venus",{final:true});assert.equal(state.screen,"question");assert.equal(health(h).healthPhase,"transcript-received");assert.ok(h.api.getVoiceDiagnostics().some(x=>x.stage==="answer-match-produced"&&x.accepted===false));assert.equal(h.document.getElementById("answerAttemptFeedback").textContent,"TRY AGAIN")}finally{h.close()}
});
