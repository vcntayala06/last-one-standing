"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {createHarness,FakeSpeechRecognition}=require("./helpers/harness");

class FakeNaturalHostProvider{
 constructor(){this.available=true;this.calls=[];this.cancels=[];this.pending=[];this.volumes=[]}
 play(cue){this.calls.push(cue);return new Promise(resolve=>this.pending.push(resolve))}
 cancel(reason){this.cancels.push(reason);this.pending.splice(0).forEach(resolve=>resolve())}
 setVolume(value){this.volumes.push(value)}
 finish(){this.pending.splice(0).forEach(resolve=>resolve())}
}

const settle=()=>new Promise(resolve=>setImmediate(resolve));

test("Host events never mutate scoring or gameplay timing",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.game={players:[{id:"p1",name:"Alex",correct:2,strikes:1}],idx:0,questionRemaining:7};const before=JSON.stringify(state.game);h.window.Math.random=()=>0;host.emit("correct",{name:"Alex",remaining:7});assert.equal(JSON.stringify(state.game),before);assert.equal(host.history.at(-1).result,"provider-unavailable")}finally{h.close()}
});

test("Work Edition filters non-work-safe Host reactions",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.mode="work";h.window.Math.random=()=>.999;for(let i=0;i<12;i++){const line=host.choose("correct",{name:"Alex"});assert.ok(line);assert.equal(line.workSafe,true);assert.ok(!/damn/i.test(line.text))}}finally{h.close()}
});

test("Host priority prevents stacked low-priority speech and interrupts for Champion",()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const host=h.api.getHostSystem();h.window.Math.random=()=>0;assert.equal(host.emit("fastCorrect",{name:"Alex"}),true);assert.equal(provider.calls.length,1);assert.equal(host.emit("turn",{name:"Blair"}),false);assert.equal(provider.calls.length,1);assert.equal(host.emit("champion",{name:"Alex"}),true);assert.equal(provider.calls.length,2);assert.ok(provider.cancels.some(x=>String(x).includes("champion")));assert.equal(provider.calls[1].event,"champion")}finally{h.close()}
});

test("Host playback suppresses recognition, ignores stale results, and resumes safely",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState(),host=h.api.getHostSystem(),old=h.recognition(),count=FakeSpeechRecognition.instances.length;state.screen="mode";h.api.mode();h.window.Math.random=()=>0;host.emit("opening",{});assert.equal(h.recognition(),null);old.emit("solo");assert.equal(state.screen,"mode");provider.finish();await settle();assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,count+1);assert.equal(state.screen,"mode")}finally{h.close()}
});

test("Voice Off remains off when Host playback finishes",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState(),host=h.api.getHostSystem();h.window.Math.random=()=>0;host.emit("opening",{});state.voiceOn=false;provider.finish();await settle();assert.equal(h.recognition(),null);assert.equal(state.voiceOn,false)}finally{h.close()}
});

test("Home and runtime transitions cancel obsolete Host speech",()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const host=h.api.getHostSystem();h.window.Math.random=()=>0;host.emit("opening",{});assert.equal(provider.calls.length,1);h.api.home();assert.equal(host.isSpeaking(),false);assert.ok(provider.cancels.includes("home"));h.timers.advance(10000);assert.equal(h.api.getState().screen,"home")}finally{h.close()}
});

test("First turn, speed, streak, showdown, and Champion events are emitted without delaying flow",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.window.Math.random=()=>0;h.api.startGame();assert.ok(host.history.some(x=>x.event==="firstTurn"));const game=state.game;game.current={q:"What planet?",a:"Mars",cat:"Science & Nature"};game.answered=false;game.questionStartedWith=15;game.questionRemaining=13;h.api.finish("correct");assert.ok(host.history.some(x=>x.event==="fastCorrect"));assert.equal(game.players[0].correct,1);game.players.forEach(p=>{p.eliminated=false;p.strikes=0});game.startingCount=2;h.api.showdownIntro();assert.ok(host.history.some(x=>x.event==="showdown"));h.api.champion(game.players[0]);assert.ok(host.history.some(x=>x.event==="champion"));assert.equal(state.screen,"complete")}finally{h.close()}
});

