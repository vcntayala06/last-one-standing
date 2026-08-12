"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, FakeSpeechRecognition } = require("./helpers/harness");

function withHarness(fn) { return () => { const h=createHarness();try{return fn(h)}finally{h.close()} }; }
function setValidPlayers(state) { state.mode="friends";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}]; }
function activeQuestion(h) {
  const state=h.api.getState();setValidPlayers(state);state.questionSeconds=15;
  state.game={players:state.players.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),startingCount:2,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:""};
  h.api.question();return state;
}

test("setup voice routes Friends, Family, Solo, Work, and Quick Game",()=>{
  const cases=[["friends","friends","difficulty",false],["family","family","difficulty",false],["solo","solo","difficulty",false],["work","work","industry",false],["quick game","friends","fun",true]];
  for(const [phrase,mode,screen,quick] of cases){const h=createHarness();try{h.api.go("mode");h.timers.advance(220);h.speak(phrase);const s=h.api.getState();assert.equal(s.mode,mode,phrase);assert.equal(s.screen,screen,phrase);assert.equal(s.quick,quick,phrase)}finally{h.close()}}
});

test("Work industry selection and Continue work by voice",withHarness(h=>{const s=h.api.getState();s.mode="work";h.api.go("industry");h.timers.advance(220);h.speak("Healthcare");assert.equal(s.industry,"Healthcare");h.speak("continue");assert.equal(s.screen,"difficulty")}));
test("difficulty selection and Continue work by voice",withHarness(h=>{const s=h.api.getState();h.api.go("difficulty");h.timers.advance(220);h.speak("hard");assert.equal(s.difficulty,"hard");h.speak("continue");assert.equal(s.screen,"fun")}));

test("Back follows the setup transition map",()=>{
  const cases=[["mode","home"],["industry","mode"],["fun","difficulty"],["players","fun"],["time","players"],["ready","time"]];
  for(const [from,to] of cases){const h=createHarness();try{const s=h.api.getState();setValidPlayers(s);s.screen=from;({mode:h.api.mode,industry:h.api.industry,fun:h.api.fun,players:h.api.players,time:h.api.time,ready:h.api.ready}[from])();h.speak("back");assert.equal(s.screen,to,from)}finally{h.close()}}
});

test("Continue advances each valid setup screen and Start begins gameplay",withHarness(h=>{const s=h.api.getState();setValidPlayers(s);s.screen="difficulty";h.api.difficulty();h.speak("continue");assert.equal(s.screen,"fun");h.timers.advance(220);h.speak("continue");assert.equal(s.screen,"players");h.timers.advance(220);h.speak("continue");assert.equal(s.screen,"time");h.timers.advance(220);h.speak("continue");assert.equal(s.screen,"ready");h.timers.advance(220);h.speak("start");assert.equal(s.screen,"handoff");assert.ok(s.game)}));

test("Exit voice command returns every setup screen Home without starting a game",()=>{
  for(const screen of ["mode","industry","difficulty","fun","players","time","ready"]){const h=createHarness();try{const s=h.api.getState();setValidPlayers(s);s.screen=screen;({mode:h.api.mode,industry:h.api.industry,difficulty:h.api.difficulty,fun:h.api.fun,players:h.api.players,time:h.api.time,ready:h.api.ready}[screen])();h.speak("exit game");assert.equal(s.screen,"home",screen);assert.equal(s.game,null)}finally{h.close()}}
});

test("category Select All, Clear All, Skip, and aliases retain intended semantics",()=>{
  for(const [phrase,expected] of [["select all",11],["clear all",0],["skip",0]]){const h=createHarness();try{const s=h.api.getState();s.screen="fun";s.categories=phrase==="clear all"?["Music"]:[];h.api.fun();h.speak(phrase);assert.equal(s.categories.length,expected,phrase);if(phrase==="skip")assert.equal(s.screen,"players")}finally{h.close()}}
  const h=createHarness();try{const s=h.api.getState();s.screen="fun";s.categories=[];h.api.fun();for(const phrase of ["movies and tv","food","transport"])h.speak(phrase);assert.deepEqual(Array.from(s.categories),["Movies & TV","Food & Drink","Transportation"])}finally{h.close()}
});

