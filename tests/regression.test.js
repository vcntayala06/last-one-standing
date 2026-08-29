"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, FakeSpeechRecognition } = require("./helpers/harness");

function withHarness(fn) {
  return () => {
    const h = createHarness();
    try { return fn(h); } finally { h.close(); }
  };
}

function setupQuestion(h, question = { q: "What planet is known as the Red Planet?", a: "Mars" }) {
  const state = h.api.getState();
  state.screen = "question";
  state.game = {
    players: [{ id: "p1", name: "Alex", correct: 0, wrong: 0, timeout: 0, strikes: 0, eliminated: false }],
    startingCount: 1, idx: 0, qnum: 0, used: [], current: question, answered: false,
    started: Date.now(), speechLog: [], lastSpeechLog: [], showdown: false, lastOutcomeDetail: ""
  };
  return state;
}

function activeTimedQuestion(h) {
  const state = h.api.getState();
  state.screen = "question";
  state.questionSeconds = 15;
  state.game = {
    players: [{ id: "p1", name: "Alex", correct: 0, wrong: 0, timeout: 0, strikes: 0, eliminated: false }],
    startingCount: 1, idx: 0, qnum: 0, used: [], current: null, answered: false,
    started: Date.now(), speechLog: [], lastSpeechLog: [], showdown: false, lastOutcomeDetail: ""
  };
  h.api.question();
  return state;
}

function addPlayerViaForm(h,firstName,{lastName="",nickname=""}={}){
 h.click("#add");const form=h.document.querySelector(".los-player-sheet");assert.ok(form,"add-player form");form.elements.firstName.value=firstName;form.elements.lastName.value=lastName;form.elements.nickname.value=nickname;form.dispatchEvent(new h.window.Event("submit",{bubbles:true,cancelable:true}))
}

test("fake SpeechRecognition is active and routes a final Home command", withHarness(h => {
  assert.equal(h.api.getState().screen, "home");
  h.speak("start", { final: true });
  assert.equal(h.api.getState().screen, "packs");
}));

test("protected answer matcher accepts exact, contained, fuzzy, and phonetic answers", withHarness(h => {
  const q = { a: "Sacramento" };
  assert.equal(h.api.accepted("Sacramento", q), true);
  assert.equal(h.api.accepted("the answer is Sacramento", q), true);
  assert.equal(h.api.accepted("Sacramnto", q), true);
  assert.equal(h.api.accepted("Sakramento", q), true);
  assert.equal(h.api.accepted("Los Angeles", q), false);
}));

test("Stanley Cup and canonical accepted-answer metadata reach gameplay scoring",withHarness(h=>{
 const source=h.api.QUESTION_BANK.byId.get("los-b2-sports-418"),q=h.api.QUESTION_BANK.toGameplay(source);assert.equal(q.a,"Stanley Cup");assert.ok(q.accept.includes("stanley cup"));assert.equal(h.api.accepted("The Stanley Cup.",q),true);assert.equal(h.api.accepted("Stanley",q),true);assert.equal(h.api.accepted("Stanford Cup",q),false)
}));

test("accepted English, Spanish, and legacy alts are precise but transcription-safe",withHarness(h=>{
 assert.equal(h.api.accepted("PACIFIC OCEAN!",{a:"Pacific Ocean",accept:["pacific"],es:["océano pacífico"],alts:["the pacific"]}),true);assert.equal(h.api.accepted("oceano pacifico",{a:"Pacific Ocean",es:["océano pacífico"]}),true);assert.equal(h.api.accepted("three hundred and sixty six",{a:"366",alts:["three hundred and sixty six"]}),true);assert.equal(h.api.accepted("Atlantic Ocean",{a:"Pacific Ocean",accept:["pacific"]}),false)
}));

test("protected question routing scores a high-confidence exact interim only once", withHarness(h => {
  const state = setupQuestion(h);
  state.game.current={q:"What planet?",a:"Mars"};h.api.question(true);
  assert.equal(h.api.centralQuestionIntent("Mars", false, 1), true);
  assert.equal(state.game.answered, true);
  assert.equal(state.game.players[0].correct, 1);
  assert.equal(h.api.centralQuestionIntent("Mars", true, 0.5), false);
  assert.equal(state.game.players[0].correct, 1);
}));

test("protected question routing records a short final non-answer as a continuing attempt", withHarness(h => {
  const state = setupQuestion(h);
  state.game.current={q:"What planet?",a:"Mars"};h.api.question(true);
  h.api.centralQuestionIntent("Venus", true, 1);
  assert.equal(state.game.players[0].wrong, 0);
  assert.equal(state.game.players[0].strikes, 0);
  assert.equal(state.game.answered, false);
  assert.equal(state.game.speechLog.length,1);
}));

test("Pass and Skip each produce one strike and distinct result detail", withHarness(h => {
  let state = setupQuestion(h);
  state.game.current={q:"What planet?",a:"Mars"};h.api.question(true);h.api.centralQuestionIntent("pass", true, 1);
  assert.equal(state.game.players[0].strikes, 1);
  assert.equal(state.game.lastOutcomeDetail, "pass");

  state = setupQuestion(h);
  state.game.current={q:"What planet?",a:"Mars"};h.api.question(true);h.api.centralQuestionIntent("skip", true, 1);
  assert.equal(state.game.players[0].strikes, 1);
  assert.equal(state.game.lastOutcomeDetail, "skip");
}));

test("finish is idempotent when duplicate recognition results arrive", withHarness(h => {
  const state = setupQuestion(h);
  h.api.finish("correct");
  h.api.finish("correct");
  assert.equal(state.game.players[0].correct, 1);
}));

test("wrong Result includes one immediate non-interactive game-show X", withHarness(h => {
  const state=setupQuestion(h);
  h.api.finish("wrong");
  const impact=h.document.querySelectorAll(".result-impact");
  assert.equal(state.screen,"result");
  assert.equal(impact.length,1);
  assert.equal(impact[0].textContent,"×");
  assert.equal(impact[0].getAttribute("aria-hidden"),"true");
  assert.equal(state.game.players[0].strikes,1);
}));

test("Build 6.36 compact roster adds removes edits and preserves production names", withHarness(h => {
  const state = h.api.getState();
  state.screen = "players";
  state.mode = "friends";
  state.players = [];
  h.api.players();
  assert.ok(h.document.querySelector(".los-selected-empty"));addPlayerViaForm(h,"Maria",{lastName:"Lopez",nickname:"Mari"});assert.deepEqual(Array.from(state.players,p=>p.name),["Mari"]);const id=state.players[0].id;assert.ok(h.document.querySelector(`[data-selected-player="${id}"]`));h.click(`[data-remove-player="${id}"]`);assert.equal(state.players.length,0);h.click("#selectPlayers");assert.equal(h.document.querySelector(`[data-picker-player="${id}"]`).getAttribute("aria-pressed"),"false");h.click(`[data-picker-player="${id}"]`);assert.deepEqual(Array.from(state.players,p=>p.name),["Mari"]);h.click(`[data-picker-edit="${id}"]`);const form=h.document.querySelector(".los-player-sheet");form.elements.nickname.value="Maria";form.dispatchEvent(new h.window.Event("submit",{bubbles:true,cancelable:true}));assert.equal(state.players[0].name,"Maria")
}));

test("Build 6.36 avatar library filters expands styles and persists old and new IDs",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.screen="players";state.players=[];h.api.players();addPlayerViaForm(h,"Alex");const id=state.players[0].id;const openAvatar=()=>{h.click("#selectPlayers");h.click(`[data-picker-avatar="${id}"]`)};openAvatar();assert.equal(h.document.querySelectorAll("[data-avatar]").length,47);assert.equal(h.document.querySelectorAll('[data-avatar-style="street"]').length,6);assert.equal(h.document.querySelectorAll('[data-avatar-style="western"]').length,6);assert.equal(h.document.querySelectorAll('[data-avatar-style="biker"]').length,6);for(const [filter,count] of [["kids",7],["adults",28],["seniors",11]]){h.click(`[data-avatar-filter="${filter}"]`);assert.equal(h.document.querySelectorAll("[data-avatar]").length,count,filter)}h.click('[data-avatar="senior-glasses"]');h.click("[data-save-avatar]");assert.equal(state.players[0].avatar,"senior-glasses");let profiles=JSON.parse(h.window.localStorage.getItem("los636_player_profiles"));assert.equal(profiles[0].avatar,"senior-glasses");h.click(`[data-picker-avatar="${id}"]`);h.click('[data-avatar="street-nightcap"]');h.click("[data-save-avatar]");assert.equal(state.players[0].avatar,"street-nightcap");profiles=JSON.parse(h.window.localStorage.getItem("los636_player_profiles"));assert.equal(profiles[0].avatar,"street-nightcap")
}));

test("Build 6.36 saved-player picker multi-selects searches and prevents duplicates",withHarness(h=>{
 const state=h.api.getState(),profiles=[{id:"p1",firstName:"Vicente",lastName:"Ayala",nickname:"Vince",name:"Vince",avatar:"adult-fade"},{id:"p2",firstName:"Maria",lastName:"Lopez",nickname:"",name:"Maria Lopez",avatar:"adult-bob"},{id:"p3",firstName:"George",lastName:"King",nickname:"Geo",name:"Geo",avatar:"senior-glasses"}];h.window.localStorage.setItem("los636_player_profiles",JSON.stringify(profiles));state.screen="players";state.mode="original";state.players=[];h.api.players();h.click("#selectPlayers");assert.equal(h.document.querySelectorAll("[data-saved-profile]").length,3);h.click('[data-picker-player="p1"]');h.click('[data-picker-player="p2"]');assert.deepEqual(Array.from(state.players,p=>p.id),["p1","p2"]);h.click('[data-picker-player="p1"]');assert.deepEqual(Array.from(state.players,p=>p.id),["p2"]);const search=h.document.querySelector('.los-player-search input');search.value="geo";search.dispatchEvent(new h.window.Event("input",{bubbles:true}));assert.equal(h.document.querySelectorAll("[data-saved-profile]").length,1);assert.equal(h.document.querySelector("[data-saved-profile]").dataset.savedProfile,"p3")
}));

test("Build 6.36 voice selects saved profiles by stable ID and rejects ambiguous names",withHarness(h=>{
 const state=h.api.getState(),profiles=[{id:"a",firstName:"Alex",lastName:"Able",nickname:"Ace",name:"Ace"},{id:"b",firstName:"Alex",lastName:"Baker",nickname:"Bee",name:"Bee"},{id:"m",firstName:"Maria",lastName:"Lopez",nickname:"Mari",name:"Mari"}];h.window.localStorage.setItem("los636_player_profiles",JSON.stringify(profiles));state.screen="players";state.mode="original";state.players=[];h.api.players();h.speak("Select Maria");assert.deepEqual(Array.from(state.players,p=>p.id),["m"]);h.speak("Maria is playing");assert.deepEqual(Array.from(state.players,p=>p.id),["m"]);h.speak("Alex");assert.deepEqual(Array.from(state.players,p=>p.id),["m"]);assert.ok(h.api.getVoiceDiagnostics().some(row=>row.reason==="ambiguous-saved-player-name"));h.speak("Add Ace");assert.deepEqual(Array.from(state.players,p=>p.id),["m","a"])
}));

test("player voice commands add, rename, delete, and incrementally spell", withHarness(h => {
  const state = h.api.getState();
  state.screen = "players";
  state.mode = "friends";
  state.players = [{ id: "p1", name: "Vicente" }, { id: "p2", name: "Todd" }];
  h.api.players();
  assert.doesNotThrow(() => h.speak("add player Maria"));
  assert.doesNotThrow(() => h.speak("change player two to Tom"));
  assert.doesNotThrow(() => h.speak("delete player three"));
  assert.doesNotThrow(() => h.speak("spell player two"));
  assert.doesNotThrow(() => h.speak("clear name"));
  assert.doesNotThrow(() => h.speak("tee"));
  assert.doesNotThrow(() => h.speak("oh"));
  assert.doesNotThrow(() => h.speak("em"));
  assert.doesNotThrow(() => h.speak("done"));
  assert.deepEqual(Array.from(state.players, p => p.name), ["Vicente", "tom"]);
}));