test("Host provider follows canonical master volume",()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{h.api.setVolume(.35);assert.equal(provider.volumes.at(-1),.35);h.api.getHostSystem().emit("opening",{});assert.equal(provider.calls.at(-1).volume,.35)}finally{h.close()}
});

test("natural Host playback failure releases the microphone and never blocks gameplay",async()=>{
 const provider={available:true,play:()=>Promise.reject(new Error("provider unavailable")),cancel(){},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState(),host=h.api.getHostSystem();state.screen="mode";h.api.mode();h.window.Math.random=()=>0;host.emit("opening",{});assert.equal(h.recognition(),null);await settle();assert.equal(host.isSpeaking(),false);assert.ok(h.recognition()?.started);assert.equal(state.screen,"mode")}finally{h.close()}
});

test("Showtime welcomes once and waits for Host completion before creating the game",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState(),host=h.api.getHostSystem();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.window.Math.random=()=>0;h.api.ready();assert.equal(provider.calls[0].event,"showtime");assert.match(provider.calls[0].text,/Alex, Blair/);assert.match(provider.calls[0].text,/15 seconds/);h.timers.advance(19999);assert.equal(state.screen,"ready");assert.equal(state.game,null);provider.finish();await settle();assert.equal(state.screen,"handoff");assert.ok(state.game);assert.equal(host.history.filter(x=>x.event==="showtime").length,1);assert.equal(provider.calls.at(-1).event,"firstTurn")}finally{h.close()}
});

test("Showtime timeout degrades to explicit Start instead of treating Host failure as completion",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.window.Math.random=()=>0;h.api.ready();h.timers.advance(19999);assert.equal(state.screen,"ready");h.timers.advance(1);await settle();assert.equal(state.screen,"ready");assert.equal(state.game,null);assert.ok(provider.cancels.includes("showtime-timeout"));assert.match(h.document.getElementById("showtimeStatus").textContent,/TIMED OUT/);h.click("#showtimeStart");assert.equal(state.screen,"handoff");assert.ok(state.game)}finally{h.close()}
});

test("Showtime Exit cancels pending Host work and stale completion cannot relaunch",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.api.ready();h.click("[data-setup-exit]");assert.equal(state.screen,"home");assert.equal(state.game,null);provider.finish();await settle();h.timers.advance(30000);assert.equal(state.screen,"home");assert.equal(state.game,null)}finally{h.close()}
});

test("Showtime Back cancels pending Host work and returns to Who's In",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.api.ready();h.click("#back");assert.equal(state.screen,"players");assert.equal(state.game,null);provider.finish();await settle();h.timers.advance(30000);assert.equal(state.screen,"players");assert.equal(state.game,null)}finally{h.close()}
});

test("first-player Host line protects the question clock and microphone recovery",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.window.Math.random=()=>0;h.api.ready();provider.finish();await settle();assert.equal(state.screen,"handoff");assert.equal(provider.calls.at(-1).event,"firstTurn");assert.match(provider.calls.at(-1).text,/Alex/);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"stopped");provider.finish();await settle();assert.equal(h.document.getElementById("handoffCount").textContent,"");h.timers.advance(449);assert.equal(h.document.getElementById("handoffCount").textContent,"");h.timers.advance(1);assert.equal(h.document.getElementById("handoffCount").textContent,"3");h.timers.advance(3000);assert.equal(state.screen,"transition");assert.equal(provider.calls.at(-1).event,"lockIn");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"stopped");provider.finish();await settle();h.timers.advance(650);assert.equal(state.screen,"question");assert.equal(provider.calls.at(-1).event,"questionRead");assert.equal(h.recognition(),null);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().questionReading,true);provider.finish();await settle();assert.ok(h.recognition()?.started);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"running");assert.equal(state.game.questionRemaining,state.questionSeconds)}finally{h.close()}
});