test("player voice variants add, assign, rename, and remove by name or number",()=>{
  const commands=[["add another player",["Alex","Blair",""]],["player named Casey",["Alex","Blair","Casey"]],["put Casey in",["Alex","Blair","Casey"]],["player one is Casey",["Casey","Blair"]],["make player two Casey",["Alex","Casey"]],["rename Blair to Casey",["Alex","Casey"]],["delete player two",["Alex"]],["remove Blair",["Alex"]]];
  for(const [command,names] of commands){const h=createHarness();try{const s=h.api.getState();setValidPlayers(s);s.screen="players";h.api.players();h.speak(command);assert.deepEqual(Array.from(s.players,p=>p.name),names,command)}finally{h.close()}}
});

test("bare Player and Player Two commands do not mutate the roster",()=>{for(const command of ["player","player two"]){const h=createHarness();try{const s=h.api.getState();setValidPlayers(s);s.screen="players";h.api.players();h.speak(command);assert.deepEqual(Array.from(s.players,p=>p.name),["Alex","Blair"])}finally{h.close()}}});
test("player data mutations wait for final speech while setup Continue can use interim speech",withHarness(h=>{const s=h.api.getState();setValidPlayers(s);s.screen="players";h.api.players();h.speak("add player Casey",{final:false});assert.deepEqual(Array.from(s.players,p=>p.name),["Alex","Blair"]);h.speak("add player Casey",{final:true});assert.deepEqual(Array.from(s.players,p=>p.name),["Alex","Blair","Casey"]);h.speak("continue",{final:false});assert.equal(s.screen,"time")}));

test("recognition alternatives route the first actionable transcript",withHarness(h=>{const s=h.api.getState();h.api.go("mode");h.timers.advance(220);h.speak("unrelated noise",{alternatives:["family"]});assert.equal(s.mode,"family");assert.equal(s.screen,"difficulty")}));
test("recognition onend restarts listening with the current screen context",withHarness(h=>{const s=h.api.getState();h.api.go("mode");h.timers.advance(220);const first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.end();assert.equal(h.recognition(),null);h.timers.advance(25);assert.equal(FakeSpeechRecognition.instances.length,count+1);h.speak("solo");assert.equal(s.mode,"solo");assert.equal(s.screen,"difficulty")}));
test("no-speech recognition termination self-heals",withHarness(h=>{const first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.error("no-speech");first.end();h.timers.advance(25);assert.equal(FakeSpeechRecognition.instances.length,count+1);assert.ok(h.recognition().started)}));
test("healthy recognition remains active across setup navigation",withHarness(h=>{const first=h.recognition(),count=FakeSpeechRecognition.instances.length;h.api.go("mode");assert.equal(h.recognition(),first);assert.equal(FakeSpeechRecognition.instances.length,count);h.timers.advance(220);h.speak("family");assert.equal(h.api.getState().screen,"difficulty");assert.equal(h.recognition(),first)}));
test("same-screen rerenders do not restart healthy recognition",withHarness(h=>{const s=h.api.getState(),first=h.recognition(),count=FakeSpeechRecognition.instances.length;s.screen="fun";s.categories=[];h.api.fun();h.speak("music");h.speak("sports");assert.equal(h.recognition(),first);assert.equal(FakeSpeechRecognition.instances.length,count)}));
test("the first command immediately after navigation uses the updated context",withHarness(h=>{const s=h.api.getState(),first=h.recognition();s.categories=[];h.api.go("fun");assert.equal(h.recognition(),first);h.speak("music");assert.deepEqual(Array.from(s.categories),["Music"]);assert.equal(s.screen,"fun")}));
test("aborted recognition termination recovers automatically",withHarness(h=>{const first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.error("aborted");first.end();h.timers.advance(25);assert.equal(FakeSpeechRecognition.instances.length,count+1);assert.ok(h.recognition().started)}));
test("service-not-allowed blocks automatic restart",withHarness(h=>{const first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.error("service-not-allowed");first.end();h.timers.advance(5000);assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,count)}));
test("Voice Off remains off when the stopped recognizer later ends",withHarness(h=>{const s=h.api.getState();s.screen="time";h.api.time();const first=h.recognition(),count=FakeSpeechRecognition.instances.length;h.click("#voiceOff");first.end();h.timers.advance(5000);assert.equal(s.voiceOn,false);assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,count)}));
test("Voice On explicitly recovers after service permission block",withHarness(h=>{const s=h.api.getState(),first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.error("service-not-allowed");first.end();s.screen="time";h.api.time();assert.equal(h.recognition(),null);h.click("#voiceOn");assert.equal(s.voiceOn,true);assert.ok(h.recognition()?.started);assert.equal(FakeSpeechRecognition.instances.length,count+1)}));
test("stale callbacks from an old recognition generation are ignored",withHarness(h=>{const s=h.api.getState(),old=h.recognition();h.api.go("mode");h.timers.advance(220);old.end();h.timers.advance(25);const current=h.recognition(),count=FakeSpeechRecognition.instances.length;assert.notEqual(current,old);old.emit("family");old.error("not-allowed");old.end();h.timers.advance(1000);assert.equal(s.screen,"mode");assert.equal(h.recognition(),current);assert.equal(FakeSpeechRecognition.instances.length,count);h.speak("work");assert.equal(s.screen,"industry")}));
test("recognition start failures retry with one bounded backoff chain",withHarness(h=>{const old=h.recognition(),before=FakeSpeechRecognition.instances.length;FakeSpeechRecognition.startFailures=2;old.end();h.timers.advance(25);assert.equal(FakeSpeechRecognition.instances.length,before+1);assert.equal(h.recognition(),null);h.timers.advance(99);assert.equal(FakeSpeechRecognition.instances.length,before+1);h.timers.advance(1);assert.equal(FakeSpeechRecognition.instances.length,before+2);h.timers.advance(249);assert.equal(FakeSpeechRecognition.instances.length,before+2);h.timers.advance(1);assert.equal(FakeSpeechRecognition.instances.length,before+3);assert.ok(h.recognition().started)}));
test("interim setup action followed by its final transcript executes once",withHarness(h=>{const s=h.api.getState();s.screen="fun";s.categories=[];h.api.fun();const first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.emit("music",{final:false});first.emit("music",{final:true});assert.deepEqual(Array.from(s.categories),["Music"]);assert.equal(h.recognition(),first);assert.equal(FakeSpeechRecognition.instances.length,count)}));
test("question answering works through the persistent recognizer onresult path",withHarness(h=>{const s=activeQuestion(h),current=h.recognition();s.game.current={q:"What planet is known as the Red Planet?",a:"Mars"};s.game.answered=false;current.emit("Mars",{final:true,confidence:.99});assert.equal(s.game.players[0].correct,1);assert.equal(s.game.answered,true)}));