test("category voice selection is additive and explicit removal preserves other choices", withHarness(h => {
  const state = h.api.getState();
  state.screen = "fun";
  state.categories = [];
  h.api.fun();
  h.speak("Music");
  h.speak("Transportation");
  h.speak("Food and Drink");
  assert.deepEqual(Array.from(state.categories), ["Music", "Transportation", "Food & Drink"]);
  h.speak("remove Music");
  assert.deepEqual(Array.from(state.categories), ["Transportation", "Food & Drink"]);
}));

test("category touch and voice selection reach equivalent state", withHarness(h => {
  const state = h.api.getState();
  state.screen = "fun";
  state.categories = [];
  h.api.fun();
  h.click('[data-cat="Music"]');
  const touchState = [...state.categories];
  state.categories = [];
  h.api.fun();
  h.speak("Music");
  assert.deepEqual(Array.from(state.categories), touchState);
}));

test("Game Settings touch timer and duration controls update state deterministically", withHarness(h => {
  const state = h.api.getState();
  state.screen = "time";
  h.api.time();
  h.click('[data-sec="10"]');
  h.click('[data-min="5"]');
  assert.equal(state.questionSeconds, 10);
  assert.equal(state.duration, 5);
  assert.equal(state.quick, false);
}));

test("visible Game Settings timer controls remain voice-addressable", withHarness(h => {
  const state = h.api.getState();
  state.screen = "time";
  h.api.time();
  h.speak("10 sec");
  assert.equal(state.questionSeconds, 10);
}));

test("documented '10 seconds' Game Settings voice phrase reaches the visible timer control", withHarness(h => {
  const state = h.api.getState();
  state.screen = "time";
  state.questionSeconds = 15;
  h.api.time();
  h.speak("10 seconds");
  assert.equal(state.questionSeconds, 10);
}));

test("volume slider updates live volume and canonical persistence", withHarness(h => {
  const state = h.api.getState();
  state.screen = "time";
  h.api.time();
  const slider = h.document.querySelector("#vol");
  slider.value = "0.4";
  slider.dispatchEvent(new h.window.Event("input", { bubbles: true }));
  assert.equal(state.volume, 0.4);
  assert.equal(h.window.localStorage.getItem("los5_volume"), "0.4");
}));

test("Game Settings voice volume commands update state, slider, and canonical persistence", () => {
  const cases = [
    ["volume up", 0.4, 0.5],
    ["volume down", 0.5, 0.4],
    ["mute", 0.4, 0],
    ["full volume", 0.4, 1],
    ["half volume", 0.4, 0.5],
    ["volume 50", 0.4, 0.5],
    ["set volume to 75 percent", 0.4, 0.75]
  ];
  for (const [command, initial, expected] of cases) {
    const h = createHarness({ storage: { los5_volume: String(initial) } });
    try {
      const state = h.api.getState();
      state.screen = "time";
      h.api.time();
      h.speak(command);
      assert.ok(Math.abs(state.volume-expected)<1e-9, command);
      assert.equal(Number(h.window.localStorage.getItem("los5_volume")), expected, `${command} persistence`);
      assert.equal(Number(h.document.querySelector("#vol").value), expected, `${command} slider`);
    } finally { h.close(); }
  }
});

test("Mute and Unmute restore the last nonzero volume", withHarness(h => {
  const state = h.api.getState();
  state.screen = "time";
  h.api.time();
  const slider = h.document.querySelector("#vol");
  slider.value = "0.4";
  slider.dispatchEvent(new h.window.Event("input", { bubbles: true }));
  h.speak("mute");
  assert.equal(state.volume, 0);
  h.speak("unmute");
  assert.equal(state.volume, 0.4);
  assert.equal(h.window.localStorage.getItem("los5_volume"), "0.4");
}));

test("touch and voice volume changes produce equivalent state and persistence", () => {
  const touch = createHarness();
  const voice = createHarness();
  try {
    touch.api.getState().screen = "time";touch.api.time();
    const slider = touch.document.querySelector("#vol");
    slider.value = "0.75";slider.dispatchEvent(new touch.window.Event("input", { bubbles: true }));
    voice.api.getState().screen = "time";voice.api.time();voice.speak("set volume to 75 percent");
    assert.equal(voice.api.getState().volume, touch.api.getState().volume);
    assert.equal(voice.window.localStorage.getItem("los5_volume"), touch.window.localStorage.getItem("los5_volume"));
  } finally { touch.close();voice.close(); }
});

test("player Continue touch and voice both advance a valid roster to Showtime", withHarness(h => {
  const state = h.api.getState();
  state.screen = "players";
  state.mode = "friends";
  state.players = [{ id: "p1", name: "Alex" }, { id: "p2", name: "Blair" }];
  h.api.players();
  h.click("#continue");
  assert.equal(state.screen, "ready");

  h.timers.advance(220);
  state.screen = "players";
  h.api.players();
  h.speak("continue", { final: true });
  assert.equal(state.screen, "ready");
}));

test("fake timers deterministically drive question timeout", withHarness(h => {
  const state = setupQuestion(h);
  state.questionSeconds = 10;
  h.api.question();
  h.timers.advance(10000);
  assert.equal(state.game.players[0].timeout, 1);
  assert.equal(state.game.players[0].strikes, 1);
  assert.equal(state.screen, "result");
}));

test("Pause and Resume preserve the exact question and remaining seconds", withHarness(h => {
  const state = activeTimedQuestion(h);
  const original = state.game.current;
  h.timers.advance(4000);
  assert.equal(state.game.questionRemaining, 11);
  h.api.pauseGame();
  h.timers.advance(5000);
  assert.equal(state.game.questionRemaining, 11, "the question clock remains stopped while paused");
  h.api.resumeGame();
  assert.equal(state.game.current, original);
  assert.equal(h.document.querySelector("#timer").textContent, "11");
  h.timers.advance(1000);
  assert.equal(state.game.questionRemaining, 10);
}));

test("Quit Game from an active question pauses it and opens confirmation", withHarness(h => {
  const state = activeTimedQuestion(h);
  const original = state.game.current;
  h.timers.advance(3000);
  h.speak("quit game");
  assert.equal(state.screen, "paused");
  assert.equal(state.game.current, original);
  assert.equal(state.game.questionRemaining, 12);
  assert.ok(h.document.querySelector("#yes"));
}));

test("quit-confirmation cancel commands restore pause controls without losing the question", () => {
  for (const command of ["no", "cancel", "go back", "keep playing", "resume"]) {
    const h = createHarness();
    try {
      const state = activeTimedQuestion(h);
      const original = state.game.current;
      h.api.pauseGame();
      h.api.confirmEnd();
      h.speak(command);
      assert.equal(state.screen, "paused");
      assert.equal(state.game.current, original);
      assert.ok(h.document.querySelector("#resume"), `${command} should restore pause controls`);
    } finally { h.close(); }
  }
});

test("quit-confirmation approval commands still end the game", () => {
  for (const command of ["yes", "end game", "exit", "quit"]) {
    const h = createHarness();
    try {
      const state = activeTimedQuestion(h);
      h.api.pauseGame();
      h.api.confirmEnd();
      h.speak(command);
      assert.equal(state.game, null, `${command} should end the game`);
      assert.equal(state.screen, "home");
    } finally { h.close(); }
  }
});

test("mouse/touch Home Play routes through Choose Your Game and Who’s In", () => {
  const h=createHarness();
  try{
    const state=h.api.getState();h.click("#start");h.timers.advance(220);assert.equal(state.screen,"packs");assert.equal(state.mode,"original");assert.equal(h.document.querySelector("#continuePacks").textContent,"PLAY");assert.equal(h.document.querySelector("[data-mode]"),null);h.click("#continuePacks");h.timers.advance(220);assert.equal(state.screen,"players");addPlayerViaForm(h,"Alex");addPlayerViaForm(h,"Blair");h.click("#continue");h.timers.advance(220);assert.equal(state.screen,"ready");h.timers.advance(30000);assert.equal(state.screen,"ready");h.click("#showtimeStart");assert.equal(state.screen,"handoff");assert.equal(state.mode,"original");assert.equal(state.game.players.length,2)
  }finally{h.close()}
});

test("keyboard answer focuses, ignores empty Enter, and submits once", withHarness(h => {
  const state=setupQuestion(h);state.voiceOn=false;h.api.question(true);h.timers.advance(80);
  const input=h.document.querySelector("#typedAnswer");assert.equal(h.document.activeElement,input);
  input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));assert.equal(state.game.answered,false);
  input.value="Mars";input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));
  assert.equal(state.game.players[0].correct,1);assert.equal(state.game.answered,true);assert.equal(state.screen,"result")
}));

test("Build 6.36 Add Player form creates one profile only on save", withHarness(h => {
  const state=h.api.getState();state.mode="original";state.players=[];h.api.players();h.click("#add");assert.equal(state.players.length,0);const form=h.document.querySelector(".los-player-sheet");form.elements.firstName.value="Casey";form.dispatchEvent(new h.window.Event("submit",{bubbles:true,cancelable:true}));assert.equal(state.players.length,1);assert.equal(state.players[0].name,"Casey")
}));

test("pausing Result preserves that Result and resumes one delayed advancement", withHarness(h => {
  const state=setupQuestion(h);h.api.finish("wrong");const strikes=state.game.players[0].strikes;h.api.pauseGame();
  assert.equal(state.screen,"paused");assert.equal(h.document.activeElement?.id,"resume");h.timers.advance(10000);assert.equal(state.screen,"paused");
  h.click("#resume");assert.equal(state.screen,"result");assert.equal(state.game.players[0].strikes,strikes);h.timers.advance(4200);assert.notEqual(state.screen,"result");assert.equal(state.game.players[0].strikes,strikes)
}));

test("pause confirmation owns focus and returning Home clears celebration callbacks", withHarness(h => {
  const state=activeTimedQuestion(h);h.api.pauseGame();h.api.confirmEnd();assert.equal(h.document.activeElement?.id,"yes");h.click("#no");assert.equal(h.document.activeElement?.id,"resume");
  const player=state.game.players[0];h.api.champion(player);assert.equal(state.screen,"complete");h.click("#home");assert.equal(state.screen,"home");h.timers.advance(5000);assert.equal(state.screen,"home");assert.equal(h.document.querySelector(".confetti"),null)
}));

test("manual-control selected states expose accessible semantics", withHarness(h => {
  const state=h.api.getState();state.difficulty="hard";h.api.difficulty();assert.equal(h.document.querySelector('[data-difficulty="hard"]').getAttribute("aria-pressed"),"true");
  state.screen="time";h.api.time();assert.equal(h.document.querySelector('[data-sec="15"]').getAttribute("aria-pressed"),"true");assert.equal(h.document.querySelector("#vol").getAttribute("aria-label"),"Game volume");
  state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.players();assert.ok(h.document.querySelector('[data-selected-player="p1"]'));assert.equal(h.document.querySelector('[data-remove-player="p1"]').getAttribute("aria-label"),"Remove Alex from this game");assert.equal(h.document.querySelector("[data-host-style]"),null)
}));