test("Solo Showtime uses a short Solo welcome and provider failure still starts safely",async()=>{
 const provider={available:true,calls:[],play(cue){this.calls.push(cue);return Promise.reject(new Error("offline"))},cancel(){},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="solo";state.players=[{id:"p1",name:"Jordan"}];state.screen="ready";h.window.Math.random=()=>0;h.api.ready();assert.equal(provider.calls[0].event,"showtimeSolo");assert.match(provider.calls[0].text,/Jordan/);await settle();assert.equal(state.screen,"ready");h.click("#showtimeStart");assert.equal(state.screen,"handoff");await settle();h.timers.advance(1200);h.timers.advance(450);assert.equal(h.document.getElementById("handoffCount").textContent,"3");h.timers.advance(3000);await settle();h.timers.advance(650);await settle();assert.equal(state.screen,"question");assert.ok(state.game);assert.ok(provider.calls.some(x=>x.event==="soloTurn"));assert.ok(provider.calls.some(x=>x.event==="lockIn"));assert.ok(provider.calls.some(x=>x.event==="questionRead"));assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"running") }finally{h.close()}
});

test("handoff countdown owns one 450ms beat and one 3-2-1 loop without starting the answer timer",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();const count=()=>h.document.getElementById("handoffCount")?.textContent;assert.equal(count(),"");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"stopped");h.timers.advance(299);assert.equal(count(),"");h.timers.advance(150);assert.equal(count(),"");h.timers.advance(1);assert.equal(count(),"3");h.timers.advance(999);assert.equal(count(),"3");h.timers.advance(1);assert.equal(count(),"2");h.timers.advance(1000);assert.equal(count(),"1");h.timers.advance(999);assert.equal(state.screen,"handoff");h.timers.advance(1);assert.equal(state.screen,"transition");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"stopped");h.timers.advance(10000);assert.notEqual(state.screen,"handoff")}finally{h.close()}
});

test("leaving handoff cancels countdown and stale ticks cannot advance Home or a newer runtime",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.timers.advance(450);assert.equal(h.document.getElementById("handoffCount").textContent,"3");h.api.home();const session=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId;h.timers.advance(30000);assert.equal(state.screen,"home");assert.equal(state.game!==null,true);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId,session)}finally{h.close()}
});

test("Back and Exit cleanup invalidate an active handoff countdown",()=>{
 for(const action of ["back","leaveGame"]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.timers.advance(450);assert.equal(h.document.getElementById("handoffCount").textContent,"3");h.api[action]();assert.equal(state.screen,"home",action);const session=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId;h.timers.advance(30000);assert.equal(state.screen,"home",action);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId,session,action)}finally{h.close()}}
});

test("handoff Host timeout cannot freeze the countdown",()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();assert.equal(state.screen,"handoff");assert.equal(h.document.getElementById("handoffCount").textContent,"");h.timers.advance(19999);assert.equal(h.document.getElementById("handoffCount").textContent,"");h.timers.advance(1);assert.equal(h.document.getElementById("handoffCount").textContent,"");assert.ok(provider.cancels.includes("handoff-host-timeout"));h.timers.advance(449);assert.equal(h.document.getElementById("handoffCount").textContent,"");h.timers.advance(1);assert.equal(h.document.getElementById("handoffCount").textContent,"3");h.timers.advance(3000);assert.equal(state.screen,"transition")}finally{h.close()}
});