test("same-screen category and player rerenders retain active voice control",withHarness(h=>{const s=h.api.getState();s.screen="fun";s.categories=[];h.api.fun();h.speak("music");h.speak("sports");assert.deepEqual(Array.from(s.categories),["Music","Sports"]);s.screen="players";setValidPlayers(s);h.api.players();h.speak("add player Casey");h.speak("remove Casey");assert.deepEqual(Array.from(s.players,p=>p.name),["Alex","Blair"])}));
test("duplicate category interim and final transcripts remain idempotent",withHarness(h=>{const s=h.api.getState();s.screen="fun";s.categories=[];h.api.fun();h.speak("music",{final:false});h.speak("music",{final:true});assert.deepEqual(Array.from(s.categories),["Music"])}));
test("duplicate final player transcripts perform one mutation",withHarness(h=>{const s=h.api.getState();setValidPlayers(s);s.screen="players";h.api.players();h.speak("add player Casey");h.speak("add player Casey");assert.deepEqual(Array.from(s.players,p=>p.name),["Alex","Blair","Casey"])}));

test("voice lookup after category rerender never clicks a detached old button",withHarness(h=>{const s=h.api.getState();s.screen="fun";s.categories=[];h.api.fun();const oldSports=h.document.querySelector('[data-cat="Sports"]');let detachedClicks=0;oldSports.addEventListener("click",()=>detachedClicks++);h.click('[data-cat="Music"]');assert.equal(oldSports.isConnected,false);h.speak("Sports");assert.equal(detachedClicks,0);assert.deepEqual(Array.from(s.categories),["Music","Sports"])}));

test("player add rename delete and Continue survive consecutive rerenders",withHarness(h=>{const s=h.api.getState();setValidPlayers(s);s.screen="players";h.api.players();h.speak("add player Casey");h.speak("rename Casey to Dana");h.speak("remove Dana");h.speak("continue",{final:false});assert.deepEqual(Array.from(s.players,p=>p.name),["Alex","Blair"]);assert.equal(s.screen,"time")}));