test("manual Back and Exit controls follow setup state without corrupting selections", () => {
  for(const screen of ["difficulty","players","time","ready"]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.difficulty="hard";state.questionSeconds=20;state.duration=10;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen=screen;h.api[screen]();h.click("#back");assert.equal(state.screen,{difficulty:"mode",players:"packs",time:"players",ready:"players"}[screen]);assert.equal(state.difficulty,"hard");assert.equal(state.questionSeconds,20);assert.equal(state.duration,10);assert.equal(state.players.length,2)}finally{h.close()}}
  for(const screen of ["difficulty","players","time","ready"]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen=screen;h.api[screen]();h.click("[data-setup-exit]");assert.equal(state.screen,"home");assert.equal(state.game,null)}finally{h.close()}}
});

test("manual Leave preserves one resumable game while Quit clears it and its timer", () => {
  const leave=createHarness();try{const state=activeTimedQuestion(leave),game=state.game;leave.timers.advance(2000);leave.api.pauseGame();leave.click("#leave");assert.equal(state.screen,"home");assert.equal(state.game,null);assert.ok(leave.document.querySelector("#resumeSaved"));const remaining=game.questionRemaining;leave.timers.advance(20000);assert.equal(game.questionRemaining,remaining)}finally{leave.close()}
  const quit=createHarness();try{const state=activeTimedQuestion(quit),game=state.game;quit.api.pauseGame();quit.click("#end");quit.click("#yes");assert.equal(state.screen,"home");assert.equal(state.game,null);assert.equal(quit.document.querySelector("#resumeSaved"),null);quit.timers.advance(20000);assert.equal(game.players[0].strikes,0)}finally{quit.close()}
});

test("Champion PLAY AGAIN is primary and preserves setup while resetting every match field",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="work";state.players=[{id:"p1",name:"Marisol"},{id:"p2",name:"DeAndre"}];state.selectedIds=["p1","p2"];state.difficulty="hard";state.questionSeconds=20;state.duration=10;state.voiceOn=false;h.api.setVolume(.35);h.api.startGame();const old=state.game;Object.assign(old.players[0],{correct:7,wrong:2,strikes:2,eliminated:true,hostCategoryStats:{music:{correct:3}}});old.players[1].correct=4;old.idx=1;old.showdown=true;old.hostLeaderId="p2";old.current={q:"Old question",a:"Old answer"};old.lastOutcomeDetail="wrong";h.api.champion(old.players[1]);const play=h.document.getElementById("playAgain"),home=h.document.getElementById("home");assert.ok(play);assert.ok(play.classList.contains("primary"));assert.ok(!home.classList.contains("primary"));assert.equal(play.getAttribute("aria-label"),"Play again with the same setup");play.click();assert.equal(state.screen,"ready");assert.equal(state.game,null);assert.equal(state.mode,"work");assert.deepEqual(state.players.map(p=>p.name),["Marisol","DeAndre"]);assert.equal(state.difficulty,"hard");assert.equal(state.questionSeconds,20);assert.equal(state.duration,10);assert.equal(state.voiceOn,false);assert.equal(state.volume,.35);h.click("#showtimeStart");assert.equal(state.screen,"handoff");assert.notEqual(state.game,old);assert.deepEqual(state.game.players.map(p=>({name:p.name,correct:p.correct,strikes:p.strikes,eliminated:p.eliminated})),[{name:"Marisol",correct:0,strikes:0,eliminated:false},{name:"DeAndre",correct:0,strikes:0,eliminated:false}]);assert.equal(state.game.idx,0);assert.equal(state.game.showdown,false);assert.equal(state.game.hostLeaderId,null);assert.equal(state.game.current,null);assert.equal(state.game.used.length,0)}finally{h.close()}
});

test("Champion replay voice commands are explicit final-only and Home remains available",()=>{
 for(const phrase of ["play again","play another game","another game"]){const h=createHarness();try{const state=h.api.getState();state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.champion(state.game.players[0]);h.speak(phrase,{final:false});assert.equal(state.screen,"complete",phrase+" interim");h.speak(phrase,{final:true});assert.equal(state.screen,"ready",phrase)}finally{h.close()}}
 const h=createHarness();try{const state=h.api.getState();state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.champion(state.game.players[0]);h.speak("home",{isFinal:true});assert.equal(state.screen,"home");assert.equal(state.game,null)}finally{h.close()}
});

test("Champion PLAY AGAIN uses the button activation shared by mouse touch and keyboard",()=>{
 for(const input of ["mouse","touch","keyboard"]){const h=createHarness();try{const state=h.api.getState();state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();h.api.champion(state.game.players[0]);const button=h.document.getElementById("playAgain");button.focus();assert.equal(h.document.activeElement,button);button.click();assert.equal(state.screen,"ready",input)}finally{h.close()}}
});

test("Home exposes one Play route without visible Multiplayer or Solo choices",()=>{
 const h=createHarness();try{const state=h.api.getState();h.api.home();assert.equal(h.document.querySelectorAll("#start").length,1);assert.equal(h.document.querySelector("#start").getAttribute("aria-label"),"Play");for(const selector of ["#multiplayer","#solo","[data-setup-mode]","[data-mode]"])assert.equal(h.document.querySelector(selector),null);h.click("#start");h.timers.advance(220);assert.equal(state.screen,"packs");assert.equal(state.mode,"original");assert.equal(h.document.querySelector(".topbar-title").textContent,"CHOOSE YOUR GAME");assert.equal(h.document.querySelector("#continuePacks").textContent,"PLAY");assert.equal(h.document.body.textContent.includes("SOLO"),false);assert.equal(h.document.body.textContent.includes("MULTIPLAYER"),false)}finally{h.close()}
});

test("Build 6.36 Home How to Play and Settings are functional without duplicating utilities",withHarness(h=>{
 const state=h.api.getState();h.api.home();assert.equal(h.document.querySelectorAll("#homeMic,#homeSound").length,0);assert.equal(h.document.querySelectorAll("#start,#homeHow,#homeSettings").length,3);h.click("#homeHow");assert.match(h.document.querySelector(".los-home-dialog").textContent,/HOW TO PLAY/);assert.equal(h.document.activeElement.getAttribute("aria-label"),"Close How to Play");h.click(".los-home-dialog [data-close]");h.click("#homeSettings");const range=h.document.querySelector('.los-home-volume input[type="range"]');range.value="0.4";range.dispatchEvent(new h.window.Event("input",{bubbles:true}));assert.equal(state.volume,.4);assert.equal(h.document.querySelector(".los-home-volume strong").textContent,"40%");h.click("[data-settings-mute]");assert.equal(state.volume,0);h.click("[data-settings-mute]");assert.equal(state.volume,.4);h.click("[data-settings-mic]");assert.equal(state.voiceOn,false);assert.match(h.document.querySelector(".los-build-info").textContent,/6\.36/);h.click(".los-home-dialog [data-close]");assert.equal(h.document.querySelector(".los-home-dialog"),null)
}));

test("multiplayer Continue opens content packs before the dedicated roster page",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";h.api.go("setup");h.timers.advance(220);h.click("#startGame");assert.equal(state.screen,"packs");h.timers.advance(220);h.click("#continuePacks");assert.equal(state.screen,"players");assert.equal(state.players.length,0);assert.ok(h.document.querySelector(".los-selected-empty"));addPlayerViaForm(h,"Jordan");assert.equal(state.players.at(-1).name,"Jordan");assert.equal(h.document.querySelectorAll("[data-selected-player]").length,1)}finally{h.close()}
});

test("Who’s In real setup lifecycle owns a listening recognizer and final navigation advances once",()=>{
 for(const phrase of ["continue","next","start"]){const h=createHarness();try{const state=h.api.getState();h.click("#start");h.timers.advance(220);h.click("#continuePacks");h.timers.advance(220);assert.equal(state.screen,"players",phrase);state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.players();const recognizer=h.recognition(),voice=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().recognition;assert.equal(voice.state,"listening",phrase);assert.equal(voice.owner.screen,"players",phrase);recognizer.emit(phrase,{final:false,confidence:.99,resultIndex:0});assert.equal(state.screen,"players",phrase+" interim");recognizer.emit(phrase,{final:true,confidence:.99,resultIndex:0});assert.equal(state.screen,"ready",phrase);recognizer.emit(phrase,{final:true,confidence:.99,resultIndex:0});assert.equal(state.screen,"ready",phrase+" duplicate final");assert.equal(state.game,null)}finally{h.close()}}
});

test("Who’s In finalizes an exact interim command when WebKit ends speech without a final result",()=>{
 for(const phrase of ["continue","next","start"]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.players();const recognition=h.recognition();recognition.emit(phrase,{final:false,confidence:.8,resultIndex:0});assert.equal(state.screen,"players",phrase);recognition.speechEnd();h.timers.advance(239);assert.equal(state.screen,"players",phrase+" before finalization");h.timers.advance(1);assert.equal(state.screen,"ready",phrase);assert.ok(h.api.getVoiceDiagnostics().some(row=>row.stage==="players-navigation-finalized"&&row.command===phrase))}finally{h.close()}}
});

test("numbered defaults apply only to automatically generated players",()=>{
 const fresh=createHarness();try{const state=fresh.api.getState();state.mode="original";state.players=[];state.screen="players";fresh.api.players();assert.deepEqual(Array.from(state.players,p=>p.name),[]);assert.ok(fresh.document.querySelector(".los-selected-empty"));fresh.speak("6 players",{final:true});assert.deepEqual(Array.from(state.players,p=>p.name),["Player 1","Player 2","Player 3","Player 4","Player 5","Player 6"])}finally{fresh.close()}
 const custom=createHarness();try{const state=custom.api.getState();state.mode="original";state.players=[{id:"p1",name:"Vicente"},{id:"p2",name:"T"}];state.screen="players";custom.api.players();custom.speak("change player two to Teemoney");custom.speak("add another player");assert.deepEqual(Array.from(state.players,p=>p.name),["Vicente","Teemoney","Player 3"])}finally{custom.close()}
});

test("used question IDs survive save/resume and remain ineligible",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.contentPacks=["street","movies","music"];state.difficulty="medium";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();const first=h.api.pickQuestion();assert.ok(first?.id);h.api.saveActiveGame();state.game=null;h.api.resumeSavedGame();assert.ok(state.game.used.includes(first.id));const second=h.api.pickQuestion();assert.ok(second?.id);assert.notEqual(second.id,first.id);assert.equal(new Set(state.game.used).size,state.game.used.length)
}));

test("exhausted filtered question pools end gracefully without recycling",withHarness(h=>{
 const state=h.api.getState();state.mode="solo";state.contentPacks=["disney"];state.difficulty="easy";state.players=[{id:"p1",name:"Alex"}];h.api.startGame();const used=[];for(;;){const q=h.api.QUESTION_BANK.select({edition:"solo",packs:state.contentPacks,difficulty:state.difficulty,usedIds:used,random:()=>0});if(!q)break;used.push(q.id)}assert.ok(used.length>0);state.game.used=[...used];assert.doesNotThrow(()=>h.api.question());assert.equal(state.screen,"complete");assert.equal(state.game.poolExhausted,true);assert.equal(new Set(state.game.used).size,state.game.used.length)
}));

test("roster validation occurs on Who's In and valid Continue reaches Showtime",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:""}];state.screen="setup";h.api.setup();h.click("#startGame");h.timers.advance(220);assert.equal(state.screen,"packs");h.click("#continuePacks");assert.equal(state.screen,"players");h.timers.advance(220);h.click("#continue");assert.equal(state.screen,"players");assert.match(h.document.getElementById("rosterError").textContent,/two named/i);state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Alex"}];h.api.players();h.click("#continue");assert.equal(state.screen,"players");assert.match(h.document.getElementById("rosterError").textContent,/unique/i);state.players[1].name="Blair";h.api.players();h.click("#continue");assert.equal(state.screen,"ready");assert.match(h.document.querySelector(".compact-ready").textContent,/MULTIPLAYER.*MEDIUM.*15 SEC.*READ ON/)}finally{h.close()}
});