test("first, later, replay, and Solo turns each render exactly one Player-Up stage",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{
  const state=h.api.getState(),history=()=>h.window.__LOS_PLAYTEST_DIAGNOSTICS__.history();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.window.Math.random=()=>0;
  h.api.startGame();assert.equal(history().filter(x=>x.to==="handoff").length,1);assert.equal(provider.calls.filter(x=>x.event==="firstTurn").length,1);
  provider.finish();await settle();h.timers.advance(450);h.timers.advance(3000);provider.finish();await settle();provider.finish();await settle();state.game.current={q:"What planet?",a:"Mars",cat:"Science & Nature"};state.game.answered=false;h.api.finish("correct");h.api.advance();
  assert.equal(state.screen,"handoff");assert.equal(history().filter(x=>x.to==="handoff").length,2);assert.equal(history().filter(x=>x.to==="transition"&&x.reason==="game-transition").length,0);assert.equal(provider.calls.filter(x=>x.event==="turn").length,1);
  h.api.champion(state.game.players[0]);provider.finish();await settle();h.click("#playAgain");provider.finish();await settle();assert.equal(state.screen,"handoff");assert.equal(history().filter(x=>x.to==="handoff").length,3);
 }finally{h.close()}
 const solo=new FakeNaturalHostProvider(),s=createHarness({hostProvider:solo});try{const state=s.api.getState();state.mode="solo";state.players=[{id:"p1",name:"Jordan"}];s.api.startGame();assert.equal(state.screen,"handoff");assert.equal(s.window.__LOS_PLAYTEST_DIAGNOSTICS__.history().filter(x=>x.to==="handoff").length,1);assert.equal(solo.calls.filter(x=>x.event==="soloTurn").length,1);assert.equal(s.document.querySelectorAll(".handoff").length,1)}finally{s.close()}
});

test("Champion replay cancels obsolete Host speech and old completion cannot mutate the new match",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];const staleRecognition=h.recognition();h.api.startGame();const oldGame=state.game;h.api.champion(oldGame.players[0]);assert.equal(provider.calls.at(-1).event,"champion");staleRecognition.emit("play again",{isFinal:true});assert.equal(state.screen,"complete");h.click("#playAgain");assert.equal(state.screen,"ready");assert.equal(state.game,null);assert.ok(provider.cancels.includes("runtime-change"));const session=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId;provider.finish();await settle();assert.equal(state.screen,"handoff");assert.notEqual(state.game,oldGame);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId,session+1)}finally{h.close()}
});

test("expanded Host pools provide meaningful variety without requiring exact randomized phrases",()=>{
 const h=createHarness();try{const lines=h.api.HOST_LINES;assert.ok(lines.showtime.length>=10);assert.ok(lines.firstTurn.length>=10);assert.ok(lines.correct.length>=20);assert.ok(lines.wrong.length>=20);assert.ok(lines.easyMiss.length>=10);assert.ok(lines.fastCorrect.length>=10);assert.ok(lines.slowCorrect.length>=10);assert.ok(lines.showdown.length>=10);assert.ok(lines.champion.length>=10);assert.ok(Object.values(lines).flat().filter(x=>x.workSafe).length>=20);assert.ok(Object.values(lines).flat().filter(x=>x.cultural).length>=20)}finally{h.close()}
});

test("cultural-tag selection uses question context and remains Work safe",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.mode="work";h.window.Math.random=()=>0;for(const category of ["Music","Hip-Hop","R&B","Regional Mexican"]){const line=host.choose("culturalCorrect",{name:"Alex",category});assert.ok(line.cultural,category);assert.equal(line.workSafe,true,category)}}finally{h.close()}
});

test("player-name reactions substitute the current session player only",()=>{
 const h=createHarness();try{const host=h.api.getHostSystem();h.window.Math.random=()=>0;const line=host.choose("firstTurn",{name:"Marisol"});assert.match(line.text,/Marisol/);assert.doesNotMatch(line.text,/{name}/)}finally{h.close()}
});

test("category callbacks are based on actual session results and fire only at a milestone",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.window.Math.random=()=>0;h.api.startGame();const game=state.game,player=game.players[0];for(let i=1;i<=3;i++){game.current={q:"Question "+i,a:"answer",cat:"Music"};game.answered=false;game.questionStartedWith=15;game.questionRemaining=9;h.api.finish("correct");assert.equal(player.hostCategoryStats.music.correct,i);if(i<3)assert.notEqual(host.history.at(-1).event,"categoryRun")}assert.equal(host.history.at(-1).event,"categoryRun");assert.equal(host.history.at(-1).context.categoryCorrect,3)}finally{h.close()}
});