test("Game Settings rerender uses current controls for the next voice command",withHarness(h=>{const s=h.api.getState();s.screen="time";h.api.time();h.speak("10 seconds");assert.equal(s.questionSeconds,10);h.speak("volume up");assert.ok(Math.abs(s.volume-.75)<1e-9);assert.equal(Number(h.document.querySelector("#vol").value),.75)}));

test("exact setup controls remain interim-responsive while fuzzy wrappers remain final-only",withHarness(h=>{const s=h.api.getState();h.api.go("mode");h.timers.advance(220);h.speak("choose family",{final:false});assert.equal(s.screen,"mode");assert.equal(s.mode,"friends");h.speak("family",{final:false});assert.equal(s.screen,"difficulty")}));

test("fuzzy visible-control matching activates only on final speech",withHarness(h=>{const s=h.api.getState();h.api.go("mode");h.timers.advance(220);h.speak("choose family",{final:false});assert.equal(s.screen,"mode");h.speak("choose family",{final:true});assert.equal(s.mode,"family");assert.equal(s.screen,"difficulty")}));

test("question answers win before an identically labeled visible control",withHarness(h=>{const s=activeQuestion(h);s.game.current={q:"What planet is known as the Red Planet?",a:"Mars"};s.game.answered=false;const button=h.document.createElement("button");button.textContent="Mars";let clicks=0;button.onclick=()=>clicks++;h.document.body.appendChild(button);h.speak("Mars",{final:false,confidence:.4});assert.equal(s.game.players[0].correct,1);assert.equal(clicks,0)}));
test("navigation lock rejects a second transition until its 220ms window expires",withHarness(h=>{const s=h.api.getState();h.api.go("mode");h.api.go("difficulty");assert.equal(s.screen,"mode");h.timers.advance(219);h.api.go("difficulty");assert.equal(s.screen,"mode");h.timers.advance(1);h.api.go("difficulty");assert.equal(s.screen,"difficulty")}));

test("active-game persistence round trip restores players, settings, question, and turn",withHarness(h=>{const s=activeQuestion(h);s.categories=["Music"];s.industry="Healthcare";s.difficulty="hard";s.game.players[0].strikes=2;s.game.idx=1;const current=s.game.current.q;h.api.saveActiveGame();s.categories=[];s.industry="";s.difficulty="easy";s.game=null;h.api.resumeSavedGame();assert.equal(s.screen,"handoff");assert.equal(s.categories[0],"Music");assert.equal(s.industry,"Healthcare");assert.equal(s.difficulty,"hard");assert.equal(s.game.idx,1);assert.equal(s.game.players[0].strikes,2);assert.equal(s.game.current.q,current)}));
test("protected question behavior remains routed through fake recognition",withHarness(h=>{const s=activeQuestion(h);s.game.current={q:"What planet?",a:"Mars"};s.game.answered=false;h.speak("Mars",{final:false,confidence:.4});assert.equal(s.game.players[0].correct,1);assert.equal(s.game.answered,true)}));

test("permission denial blocks restart until explicit Voice On action",withHarness(h=>{const first=h.recognition(),count=FakeSpeechRecognition.instances.length;first.error("not-allowed");first.end();h.timers.advance(100);assert.equal(h.recognition(),null);assert.equal(FakeSpeechRecognition.instances.length,count);const s=h.api.getState();s.screen="time";h.api.time();assert.equal(h.recognition(),null);h.click("#voiceOn");assert.ok(h.recognition());assert.equal(FakeSpeechRecognition.instances.length,count+1)}));

test("leaving a Question cancels countdown, timeout, and strike work",withHarness(h=>{const s=activeQuestion(h),abandoned=s.game,remaining=s.game.questionRemaining;h.speak("exit game");assert.equal(s.screen,"home");h.timers.advance(12000);assert.equal(abandoned.questionRemaining,remaining);assert.equal(abandoned.players[0].timeout,0);assert.equal(abandoned.players[0].strikes,0);assert.equal(s.screen,"home")}));

test("leaving a Result cancels delayed advancement",withHarness(h=>{const s=activeQuestion(h);h.api.finish("correct");assert.equal(s.screen,"result");h.speak("exit game");assert.equal(s.screen,"home");assert.doesNotThrow(()=>h.timers.advance(6000));assert.equal(s.screen,"home");assert.equal(s.game,null)}));