test("Unified Setup Voice Volume and Read Questions controls use canonical persistence",()=>{
 const h=createHarness();try{const state=h.api.getState();h.api.go("setup");h.timers.advance(220);h.click("#setupVoiceOff");assert.equal(state.screen,"setup");assert.equal(state.voiceOn,false);assert.equal(h.window.localStorage.getItem("los5_voice"),"false");h.click("#setupVoiceOn");assert.equal(state.voiceOn,true);h.click("#readQuestionsOff");assert.equal(state.readQuestions,false);assert.equal(h.window.localStorage.getItem("los5_read_questions"),"false");h.click("#readQuestionsOn");assert.equal(state.readQuestions,true);const volume=h.document.getElementById("vol");volume.value="0.4";volume.dispatchEvent(new h.window.Event("input",{bubbles:true}));assert.equal(state.volume,.4);assert.equal(h.window.localStorage.getItem("los5_volume"),"0.4");assert.equal(state.screen,"setup")}finally{h.close()}
 const restored=createHarness({storage:{los5_read_questions:"false"}});try{assert.equal(restored.api.getState().readQuestions,false)}finally{restored.close()}
});

test("Game Setup voice changes choices and Continue opens the correct next page",()=>{
 const h=createHarness();try{const state=h.api.getState();h.api.go("setup");h.timers.advance(220);h.speak("solo");assert.equal(state.screen,"setup");assert.equal(state.mode,"solo");h.speak("multiplayer");assert.equal(state.mode,"original");h.speak("hard");assert.equal(state.difficulty,"hard");h.speak("20 seconds");assert.equal(state.questionSeconds,20);h.speak("5 minutes");assert.equal(state.duration,5);h.speak("read questions off");assert.equal(state.readQuestions,false);h.speak("continue",{final:false});assert.equal(state.screen,"setup");h.speak("continue",{final:true});assert.equal(state.screen,"packs");h.timers.advance(220);assert.equal(state.screen,"packs")}finally{h.close()}
});

test("detached legacy Continue cannot advance Game Setup and final Back returns Home once",()=>{
 const h=createHarness();try{const state=h.api.getState();state.screen="time";h.api.time();const stale=h.document.getElementById("continue");h.api.go("setup");h.timers.advance(220);stale.click();assert.equal(state.screen,"setup");h.speak("back",{final:false});assert.equal(state.screen,"setup");h.speak("back",{final:true});assert.equal(state.screen,"home");const transition=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().lastTransition;assert.equal(transition.from,"setup");assert.equal(transition.to,"home");assert.equal(transition.reason,"setup-back")}finally{h.close()}
});

test("Who’s In voice player totals create practical editable rosters without a product cap",()=>{
 for(const total of [2,6,13,20,30,120]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.players();h.speak(`${total} players`,{final:true});assert.equal(state.players.length,total);assert.equal(h.document.querySelectorAll("[data-selected-player]").length,total);assert.equal(state.players.at(-1).name,total===2?"Blair":`Player ${total}`)}finally{h.close()}}
});

test("player-count commands use total semantics and protect meaningful trailing names",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.players();h.speak("Add 13 players");assert.equal(state.players.length,13);h.speak("Make it 20 players");assert.equal(state.players.length,20);Object.assign(state.players[19],{name:"Jordan",firstName:"Jordan",lastName:"",nickname:"",autoName:false});h.api.players();h.speak("Set 6 players");assert.equal(state.players.length,20);assert.ok(h.api.getVoiceDiagnostics().some(x=>x.reason==="roster-count-would-remove-names"));state.players.slice(6).forEach(p=>Object.assign(p,{name:"",firstName:"",lastName:"",nickname:""}));h.api.players();h.speak("6 players");assert.equal(state.players.length,6)
}));

test("unfinished setup data never creates a Home Resume Game control",()=>{
 const setup=createHarness();try{const state=setup.api.getState();state.screen="setup";state.audience="general";state.topics=[];setup.api.setup();setup.click('[data-setup-difficulty="hard"]');setup.api.exitSetup?.();setup.speak("exit game");assert.equal(state.screen,"home");assert.equal(setup.document.querySelector("#resumeSaved"),null)}finally{setup.close()}
 const roster=createHarness();try{const state=roster.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";roster.api.players();addPlayerViaForm(roster,"Casey");roster.click("[data-setup-exit]");assert.equal(state.screen,"home");assert.equal(roster.document.querySelector("#resumeSaved"),null);assert.equal(state.game,null)}finally{roster.close()}
});

test("multiple final guesses retain the full timer and a later correct answer scores once",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={q:"What planet?",a:"Mars"};h.timers.advance(8000);assert.equal(state.game.questionRemaining,7);h.speak("Venus",{final:true});assert.equal(state.screen,"question");assert.equal(state.game.answered,false);assert.equal(state.game.players[0].strikes,0);h.speak("Jupiter",{final:true});assert.equal(state.game.speechLog.length,2);h.timers.advance(4000);assert.equal(state.game.questionRemaining,3);h.speak("Mars",{final:true});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);assert.equal(state.game.players[0].strikes,0);assert.equal(state.game.lastSpeechLog.length,3)
}));

test("background speech and interim transcripts cannot end a turn",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={q:"What planet?",a:"Mars"};const remaining=state.game.questionRemaining;h.speak("the television is talking over there",{final:false});assert.equal(state.game.speechLog.length,0);h.speak("the television is talking over there",{final:true});assert.equal(state.screen,"question");assert.equal(state.game.answered,false);assert.equal(state.game.players[0].strikes,0);h.timers.advance(1000);assert.equal(state.game.questionRemaining,remaining-1);h.speak("Mars",{final:true});assert.equal(state.game.players[0].correct,1)
}));

test("timeout and explicit Pass or Skip create only one unsuccessful outcome",()=>{
 for(const phrase of ["Pass","I pass","Pass this","Skip","Skip it","Skip this one"]){const h=createHarness();try{const state=activeTimedQuestion(h);state.game.current={q:"What planet?",a:"Mars"};h.speak(phrase,{final:false});assert.equal(state.screen,"question",phrase);h.speak(phrase,{final:true});assert.equal(state.screen,"result",phrase);assert.equal(state.game.players[0].strikes,1,phrase);h.speak(phrase,{final:true});assert.equal(state.game.players[0].strikes,1,phrase)}finally{h.close()}}
 const timeout=createHarness();try{const state=activeTimedQuestion(timeout);state.game.current={q:"What planet?",a:"Mars"};timeout.speak("Venus");timeout.speak("Jupiter");timeout.timers.advance(15000);assert.equal(state.screen,"result");assert.equal(state.game.players[0].strikes,1);assert.equal(state.game.players[0].timeout,1);assert.equal(timeout.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().audio.buzzerFired,true)}finally{timeout.close()}
});

test("proper-name pronunciation tolerance remains identity precise",withHarness(h=>{
 for(const [heard,answer] of [["Arita Franklin","Aretha Franklin"],["Denzel Washingten","Denzel Washington"],["Lionel Messy","Lionel Messi"],["Frida Kalo","Frida Kahlo"],["Jose Marti","José Martí"]])assert.equal(h.api.accepted(heard,{a:answer}),true,`${heard} → ${answer}`);for(const heard of ["Franklin Roosevelt","Aretha","Franklin"])assert.equal(h.api.accepted(heard,{a:"Aretha Franklin"}),false,heard)
}));

test("Pause button and keyboard freeze audio, recognition ownership, and exact remaining time",withHarness(h=>{
 const state=activeTimedQuestion(h);h.timers.advance(4000);const remaining=state.game.questionRemaining;h.click("#pause");assert.equal(state.screen,"paused");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().audio.tick,"off");assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerListening,false);h.timers.advance(20000);assert.equal(state.game.questionRemaining,remaining);h.click("#resume");assert.equal(state.screen,"question");assert.equal(state.game.questionRemaining,remaining);h.window.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"p",bubbles:true,cancelable:true}));assert.equal(state.screen,"paused");h.timers.advance(5000);assert.equal(state.game.questionRemaining,remaining);h.speak("resume",{final:true});assert.equal(state.screen,"question");h.timers.advance(1000);assert.equal(state.game.questionRemaining,remaining-1)
}));

test("Player-Up diagnostics prove one render generation for each turn",withHarness(h=>{
 const state=h.api.getState(),messages=()=>h.window.__LOS_PLAYTEST_DIAGNOSTICS__.playerUps().filter(x=>x.phase==="message");state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();let entries=messages();assert.equal(entries.length,1);assert.equal(entries[0].activePlayer,"Alex");h.api.advance();assert.equal(state.screen,"handoff");entries=messages();assert.equal(entries.length,2);assert.equal(entries[1].activePlayer,"Blair");assert.equal(new Set(entries.map(x=>x.renderGeneration)).size,2)
}));

test("Stage 6.13 Back is final-only and moves exactly one setup screen",()=>{
 for(const [mode,screen,target] of [["original","players","packs"],["original","ready","players"],["solo","ready","packs"]]){const h=createHarness();try{const state=h.api.getState();state.mode=mode;state.screen=screen;h.api[screen]();h.speak("back",{final:false});assert.equal(state.screen,screen);h.speak("back",{final:true});assert.equal(state.screen,target);h.timers.advance(1000);assert.equal(state.screen,target);assert.notEqual(state.screen,"home")}finally{h.close()}}
});

test("only an unfinished active game creates Home Resume",()=>{
 const fresh=createHarness({storage:{los5_voice:"false",los5_volume:"0.4",los5_read_questions:"false"}});try{assert.equal(fresh.document.querySelector("#resumeSaved"),null);fresh.click("#start");fresh.timers.advance(220);assert.equal(fresh.api.getState().screen,"packs");fresh.api.back();assert.equal(fresh.api.getState().screen,"home");assert.equal(fresh.document.querySelector("#resumeSaved"),null,"game selection never creates a fake Resume Game");fresh.api.go("setup");fresh.timers.advance(220);fresh.api.back();assert.equal(fresh.document.querySelector("#resumeSaved"),null,"abandoned setup data is not a legitimate unfinished game")}finally{fresh.close()}
 const stale=createHarness({storage:{los5_setup_state:JSON.stringify({version:1,kind:"setup",screen:"setup",players:[]})}});try{assert.equal(stale.document.querySelector("#resumeSaved"),null,"obsolete setup records are not resumable")}finally{stale.close()}
});

test("one visible Player-Up presentation contains the only countdown",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();assert.equal(state.screen,"handoff");assert.equal(h.document.querySelector(".transition-screen"),null);const message=h.document.getElementById("playerUpMessage");assert.ok(message);assert.equal(message.hidden,false);assert.equal(h.document.querySelectorAll(".handoff").length,1);h.timers.advance(449);assert.equal(h.document.getElementById("handoffCount").textContent,"");h.timers.advance(1);assert.equal(h.document.getElementById("handoffCount").textContent,"3");const trace=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.playerUps();assert.equal(trace.filter(x=>x.phase==="message").length,1);assert.equal(trace.filter(x=>x.phase==="countdown").length,1);assert.equal(trace.find(x=>x.phase==="message").visible,true);assert.equal(trace.at(-1).playerUpVisible,true);assert.equal(trace.at(-1).visibleHype,"YOU’RE UP!")
}));

test("answer diagnostics explain exact, rejected, resumed, and near-timeout recognition",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"trace-1",q:"What planet?",a:"Mars",accept:["the planet Mars"],es:["Marte"],alts:["Mars planet"]};h.speak("Venus",{final:true});let trace=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.answers().at(-1);assert.equal(trace.accepted,false);assert.equal(trace.rejectionReason,"no-controlled-concept-or-identity-match");assert.equal(trace.questionId,"trace-1");assert.equal(trace.acceptedSpanish.length,1);assert.equal(trace.acceptedSpanish[0],"Marte");h.timers.advance(13000);assert.equal(state.game.questionRemaining,2);h.speak("Mars",{final:true});trace=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.answers().at(-1);assert.equal(trace.accepted,true);assert.equal(trace.matchMethod,"exact-canonical");assert.equal(state.game.players[0].correct,1)
}));