test("routine reaction frequency and gameplay ownership remain unchanged",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.game={players:[{id:"p1",name:"Alex",correct:4,strikes:1}],idx:0,questionRemaining:6};const before=JSON.stringify(state.game);h.window.Math.random=()=>.99;assert.equal(host.emit("correct",{name:"Alex"}),false);assert.equal(host.history.at(-1).result,"frequency-skip");assert.equal(JSON.stringify(state.game),before)}finally{h.close()}
});

test("stale Host completion from an abandoned turn cannot advance Home",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.window.Math.random=()=>0;h.api.startGame();assert.equal(state.screen,"handoff");h.api.home();const session=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId;provider.finish();await settle();h.timers.advance(10000);assert.equal(state.screen,"home");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().runtimeSessionId,session)}finally{h.close()}
});

test("playtest diagnostics record transition ownership and runtime state",()=>{
 const h=createHarness();try{h.api.go("mode","test-navigation");const snap=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot();assert.equal(snap.screen,"mode");assert.equal(snap.lastTransition.from,"home");assert.equal(snap.lastTransition.to,"mode");assert.equal(snap.lastTransition.reason,"test-navigation");assert.equal(typeof snap.runtimeSessionId,"number");assert.equal(snap.answerTimer,"stopped")}finally{h.close()}
});

test("Read Questions ON keeps Host speech before the answer timer",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.readQuestions=true;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.question();assert.equal(provider.calls.at(-1).event,"questionRead");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().questionReading,true);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"stopped");provider.finish();await settle();assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().questionReading,false);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"running")}finally{h.close()}
});

test("Read Questions OFF starts recognition and answer timing without Host silence",()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.readQuestions=false;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.question();assert.ok(!provider.calls.some(x=>x.event==="questionRead"));assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().questionReading,false);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"running");assert.ok(h.recognition()?.started)}finally{h.close()}
});

test("Voice and Read Questions remain independent in all four setup combinations",async()=>{
 for(const voiceOn of [false,true])for(const readQuestions of [false,true]){
  const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{
   const state=h.api.getState();state.voiceOn=voiceOn;voiceOn?h.api.startVoice():h.api.stopVoice();state.readQuestions=readQuestions;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.question();
   const shouldRead=voiceOn&&readQuestions;assert.equal(provider.calls.some(x=>x.event==="questionRead"),shouldRead,`read=${readQuestions} voice=${voiceOn}`);
   assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,shouldRead?"stopped":"running");
   if(shouldRead){assert.equal(h.recognition(),null);provider.finish();await settle()}
   assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,"running");
   assert.equal(!!h.recognition()?.started,voiceOn,`microphone read=${readQuestions} voice=${voiceOn}`)
  }finally{h.close()}
 }
});

test("unsuccessful outcomes speak the canonical answer before delayed advancement",async()=>{
 for(const outcome of ["timeout","pass","skip"]){
  const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{
   const state=h.api.getState();state.readQuestions=false;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.question();state.game.current={q:"Which planet is known as the Red Planet?",a:"Mars",cat:"Science"};state.game.answered=false;
   h.api.finish(outcome);assert.equal(state.screen,"result");assert.equal(provider.calls.at(-1).event,"answerReveal");assert.match(provider.calls.at(-1).text,/Mars/);h.timers.advance(30000);assert.equal(state.screen,"result",`${outcome} advanced while the Host still spoke`);
   provider.finish();await settle();assert.equal(state.screen,"result");h.timers.advance(10000);assert.notEqual(state.screen,"result",`${outcome} did not advance after the reveal`)
  }finally{h.close()}
 }
});

test("correct outcomes never add an answer-reveal line",()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.readQuestions=false;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.question();state.game.current={q:"Which planet?",a:"Mars",cat:"Science"};state.game.answered=false;h.api.finish("correct");assert.equal(state.screen,"result");assert.equal(provider.calls.some(x=>x.event==="answerReveal"),false)}finally{h.close()}
});