test("controlled same-meaning answers accept identity equivalents and reject related concepts",withHarness(h=>{
 const trace=(heard,q)=>h.api.answerMatchTrace(heard,q),accepted=[
  ["automobile",{a:"car"},"generic-safe-equivalence"],["TV",{a:"television"},"generic-safe-equivalence"],["U.S.",{a:"United States"},"generic-safe-equivalence"],
  ["Second World War",{a:"World War II"},"generic-safe-equivalence"],["NYC",{a:"New York City"},"generic-safe-equivalence"],["motorcar",{a:"car",equivalents:["motorcar"]},"concept-equivalent"],
  ["Marte",{a:"Mars",es:["Marte"]},"accepted-spanish"],["automobiles",{a:"automobile"},"safe-word-form"]
 ];for(const [heard,q,method] of accepted){const x=trace(heard,q);assert.equal(x.accepted,true,heard);assert.equal(x.method,method,heard)}
 for(const [heard,q] of [["animal",{a:"dog"}],["vehicle",{a:"car"}],["California",{a:"Los Angeles"}],["Aretha Franklin",{a:"Franklin D. Roosevelt"}],["singer",{a:"Respect"}],["sport",{a:"basketball"}],["planet",{a:"Mars"}]])assert.equal(trace(heard,q).accepted,false,`${heard} must not satisfy ${q.a}`)
}));

test("answer wrappers are removed only as anchored framing around an independently correct answer",withHarness(h=>{
 const q={a:"Mars",es:["Marte"]};
 for(const heard of ["it is Mars","it's Mars","I think it's Mars","I think it is Mars","my answer is Mars","the answer is Mars","I'm going with Mars"]){
  const match=h.api.answerMatchTrace(heard,q);assert.equal(match.accepted,true,heard);assert.equal(match.method,"exact-canonical",heard)
 }
 for(const heard of ["it is Mars and Venus","I'm going with planet Mars","my answer is not Mars","Mars is my answer","I think Mars might be wrong"])assert.equal(h.api.accepted(heard,q),false,heard);
 assert.equal(h.api.accepted("I think it's Marte",q),true,"Spanish metadata survives an English speech wrapper");
 assert.equal(h.api.answerMatchTrace("I think it's Marte",q).method,"accepted-spanish")
}));

test("Build 6.35 safely accepts conversational and hesitation framing",withHarness(h=>{
 const cases=[
  ["Probably Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["Maybe the Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["Is it Pacific?",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["I'm pretty sure it's Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["I'm gonna say Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["I am going to say Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["um Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["uh I think it's Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["I think the answer is CNG",{a:"CNG",accept:["compressed natural gas"]}],
  ["I'm pretty sure it's 1991",{a:"1991"}],
  ["Probably compressed natural gas",{a:"CNG",accept:["compressed natural gas"]}],
  ["Maybe P endorsement",{a:"P endorsement",accept:["passenger endorsement"]}],
  ["Is it three quarters of a mile",{a:"3/4 mile",accept:["three quarters of a mile","0.75 mile"]}],
  ["um ADA",{a:"ADA",accept:["Americans with Disabilities Act"]}],
  ["uh SunDial",{a:"SunDial"}],
  ["I'm gonna say wheelchair ramp",{q:"What type of accessibility device may allow a wheelchair user to board a bus?",a:"Ramp or lift"}],
  ["Probably Graham Bell",{q:"Who is credited with inventing the telephone?",a:"Alexander Graham Bell"}],
  ["Maybe so it doesn't move",{q:"Why must cargo be secured?",a:"So it does not shift"}],
  ["I'm pretty sure it's Marte",{a:"Mars",es:["Marte"]}],
  ["uh I think the answer is fourteen",{a:"14",accept:["fourteen"]}]
 ];
 for(const [heard,q] of cases)assert.equal(h.api.accepted(heard,q),true,heard);
 for(const [heard,q] of [
  ["probably not Pacific",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["maybe Atlantic",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["is it Atlantic",{q:"What ocean is west of California?",a:"Pacific Ocean"}],
  ["I think Mars might be wrong",{a:"Mars"}],
  ["um air compressor",{a:"air compressor governor"}],
  ["probably bus",{a:"SunDial"}],
  ["maybe CNG",{a:"hydrogen"}],
  ["is it ocean",{a:"Pacific Ocean"}],
  ["uh vehicle",{a:"car"}],
  ["I'm gonna say Alexander Bell",{a:"Alexander Graham Bell"}]
 ])assert.equal(h.api.accepted(heard,q),false,heard)
}));

test("Build 6.35 finalizes one accepted WebKit interim at a speech boundary",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"webkit-boundary",q:"What planet is red?",a:"Mars"};const r=h.recognition();r.emit("Mars",{final:false,confidence:.4});assert.equal(state.screen,"question");r.speechEnd();h.timers.advance(239);assert.equal(state.screen,"question");h.timers.advance(1);assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1)
}));

test("Build 6.35 finalizes an accepted interim when WebKit ends without a final",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"webkit-end",q:"What planet is red?",a:"Mars"};const r=h.recognition();r.emit("Mars",{final:false,confidence:.4});assert.equal(state.screen,"question");r.end();assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1)
}));

test("exact wrapper-like titles match before wrapper fallback",withHarness(h=>{
 const titles=["It Is What It Is","It's a Wonderful Life","My Answer Is Love","The Answer Is Forty-Two","I'm Going With You"];
 for(const title of titles){
  const match=h.api.answerMatchTrace(title,{a:title,accept:["what it is","a wonderful life","love","forty two","you"]});
  assert.equal(match.accepted,true,title);assert.equal(match.method,"exact-canonical",title);assert.equal(match.matched,title,title)
 }
 assert.equal(h.api.accepted("It Is What It Is",{a:"It Is What It Isn't"}),false);
 assert.equal(h.api.accepted("my answer is not Mars",{a:"Mars"}),false);
 assert.equal(h.api.accepted("it is Mars and Venus",{a:"Mars"}),false)
}));

test("United States equivalence stays explicit and narrowly bounded",withHarness(h=>{
 const trace=(heard,q)=>h.api.answerMatchTrace(heard,q);
 const match=trace("United States America",{a:"United States of America"});assert.equal(match.accepted,true);assert.equal(match.method,"generic-safe-equivalence");
 for(const [heard,q] of [
  ["United States Mexico",{a:"United States of America"}],
  ["States America",{a:"United States of America"}]
 ])assert.equal(trace(heard,q).accepted,false,heard)
}));

test("landmark designators never create global proper-name equivalences",withHarness(h=>{
 const trace=(heard,q)=>h.api.answerMatchTrace(heard,q),collisions=[
  ["Mount Everest",{a:"Everest"}],["Everest",{a:"Mount Everest"}],["Mount Kilimanjaro",{a:"Kilimanjaro"}],
  ["Mount McKinley",{a:"McKinley"}],["Mount Rushmore",{a:"Rushmore"}],["Rushmore",{a:"Mount Rushmore"}],
  ["Everest Street",{a:"Everest"}],["Everest County",{a:"Everest"}],["Lake Everest",{a:"Everest"}],
  ["Michigan",{a:"Lake Michigan"}],["Lake Michigan",{a:"Michigan"}],["Mount Alexander",{a:"Alexander"}]
 ];
 for(const [heard,q] of collisions)assert.equal(trace(heard,q).accepted,false,`${heard} must not satisfy ${q.a}`);
 const metadata=trace("Mount Everest",{a:"Everest",accept:["Mount Everest"]});assert.equal(metadata.accepted,true);assert.equal(metadata.method,"accepted-english")
}));

test("name shortening and descriptive shortening require question-specific accepted metadata",withHarness(h=>{
 const cases=[
  ["Alexander Graham Bell",{a:"Graham Bell"},{a:"Graham Bell",accept:["Alexander Graham Bell"]}],
  ["natural selection",{a:"The theory of evolution by natural selection"},{a:"The theory of evolution by natural selection",accept:["natural selection"]}]
 ];
 for(const [heard,withoutMetadata,withMetadata] of cases){
  assert.equal(h.api.accepted(heard,withoutMetadata),false,`${heard} must not be a global rule`);
  const match=h.api.answerMatchTrace(heard,withMetadata);assert.equal(match.accepted,true,heard);assert.equal(match.method,"accepted-english",heard)
 }
 assert.equal(h.api.accepted("Kennedy John",{a:"John Kennedy"}),false,"proper-name token order remains significant");
 assert.equal(h.api.accepted("Alexander Bell",{a:"Graham Bell",accept:["Alexander Graham Bell"]}),false);
 assert.equal(h.api.accepted("evolution",{a:"The theory of evolution by natural selection",accept:["natural selection"]}),false)
}));

test("concept-equivalent answers score through fake recognition after an earlier guess",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"equivalent-voice",q:"What common word means automobile?",a:"car",equivalents:["automobile"]};const remaining=state.game.questionRemaining;h.speak("vehicle",{final:true});assert.equal(state.screen,"question");assert.equal(state.game.questionRemaining,remaining);h.speak("automobile",{final:true});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.answers().at(-1).matchMethod,"concept-equivalent")
}));

test("Read Questions voice commands own one setup action and preserve Voice Volume and navigation",()=>{
 const commands=[["read question off",false],["read questions off",false],["turn read question off",false],["turn read questions off",false],["read question on",true],["read questions on",true],["turn read question on",true],["turn read questions on",true],["read the question",true],["read the questions",true],["don't read the question",false],["don't read the questions",false]];
 for(const [command,expected] of commands){const h=createHarness();try{const state=h.api.getState();state.screen="setup";state.voiceOn=true;state.volume=.65;state.readQuestions=!expected;h.api.setup();const beforeScreen=state.screen,beforeVoice=state.voiceOn,beforeVolume=state.volume;h.speak(command,{final:true});assert.equal(state.readQuestions,expected,command);assert.equal(state.screen,beforeScreen,command);assert.equal(state.voiceOn,beforeVoice,command);assert.equal(state.volume,beforeVolume,command);assert.equal(h.window.localStorage.getItem("los5_read_questions"),String(expected),command);assert.equal(h.document.getElementById(expected?"readQuestionsOn":"readQuestionsOff").getAttribute("aria-pressed"),"true",command);const diagnostics=h.api.getVoiceDiagnostics().filter(x=>x.stage==="setup-setting-command");assert.equal(diagnostics.length,1,command);assert.equal(diagnostics[0].matchedSetting,"readQuestions");assert.equal(diagnostics[0].parserStopped,true)}finally{h.close()}}
});

test("Voice On and Voice Off never mutate Read Questions",()=>{
 for(const readQuestions of [false,true])for(const command of ["voice on","voice off"]){const h=createHarness();try{const state=h.api.getState();state.screen="setup";state.readQuestions=readQuestions;h.api.setup();h.speak(command,{final:true});assert.equal(state.readQuestions,readQuestions,`${command}/${readQuestions}`)}finally{h.close()}}
});

test("named setup toggles have exclusive parser ownership and complete diagnostics",()=>{
 const cases=[
  ["read questions off","readQuestions",false,"read-questions"],
  ["turn read questions off","readQuestions",false,"read-questions"],
  ["read questions on","readQuestions",true,"read-questions"],
  ["turn read questions on","readQuestions",true,"read-questions"],
  ["voice off","voiceOn",false,"voice"],
  ["voice on","voiceOn",true,"voice"]
 ];
 for(const [command,setting,expected,intent] of cases){const h=createHarness();try{const state=h.api.getState();state.screen="setup";state.voiceOn=true;state.readQuestions=true;state.volume=.65;h.api.setup();state[setting]=!expected;if(setting==="readQuestions")h.api.setup();const before={screen:state.screen,voiceOn:state.voiceOn,readQuestions:state.readQuestions,volume:state.volume,mode:state.mode,difficulty:state.difficulty,questionSeconds:state.questionSeconds,duration:state.duration};h.speak(command,{final:true});assert.equal(state[setting],expected,command);assert.equal(state.screen,before.screen,command);assert.equal(state.volume,before.volume,command);assert.equal(state.mode,before.mode,command);assert.equal(state.difficulty,before.difficulty,command);assert.equal(state.questionSeconds,before.questionSeconds,command);assert.equal(state.duration,before.duration,command);if(setting==="readQuestions")assert.equal(state.voiceOn,before.voiceOn,command);else assert.equal(state.readQuestions,before.readQuestions,command);const selected=setting==="readQuestions"?(expected?"#readQuestionsOn":"#readQuestionsOff"):(expected?"#setupVoiceOn":"#setupVoiceOff");assert.equal(h.document.querySelector(selected).getAttribute("aria-pressed"),"true",command);assert.equal(h.window.localStorage.getItem(setting==="readQuestions"?"los5_read_questions":"los5_voice"),String(expected),command);const diagnostics=h.api.getVoiceDiagnostics().filter(x=>x.stage==="setup-setting-command");assert.equal(diagnostics.length,1,command);assert.equal(diagnostics[0].rawTranscript,command);assert.equal(diagnostics[0].normalizedTranscript,command);assert.equal(diagnostics[0].matchedIntent,intent);assert.equal(diagnostics[0].matchedSetting,setting);assert.equal(diagnostics[0].oldValue,!expected);assert.equal(diagnostics[0].newValue,expected);assert.equal(diagnostics[0].parserStopped,true);assert.ok(diagnostics[0].parserBranch);assert.ok(diagnostics[0].rejectedSecondaryMatches.length>0)}finally{h.close()}}
});

test("bare setup on off is rejected and a later named recognition alternative executes once",()=>{
 const h=createHarness();try{const state=h.api.getState();state.screen="setup";state.voiceOn=true;state.readQuestions=true;h.api.setup();h.speak("off",{final:true,alternatives:["read questions off"]});assert.equal(state.readQuestions,false);assert.equal(state.voiceOn,true);assert.equal(state.screen,"setup");assert.equal(h.api.getVoiceDiagnostics().filter(x=>x.stage==="setup-setting-command").length,1);assert.ok(h.api.getVoiceDiagnostics().some(x=>x.reason==="ambiguous-setup-toggle-label"))}finally{h.close()}
});

test("Build 6.36 hides Host style while preserving legacy values and neutral defaults",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.screen="players";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Vanessa",hostStyle:"feminine"}];h.api.players();assert.equal(state.players[0].hostStyle,"neutral");assert.equal(h.document.querySelector("[data-host-style]"),null);assert.doesNotMatch(h.document.body.textContent,/MASCULINE|FEMININE|HOST STYLE/);const saved=JSON.parse(h.window.localStorage.getItem("los5_setup_state"));assert.equal(saved.players[0].hostStyle,"neutral");assert.equal(saved.players[1].hostStyle,"feminine");h.api.startGame();assert.equal(state.game.players[0].hostStyle,"neutral");assert.equal(state.game.players[1].hostStyle,"feminine");h.api.champion(state.game.players[0]);h.api.replayGame();assert.equal(state.players[0].hostStyle,"neutral");assert.equal(state.players[1].hostStyle,"feminine")
}));

test("physical Read Questions controls persist and govern actual question narration",()=>{
 for(const enabled of [false,true]){const pending=[],provider={available:true,calls:[],play(cue){this.calls.push(cue);return new Promise(resolve=>pending.push(resolve))},cancel(){pending.splice(0).forEach(resolve=>resolve())},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.screen="setup";state.voiceOn=true;state.readQuestions=!enabled;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.setup();h.click(enabled?"#readQuestionsOn":"#readQuestionsOff");assert.equal(state.readQuestions,enabled);assert.equal(h.window.localStorage.getItem("los5_read_questions"),String(enabled));assert.equal(h.document.getElementById(enabled?"readQuestionsOn":"readQuestionsOff").getAttribute("aria-pressed"),"true");assert.equal(state.voiceOn,true);h.api.startGame();h.api.question();assert.equal(provider.calls.some(x=>x.event==="questionRead"),enabled);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,enabled?"stopped":"running")}finally{h.close()}}
});

test("Stage 6.15 production flow preserves every major screen in sequence",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.voiceOn=false;state.readQuestions=true;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"},{id:"p3",name:"Casey"}];state.screen="players";h.api.go("ready","production-playthrough");h.timers.advance(220);assert.equal(state.screen,"ready");h.click("#showtimeStart");assert.equal(state.screen,"handoff");h.timers.advance(3450);assert.equal(state.screen,"question");state.game.current={id:"flow-q",q:"What planet is red?",a:"Mars",cat:"Science"};state.game.answered=false;h.api.finish("correct");assert.equal(state.screen,"result");h.timers.advance(3200);assert.equal(state.screen,"handoff");state.game.players[2].eliminated=true;h.api.showdownIntro();assert.equal(state.screen,"showdown");h.timers.advance(3700);assert.equal(state.screen,"handoff");h.api.champion(state.game.players[0]);assert.equal(state.screen,"complete");const screens=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.lifetimes().map(x=>x.screen);for(const expected of ["ready","handoff","question","result","showdown","complete"])assert.ok(screens.includes(expected),expected)
}));

test("Stage 6.19 strike awards are atomic, capped at three, and eliminate immediately",()=>{
 for(const [before,after,eliminated] of [[0,1,false],[1,2,false],[2,3,true]]){const h=createHarness();try{const state=setupQuestion(h);state.game.players[0].strikes=before;h.api.finish("wrong");assert.equal(state.game.players[0].strikes,after);assert.equal(state.game.players[0].eliminated,eliminated);const saved=JSON.parse(h.window.localStorage.getItem("los5_active_game"));assert.equal(saved.game.players[0].strikes,after);assert.equal(saved.game.players[0].eliminated,eliminated)}finally{h.close()}}
 const h=createHarness();try{const state=setupQuestion(h);const player=state.game.players[0];player.strikes=3;player.eliminated=true;h.api.finish("wrong");h.api.finish("timeout");assert.equal(player.strikes,3);assert.equal(player.wrong,0);assert.equal(player.timeout,0)}finally{h.close()}
});

test("eliminated players cannot receive another normal Player-Up turn",withHarness(h=>{
 const state=setupQuestion(h);state.game.players.push({id:"p2",name:"Blair",correct:0,wrong:0,timeout:0,strikes:0,eliminated:false});state.game.startingCount=2;state.game.players[0].strikes=3;state.game.players[0].eliminated=true;state.game.idx=0;h.api.handoff();assert.equal(state.game.idx,1);assert.match(h.document.querySelector(".handoff-player-name").textContent,/Blair/);assert.equal(h.document.querySelectorAll(".handoff").length,1)
}));

test("active-match Resume button and spoken Resume restore the same checkpoint",()=>{
 for(const viaVoice of [false,true]){const h=createHarness();try{const state=activeTimedQuestion(h),original=state.game;original.players.push({id:"p2",name:"Blair",correct:3,wrong:0,timeout:0,strikes:1,eliminated:false});state.players=original.players.map(p=>({id:p.id,name:p.name}));original.startingCount=2;original.idx=1;original.qnum=7;original.used=["q1","q2"];original.players[0].strikes=2;h.api.pauseGame();h.click("#leave");assert.equal(state.screen,"home");assert.ok(h.document.querySelector("#resumeSaved"));if(viaVoice){h.speak("resume",{final:false});assert.equal(state.screen,"home");h.speak("resume",{final:true})}else h.click("#resumeSaved");assert.equal(state.screen,"handoff");assert.notEqual(state.game,original);assert.equal(state.game.idx,1);assert.equal(state.game.qnum,7);assert.deepEqual(Array.from(state.game.used),["q1","q2"]);assert.equal(state.game.players[0].strikes,2);assert.equal(state.game.players[1].strikes,1);assert.equal(state.game.current,null);assert.equal(state.game.answered,false)}finally{h.close()}}
});

test("completed matches clear active Resume and Play Again resets strikes",withHarness(h=>{
 const state=setupQuestion(h);state.players=state.game.players.map(p=>({id:p.id,name:p.name}));state.game.players[0].strikes=2;h.api.champion(state.game.players[0]);assert.equal(h.window.localStorage.getItem("los5_active_game"),null);h.click("#playAgain");assert.equal(state.game,null);assert.equal(state.players[0].strikes,undefined);h.api.home();assert.equal(h.document.querySelector("#resumeSaved"),null)
}));

test("Final Showdown third strike reaches the correct Champion",withHarness(h=>{
 const state=setupQuestion(h);state.game.players=[{id:"p1",name:"Alex",correct:2,wrong:0,timeout:0,strikes:2,eliminated:false},{id:"p2",name:"Blair",correct:3,wrong:0,timeout:0,strikes:0,eliminated:false}];state.game.startingCount=2;state.game.showdown=true;state.game.idx=0;state.game.current={q:"What planet?",a:"Mars",cat:"Science"};state.game.answered=false;h.api.finish("wrong");assert.equal(state.game.players[0].eliminated,true);h.timers.advance(5200);assert.equal(state.screen,"complete");assert.equal(h.document.querySelector(".champion-name").textContent,"Blair");assert.equal(h.window.localStorage.getItem("los5_active_game"),null)
}));

test("Game Setup voice repairs execute immediately once and preserve portrait scroll",withHarness(h=>{
 const state=h.api.getState();state.screen="setup";h.api.setup();const content=h.document.querySelector(".content");content.scrollTop=173;h.speak("medium",{final:false,confidence:.01});assert.equal(state.difficulty,"medium");assert.equal(h.document.querySelector(".content").scrollTop,173);h.speak("medium",{final:true,confidence:.01});assert.equal(state.difficulty,"medium");h.speak("savage",{final:false,confidence:.01});assert.equal(state.difficulty,"savage");h.speak("20 sec",{final:false,confidence:.01});assert.equal(state.questionSeconds,20);const before=state.volume;h.speak("volume up",{final:false,confidence:.01});assert.equal(state.volume,Math.min(1,before+.1));h.speak("set volume to 50 percent",{final:false,confidence:.01});assert.equal(state.volume,.5);assert.equal(h.document.querySelector(".content").scrollTop,173)
}));

test("Showtime Start Back and Exit are final-only and use the visible controls",()=>{
 const make=()=>{const h=createHarness();const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.api.ready();return{h,state}};
 {const{h,state}=make();try{assert.equal(h.document.querySelector(".topbar-title").textContent.replace(/\s+/g,""),"IT’SSHOWTIME");assert.deepEqual([...h.document.querySelectorAll(".topbar-title span")].map(e=>e.textContent),["IT’S","SHOWTIME"]);h.speak("start",{final:false,confidence:.2});assert.equal(state.screen,"ready");h.speak("start",{final:true});assert.equal(state.screen,"handoff")}finally{h.close()}}
 {const{h,state}=make();try{h.speak("go back",{final:false});assert.equal(state.screen,"ready");h.speak("go back",{final:true});assert.equal(state.screen,"players")}finally{h.close()}}
 {const{h,state}=make();try{h.speak("exit",{final:false});assert.equal(state.screen,"ready");h.speak("exit",{final:true});assert.equal(state.screen,"home")}finally{h.close()}}
});

test("Lock In remains visible for 1.6 seconds without waiting for Host",withHarness(h=>{
 const state=setupQuestion(h);h.api.transition("question",()=>h.api.question(),"lock-in-test");assert.equal(state.screen,"transition");h.timers.advance(1599);assert.equal(state.screen,"transition");h.timers.advance(1);assert.equal(state.screen,"question")
}));