test("Stage 6.13 Host bank is deep, humorous, culturally varied, and Work filtered",()=>{
 const h=createHarness();try{const state=h.api.getState(),lines=h.api.HOST_LINES,all=Object.values(lines).flat();assert.ok(all.length>=300,`Host bank has ${all.length} lines`);assert.ok(lines.turn.length>=20);assert.ok(lines.correct.length>=30);assert.ok(lines.wrongAttempt.length>=20);assert.ok(lines.wrong.length>=20);assert.ok(lines.fastCorrect.length>=15);assert.ok(lines.slowCorrect.length>=15);assert.ok(lines.showdown.length>=15);assert.ok(lines.champion.length>=20);assert.ok(all.filter(x=>x.workSafe!==false).length>=40);assert.ok(all.filter(x=>x.cultural).length>=40);assert.ok(all.filter(x=>x.humor||/clock|room|study|confidence|question/i.test(x.text)).length>=40);state.mode="work";h.window.Math.random=()=>.999;const host=h.api.getHostSystem();for(const event of ["turn","correct","wrong","champion"]){for(let i=0;i<20;i++)assert.notEqual(host.choose(event,{name:"Alex"})?.workSafe,false,event)}}finally{h.close()}
});

test("Host near-duplicate protection avoids repeating the same phrase family",()=>{
 const h=createHarness();try{const host=h.api.getHostSystem();let n=0;h.window.Math.random=()=>((n++%17)/17);const chosen=Array.from({length:8},()=>host.choose("correct",{}));for(let i=1;i<chosen.length;i++)assert.notEqual(chosen[i].id,chosen[i-1].id)}finally{h.close()}
});

test("explicit player Host styles provide deep tagged banks without name inference",()=>{
 const h=createHarness();try{const lines=h.api.HOST_LINES,turn=lines.turn;assert.ok(turn.filter(x=>x.hostStyle==="feminine").length>=20);assert.ok(turn.filter(x=>x.hostStyle==="masculine").length>=20);assert.ok(turn.filter(x=>x.hostStyle==="neutral").length>=20);const state=h.api.getState(),host=h.api.getHostSystem();state.players=[{id:"p1",name:"Vanessa",hostStyle:"masculine"},{id:"p2",name:"Marcus",hostStyle:"feminine"}];h.window.Math.random=()=>.999;host.emit("turn",{name:"Vanessa"});assert.equal(host.history.at(-1).context.hostStyle,"masculine");host.emit("turn",{name:"Marcus"});assert.equal(host.history.at(-1).context.hostStyle,"feminine");host.emit("turn",{name:"Unlisted"});assert.equal(host.history.at(-1).context.hostStyle,"neutral")}finally{h.close()}
});

test("unreviewed recurring Spanish slang is suppressed from automatic Host selection",()=>{
 const h=createHarness();try{const host=h.api.getHostSystem();let n=0;h.window.Math.random=()=>((n++%97)/97);for(const event of ["turn","correct","wrongAttempt","wrong","fastCorrect","slowCorrect","showdown","champion"]){for(let i=0;i<100;i++){const line=host.choose(event,{name:"Alex",category:"Regional Mexican"});if(line)assert.doesNotMatch(line.text,/\b(?:compa|perro|orale|órale)\b/i,event)}}const all=Object.values(h.api.HOST_LINES).flat();assert.equal(all.some(x=>/\bgr\b/i.test(x.text)),false);assert.equal(all.some(x=>/pretty.{0,20}brains|brains.{0,20}pretty/i.test(x.text)),false)}finally{h.close()}
});

test("Work personalization retains style while excluding unsafe lines",()=>{
 const h=createHarness();try{const state=h.api.getState(),host=h.api.getHostSystem();state.mode="work";let n=0;h.window.Math.random=()=>((n++%61)/61);for(const hostStyle of ["feminine","masculine","neutral"])for(let i=0;i<40;i++){const line=host.choose("turn",{name:"Alex",hostStyle});assert.ok(line);assert.notEqual(line.workSafe,false);assert.ok(!line.hostStyle||line.hostStyle===hostStyle)}}finally{h.close()}
});