test("Stage 6.20 exact safe settings remain interim while navigation and destructive commands are final-only",()=>{
 const h=createHarness();try{const state=h.api.getState();state.screen="setup";h.api.setup();h.speak("hard",{final:false,confidence:.01});assert.equal(state.difficulty,"hard");h.speak("20 seconds",{final:false,confidence:.01});assert.equal(state.questionSeconds,20);h.speak("back",{final:false});assert.equal(state.screen,"setup");h.speak("back",{final:true});assert.equal(state.screen,"home")}finally{h.close()}
});

test("Stage 6.20 Leave Game and Exit Game use the canonical saved-game Home path and require final speech",()=>{
 for(const phrase of ["leave game","exit game"]){const h=createHarness();try{const state=activeTimedQuestion(h);const game=state.game;h.speak(phrase,{final:false});assert.equal(state.screen,"question",phrase);assert.equal(state.game,game);h.speak(phrase,{final:true});assert.equal(state.screen,"home",phrase);assert.ok(h.document.querySelector("#resumeSaved"),phrase);assert.ok(h.window.localStorage.getItem("los5_active_game"),phrase)}finally{h.close()}}
});

test("Stage 6.20 background command-like speech is rejected and a later intended answer executes",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"party-answer",q:"What planet is red?",a:"Mars"};h.speak("go back to the house",{final:true,confidence:.18});assert.equal(state.screen,"question");assert.equal(state.game.answered,false);h.speak("Mars",{final:true,confidence:.2});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1)
}));

test("Stage 6.20 accepts a bounded correct question alternative without broadening answer matching",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"alternative-answer",q:"Who sang Respect?",a:"Aretha Franklin"};h.speak("Franklin Roosevelt",{final:true,confidence:.72,alternatives:[{transcript:"Aretha Franklin",confidence:.61}]});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);assert.ok(h.api.getVoiceDiagnostics().some(x=>x.stage==="answer-alternative-promoted"&&x.alternative===1))
}));

test("Stage 6.20 spoken answers execute synchronously after the final callback",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"latency-answer",q:"What planet is red?",a:"Mars"};h.recognition().speechStart();h.speak("Mars",{final:true});const rows=h.api.getVoiceDiagnostics(),final=[...rows].reverse().find(x=>x.stage==="first-final-transcript"),executed=[...rows].reverse().find(x=>x.stage==="answer-executed");assert.ok(final&&executed);assert.ok(executed.monoAt-final.monoAt<10);assert.equal(state.screen,"result")
}));

test("Stage 6.20 no-speech recovery is prompt and normal screen changes do not churn recognition",withHarness(h=>{
 const first=h.recognition(),initialCount=FakeSpeechRecognition.instances.length;h.api.go("setup");h.api.setup();assert.equal(h.recognition(),first);assert.equal(FakeSpeechRecognition.instances.length,initialCount);first.error("no-speech");first.end();h.timers.advance(24);assert.equal(FakeSpeechRecognition.instances.length,initialCount);h.timers.advance(1);assert.equal(FakeSpeechRecognition.instances.length,initialCount+1);const snapshot=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().recognition;assert.equal(snapshot.state,"listening");assert.equal(snapshot.restartCount,1);assert.equal(snapshot.lastError,"no-speech")
}));

test("Stage 6.23 controlled answer forgiveness accepts knowledge without accepting related concepts",withHarness(h=>{
 const cases=[["Stop",{q:"What does a flashing red light mean?",a:"A complete stop"},"canonical-safe-descriptor"],["Five",{q:"How many pieces are required?",a:"Five pieces"},"question-context-unit-omission"],["the Pacific Ocean!",{q:"Which ocean?",a:"Pacific Ocean"},"exact-canonical"],["automobiles",{q:"What vehicles?",a:"automobile"},"safe-word-form"]];
 for(const [heard,q,method] of cases){const match=h.api.answerMatchTrace(heard,q);assert.equal(match.accepted,true,heard);assert.equal(match.method,method,heard)}
 for(const [heard,q] of [["slow down",{q:"What does a flashing red light mean?",a:"A complete stop"}],["Five",{q:"Name the card combination",a:"Five pieces"}],["ocean",{q:"Which ocean?",a:"Pacific Ocean"}]])assert.equal(h.api.accepted(heard,q),false,heard)
}));

test("meaningful partial answers preserve player intent without accepting generic fragments",withHarness(h=>{
 const accepted=[
  ["Pacific",{q:"Which ocean is the largest?",a:"Pacific Ocean"}],
  ["natural selection",{q:"What mechanism did Darwin describe?",a:"The theory of evolution by natural selection"}],
  ["Graham Bell",{q:"Who invented the telephone?",a:"Alexander Graham Bell"}],
  ["Roosevelt",{q:"Who was the 26th U.S. president?",a:"Theodore Roosevelt"}],
  ["Golden Gate",{q:"Name the famous San Francisco bridge",a:"Golden Gate Bridge"}]
 ];
 for(const [heard,q] of accepted){const match=h.api.answerMatchTrace(heard,q);assert.equal(match.accepted,true,heard);assert.equal(match.method,"meaningful-partial",heard)}
 for(const [heard,q] of [
  ["ocean",{q:"Which ocean is the largest?",a:"Pacific Ocean"}],
  ["theory",{q:"What mechanism did Darwin describe?",a:"The theory of evolution by natural selection"}],
  ["president",{q:"Who was the 26th U.S. president?",a:"Theodore Roosevelt"}],
  ["bridge",{q:"Name the famous San Francisco bridge",a:"Golden Gate Bridge"}],
  ["Alexander",{q:"Who invented the telephone?",a:"Alexander Graham Bell"}]
 ])assert.equal(h.api.accepted(heard,q),false,heard)
}));

test("Family-Feud-style judging accepts safe equivalents and category examples",withHarness(h=>{
 const accepted=[
  ["the conflict",{q:"What is the struggle in a story called?",a:"conflict"}],
  ["central conflict",{q:"What is the struggle in a story called?",a:"conflict"}],
  ["struggle",{q:"What is the struggle in a story called?",a:"conflict"}],
  ["problem",{q:"What is the struggle in a story called?",a:"conflict"}],
  ["cardiovascular system",{q:"Which body system uses the heart and blood vessels?",a:"circulatory system"}],
  ["circulatory",{q:"Which body system uses the heart and blood vessels?",a:"circulatory system"}],
  ["banana",{q:"Name a food",a:"food"}],
  ["pizza",{q:"Name a food",a:"food"}],
  ["taco",{q:"Name a food",a:"food"}],
  ["car",{q:"Name a vehicle",a:"vehicle"}],
  ["truck",{q:"Name a vehicle",a:"vehicle"}],
 ["bus",{q:"Name a vehicle",a:"vehicle"}]
  ,["so it doesn't move",{q:"Why should cargo be secured?",a:"so the cargo does not shift"}]
  ,["wheelchair ramp",{q:"What can help a wheelchair enter the bus?",a:"ramp or lift"}]
  ,["Pacific",{q:"Which ocean borders California?",a:"Pacific Ocean"}]
  ,["Graham Bell",{q:"Who invented the telephone?",a:"Alexander Graham Bell"}]
  ,["natural selection",{q:"What idea did Darwin develop?",a:"the theory of evolution by natural selection"}]
 ];
 for(const [heard,q] of accepted)assert.equal(h.api.accepted(heard,q),true,heard);
 for(const heard of ["plot","character","setting"])assert.equal(h.api.accepted(heard,{q:"What is the struggle in a story called?",a:"conflict"}),false,heard)
}));

test("rejected answer diagnostics expose normalized input concepts aliases rules and reason",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"diagnostic-conflict",q:"What is the struggle in a story called?",a:"conflict",accept:["central conflict"]};h.speak("plot",{final:true});const attempt=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.answers().at(-1),match=h.api.getVoiceDiagnostics().filter(row=>row.stage==="answer-match-produced").at(-1);assert.equal(state.screen,"question");assert.equal(attempt.normalizedTranscript,"plot");assert.equal(attempt.canonicalAnswer,"conflict");assert.equal(attempt.rejectionReason,"no-controlled-concept-or-identity-match");assert.ok(attempt.semanticRulesAttempted.includes("safe-concept-equivalence"));assert.ok(attempt.aliasesConsidered.some(entry=>entry.value==="central conflict"));assert.equal(match.expectedAnswer,"conflict");assert.equal(match.reason,"no-controlled-concept-or-identity-match")
}));

test("speech begun before zero can finalize after zero exactly once",withHarness(h=>{
 const state=activeTimedQuestion(h),r=h.recognition();state.game.current={id:"late-20",q:"What comes next: 4, 8, 12, 16?",a:"20"};h.timers.advance(14000);r.speechStart();h.timers.advance(1000);assert.equal(state.screen,"question");assert.equal(state.game.questionRemaining,0);r.emit("20",{final:true});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);assert.equal(state.game.players[0].timeout,0);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().audio.buzzerFired,false);r.emit("20",{final:true});h.timers.advance(1500);assert.equal(state.game.players[0].correct,1);assert.equal(state.game.players[0].timeout,0)
}));

test("speech begun after zero cannot use another utterance's grace window",withHarness(h=>{
 const state=activeTimedQuestion(h),r=h.recognition();state.game.current={id:"late-start",q:"What comes next: 4, 8, 12, 16?",a:"20"};h.timers.advance(14000);r.speechStart();h.timers.advance(1000);r.speechStart();r.emit("20",{final:true});assert.equal(state.screen,"question");assert.equal(state.game.players[0].correct,0);h.timers.advance(1200);assert.equal(state.screen,"result");assert.equal(state.game.players[0].timeout,1);assert.equal(state.game.players[0].correct,0)
}));

test("normal setup visibly requires the hierarchical multi-select Game Mix step",withHarness(h=>{
 const state=h.api.getState();state.screen="setup";h.api.setup();assert.equal(h.document.querySelector("[data-topic]"),null);h.click("#startGame");assert.equal(state.screen,"packs");assert.match(h.document.querySelector(".topbar-title").textContent,/CHOOSE YOUR GAME/);for(const id of ["general","work","kids"])assert.ok(h.document.querySelector(`[data-audience="${id}"]`),id);for(const id of ["culture","transit","entertainment","brain"])assert.ok(h.document.querySelector(`[data-topic="${id}"]`),id);assert.equal(h.document.querySelector('[data-transit="sunline"]'),null);h.click('[data-topic="culture"]');h.click('[data-topic="transit"]');assert.ok(h.document.querySelector('[data-transit="sunline"]'));assert.deepEqual(Array.from(state.contentPacks),["street","transit"]);assert.match(h.document.querySelector('[data-topic="culture"]').textContent,/THE CULTURE/)
}));

test("Build 6.34 exposes multi-select Transit lanes only under Transit",withHarness(h=>{const state=h.api.getState();state.screen="packs";h.api.packs();for(const id of ["transit-general","fixed-route","paratransit","cdl-dmv","sunline"])assert.equal(h.document.querySelector(`[data-transit="${id}"]`),null,id);h.click('[data-topic="transit"]');for(const id of ["transit-general","fixed-route","paratransit","cdl-dmv","sunline"])assert.ok(h.document.querySelector(`[data-transit="${id}"]`),id);assert.deepEqual(Array.from(state.contentPacks),["transit"]);h.click('[data-transit="fixed-route"]');h.click('[data-transit="cdl-dmv"]');assert.deepEqual(Array.from(state.contentPacks),["fixed-route","cdl-dmv"]);h.click('[data-transit="fixed-route"]');assert.deepEqual(Array.from(state.contentPacks),["cdl-dmv"])}));