test("Who's In remains indefinitely until an explicit current-screen Continue",async()=>{
 for(const voiceOn of [false,true])for(const readQuestions of [false,true])for(const providerMode of ["healthy","failure"]){const provider=providerMode==="healthy"?new FakeNaturalHostProvider():{available:true,play:()=>Promise.reject(new Error("offline")),cancel(){},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.voiceOn=voiceOn;state.readQuestions=readQuestions;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.players();h.timers.advance(30000);await settle();assert.equal(state.screen,"players",`${voiceOn}/${readQuestions}/${providerMode}`);assert.equal(state.game,null)}finally{h.close()}}
 const explicit=createHarness();try{const state=explicit.api.getState();state.mode="original";state.voiceOn=false;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";explicit.api.players();explicit.click("#continue");assert.equal(state.screen,"ready")}finally{explicit.close()}
});

test("late Host completion and failure cannot relaunch an abandoned Showtime",async()=>{
 for(const fail of [false,true]){let rejectPending,resolvePending;const provider={available:true,play:()=>new Promise((resolve,reject)=>{resolvePending=resolve;rejectPending=reject}),cancel(){},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.api.ready();h.click("#back");assert.equal(state.screen,"players");fail?rejectPending(new Error("late failure")):resolvePending();await settle();assert.equal(state.screen,"players");assert.equal(state.game,null);const rejected=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.history().filter(x=>x.accepted===false);assert.ok(rejected.some(x=>x.reason==="showtime-host-settled"&&x.sourceStillOwnsCurrentScreen===false))}finally{h.close()}}
});

test("Final Showdown survives Host failure and stale callbacks for its full minimum sequence",async()=>{
 const provider={available:true,play:()=>Promise.reject(new Error("offline")),cancel(){},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"},{id:"p3",name:"Casey"}];h.api.startGame();state.game.players[2].eliminated=true;h.api.showdownIntro();assert.equal(state.screen,"showdown");await settle();h.timers.advance(3500);assert.equal(state.screen,"showdown");h.timers.advance(200);assert.equal(state.screen,"handoff");h.api.home();h.timers.advance(30000);assert.equal(state.screen,"home")}finally{h.close()}
});

test("Stage 6.18 diagnostics correlate Host IDs transitions lifetimes and build identity",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.go("ready");const snap=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot();assert.equal(snap.build.stage,"6.18");assert.equal(snap.build.version,"game-audio");assert.equal(snap.readQuestions,state.readQuestions);assert.equal(snap.voiceOn,state.voiceOn);assert.match(snap.hostEvent.hostEventId,/^host-/);assert.equal(provider.calls[0].hostEventId,snap.hostEvent.hostEventId);provider.finish();await settle();const lifetime=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.lifetimes().find(x=>x.screen==="ready");assert.ok(lifetime.leftAt>=lifetime.enteredAt);assert.ok(lifetime.visibleDurationMs>=0)}finally{h.close()}
});

test("Stage 6.15 Host event matrix carries correlated playback requests",async()=>{
 const provider=new FakeNaturalHostProvider(),h=createHarness({hostProvider:provider});try{const state=h.api.getState(),host=h.api.getHostSystem();state.voiceOn=true;h.window.Math.random=()=>0;const matrix=[["opening",{}],["showtime",{players:"Alex and Blair",seconds:15}],["firstTurn",{name:"Alex"}],["lockIn",{}],["questionRead",{question:"What planet is red?",name:"Alex"}],["correct",{name:"Alex"}],["wrong",{name:"Alex"}],["answerReveal",{name:"Alex",answer:"Mars"}],["showdown",{}],["champion",{name:"Alex"}]];for(const [event,context] of matrix){assert.equal(host.emit(event,context),true,event);const cue=provider.calls.at(-1),entry=host.history.at(-1);assert.equal(cue.event,event);assert.equal(cue.hostEventId,entry.hostEventId);assert.equal(entry.screen,state.screen);provider.finish();await settle();assert.equal(entry.result,"playback-completed",event)} }finally{h.close()}
});