test("Build 6.34 migrates old Transit and SunLine saved selections",()=>{for(const [source,expected] of [[{topics:["transit"],transitSubcategories:[],contentPacks:["transit"]},[]],[{topics:["transit"],transitSubcategories:["transit"],contentPacks:["transit"]},["transit-general"]],[{contentPacks:["sunline"]},["sunline"]]]){const saved={version:1,mode:"original",players:[{id:"p1",name:"Alex"}],game:{players:[{id:"p1",name:"Alex",strikes:0,eliminated:false}],idx:0,used:[]},...source},h=createHarness({storage:{los5_active_game:JSON.stringify(saved)}});try{h.api.resumeSavedGame();const state=h.api.getState();assert.ok(state.topics.includes("transit"));assert.deepEqual(Array.from(state.transitSubcategories),expected);assert.deepEqual(Array.from(state.contentPacks),expected.length?expected:["transit"])}finally{h.close()}}});

test("Build 6.34 semantic judge accepts narrow Transit aliases",withHarness(h=>{const state=activeTimedQuestion(h);for(const [id,heard] of [["los-b9-cdl-003","P endorsement"],["los-b9-cdl-006","fourteen days"],["los-b9-cdl-016","low air pressure warning"],["los-b9-para-001","complementary paratransit"]]){const q=h.api.QUESTION_BANK.toGameplay(h.api.QUESTION_BANK.byId.get(id));state.screen="question";state.game.current=q;state.game.answered=false;assert.equal(h.api.accepted(heard,q),true,`${id}:${heard}`)}}));

test("Build 6.29 saved pack values migrate into the Build 6.30 hierarchy",()=>{const cases=[
 [["original"],"general",[],[],[],[]],[["work"],"work",[],[],[],[]],[["kids"],"kids",[],[],[],[]],[["street"],"general",["culture"],[],[],[]],[["sunline"],"general",["transit"],[],["sunline"],[]],[["movies","music","disney"],"general",["entertainment"],["movies","music","disney"],[],[]],[["known","riddles"],"general",["brain"],[],[],["known","riddles"]]
 ];for(const [packs,audience,topics,entertainment,transit,brain] of cases){const saved={version:1,mode:"original",contentPacks:packs,players:[{id:"p1",name:"Alex"}],game:{players:[{id:"p1",name:"Alex",strikes:0,eliminated:false}],idx:0,used:[]}},h=createHarness({storage:{los5_active_game:JSON.stringify(saved)}});try{h.api.resumeSavedGame();const state=h.api.getState();assert.equal(state.audience,audience,packs);assert.deepEqual(Array.from(state.topics),topics,packs);assert.deepEqual(Array.from(state.entertainmentSubcategories),entertainment,packs);assert.deepEqual(Array.from(state.transitSubcategories),transit,packs);assert.deepEqual(Array.from(state.brainSubcategories),brain,packs)}finally{h.close()}}});

test("Work and Kids audience safety is enforced before mixed-topic weighting",withHarness(h=>{const bank=h.api.QUESTION_BANK;for(const audience of ["work","kids"])for(let i=0;i<60;i++){const q=bank.select({audience,packs:["street","music","movies","transit"],difficulty:"medium",random:()=>i/61});assert.ok(q,audience);assert.equal(audience==="kids"?q.kidsSafe:q.workSafe,true,`${audience}:${q.id}`);if(audience==="work")assert.ok(q.editions.includes("work"),q.id)}}));

test("Build 6.30 reveals the preserved Music filters only under Entertainment and Music",withHarness(h=>{const state=h.api.getState();state.screen="packs";state.musicSubcategories=[];h.api.packs();assert.equal(h.document.querySelector("[data-music-subcategory]"),null);h.click('[data-topic="entertainment"]');for(const id of ["movies","music","disney"])assert.ok(h.document.querySelector(`[data-entertainment="${id}"]`),id);h.click('[data-entertainment="music"]');for(const id of ["hip-hop","r-and-b","pop","rock","classic-rock","rock-and-roll","funk","soul","motown","lowrider-oldies","latin-oldies","regional-mexican","today","1970s","1980s","1990s","2000s"])assert.ok(h.document.querySelector(`[data-music-subcategory="${id}"]`),id);h.click('[data-music-subcategory="lowrider-oldies"]');h.click('[data-music-subcategory="today"]');assert.deepEqual(Array.from(state.musicSubcategories),["lowrider-oldies","today"]);assert.equal(h.document.querySelector('[data-all-music]').getAttribute("aria-pressed"),"false");h.click('[data-all-music]');assert.deepEqual(Array.from(state.musicSubcategories),[]);h.click('[data-entertainment="music"]');assert.equal(h.document.querySelector("[data-music-subcategory]"),null)}));

test("Build 6.29 persists Music filters and defaults older saves to All Music",()=>{const h=createHarness();try{const state=h.api.getState();state.screen="setup";state.contentPacks=["music"];state.musicSubcategories=["hip-hop","1990s"];h.api.saveSetupState("setup");const saved=h.api.loadSetupState();assert.deepEqual(Array.from(saved.musicSubcategories),["hip-hop","1990s"]);state.players=[{id:"p1",name:"Alex"}];state.game={players:[{id:"p1",name:"Alex",strikes:0}],idx:0,used:[]};h.api.saveActiveGame();assert.deepEqual(Array.from(h.api.loadActiveGame().musicSubcategories),["hip-hop","1990s"])}finally{h.close()}const old=createHarness({storage:{los5_active_game:JSON.stringify({version:1,mode:"original",contentPacks:["music"],players:[{id:"p1",name:"Alex"}],game:{players:[{id:"p1",name:"Alex",strikes:0}],idx:0,used:[]}})}});try{old.api.resumeSavedGame();assert.deepEqual(Array.from(old.api.getState().musicSubcategories),[])}finally{old.close()}});

test("earned category knowledge and fast answers select one contextual host reaction",()=>{
 const street=createHarness();try{street.window.Math.random=()=>0;const state=setupQuestion(street),player=state.game.players[0],host=street.api.getHostSystem();state.game.current={id:"street-reaction",q:"Which artist recorded The Chronic?",a:"Dr. Dre",cat:"Music",packs:["street","music"]};state.game.questionStartedWith=15;state.game.questionRemaining=13;const before=host.history.length;street.api.finish("correct");assert.equal(host.history.length,before+1);assert.equal(host.history.at(-1).event,"streetKnowledge");assert.equal(host.history.at(-1).context.name,player.name);assert.equal(street.document.querySelectorAll(".host-reaction-callout").length,1);assert.equal(street.document.querySelector(".host-reaction-callout").textContent,host.history.at(-1).text);street.api.finish("correct");assert.equal(host.history.length,before+1);assert.equal(street.document.querySelectorAll(".host-reaction-callout").length,1);street.timers.advance(3200);assert.equal(street.document.querySelector(".host-reaction-callout"),null)}finally{street.close()}
 const fast=createHarness();try{fast.window.Math.random=()=>0;const state=setupQuestion(fast),host=fast.api.getHostSystem();state.game.current={id:"fast-reaction",q:"What planet is red?",a:"Mars",cat:"Science & Nature",packs:["original"]};state.game.questionStartedWith=15;state.game.questionRemaining=14;const before=host.history.length;fast.api.finish("correct");assert.equal(host.history.length,before+1);assert.equal(host.history.at(-1).event,"fastCorrect");assert.ok(fast.document.querySelector(".host-reaction-callout"))}finally{fast.close()}
});

test("a three-answer streak earns one visible callout",withHarness(h=>{
 h.window.Math.random=()=>0;const state=setupQuestion(h),player=state.game.players[0],host=h.api.getHostSystem();player.hostCorrectStreak=2;state.game.current={id:"streak-reaction",q:"What planet is red?",a:"Mars",cat:"Science & Nature",packs:["original"]};state.game.questionStartedWith=15;state.game.questionRemaining=9;h.api.finish("correct");assert.equal(host.history.at(-1).event,"streak");const callout=h.document.querySelector(".host-reaction-callout");assert.ok(callout);assert.equal(callout.textContent,host.history.at(-1).text);assert.equal(h.document.querySelectorAll(".host-reaction-callout").length,1)
}));

test("ordinary correct answers remain restrained instead of forcing a reaction",withHarness(h=>{
 h.window.Math.random=()=>.99;const state=setupQuestion(h),host=h.api.getHostSystem();state.game.current={id:"ordinary-reaction",q:"What planet is red?",a:"Mars",cat:"Science & Nature",packs:["original"]};state.game.questionStartedWith=15;state.game.questionRemaining=10;const before=host.history.length;h.api.finish("correct");assert.equal(host.history.length,before+1);assert.equal(host.history.at(-1).event,"correct");assert.equal(host.history.at(-1).result,"frequency-skip")
 assert.equal(h.document.querySelector(".host-reaction-callout"),null)
}));

test("visible reactions remain safe with Voice Off in Kids and Work games",()=>{
 for(const pack of ["kids","work"]){const h=createHarness();try{h.window.Math.random=()=>0;const state=setupQuestion(h);state.voiceOn=false;state.contentPacks=[pack];state.game.current={id:`${pack}-reaction`,q:"What planet is red?",a:"Mars",cat:"Science & Nature",packs:["original"],kidsSafe:true,workSafe:true};state.game.questionStartedWith=15;state.game.questionRemaining=14;h.api.finish("correct");const callout=h.document.querySelector(".host-reaction-callout");assert.ok(callout,pack);assert.doesNotMatch(callout.textContent,/damn|homie|perro|compa/i,pack);assert.equal(h.api.getHostSystem().history.at(-1).result,"voice-disabled")}finally{h.close()}}
});

test("Stage 6.23 stable interim answer reacts early once and ignores the trailing final",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"red-light",q:"What does a flashing red light mean?",a:"A complete stop"};const r=h.recognition();r.speechStart();r.emit("stop",{final:false,confidence:.55});assert.equal(state.screen,"question");r.emit("stop",{final:false,confidence:.55});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);r.emit("stop",{final:true,confidence:.9});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);const rows=h.api.getVoiceDiagnostics();assert.equal(rows.filter(x=>x.stage==="answer-executed").length,1);assert.ok(rows.some(x=>x.stage==="answer-interim-evaluated"&&x.stable));assert.ok(rows.some(x=>x.stage==="ui-reaction-begins"));const attempt=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.answers().at(-1);assert.equal(attempt.isFinal,false)
}));

test("Stage 6.23 high-confidence exact commands can react on interim while destructive commands wait",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="ready";h.api.ready();h.speak("start",{final:false,confidence:.95});assert.equal(state.screen,"handoff")}finally{h.close()}
});

test("focused presentation repair separates Lock In and title-cases lowercase answers",withHarness(h=>{
 const state=setupQuestion(h);state.game.players[0].name="Alexandria Montgomery-Washington";h.api.transition("lockIn",()=>{});assert.equal(h.document.querySelector(".transition-big").textContent,"LOCK IN");assert.equal(h.document.querySelector(".lock-in-player").textContent,"Alexandria Montgomery-Washington");assert.equal(h.document.querySelector(".transition-big").textContent.includes(","),false);
 state.game.current={id:"display-answer",q:"Name the book",a:"the old man and the sea"};state.game.answered=true;h.api.result("correct");assert.equal(h.document.querySelector(".answer-big").textContent,"The Old Man and the Sea")
}));

test("Champion confetti streams until navigation and then cleans up",withHarness(h=>{
 const state=setupQuestion(h),player=state.game.players[0];h.api.champion(player);assert.ok([...h.timers.jobs.values()].some(job=>job.interval===900));h.timers.advance(2700);assert.ok(h.document.querySelectorAll(".confetti i").length>22);h.click("#home");assert.equal(state.screen,"home");assert.equal([...h.timers.jobs.values()].some(job=>job.interval===900),false)
}));
