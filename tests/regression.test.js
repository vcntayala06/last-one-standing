"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness");

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

test("fake SpeechRecognition is active and routes a Home command", withHarness(h => {
  assert.equal(h.api.getState().screen, "home");
  h.speak("start", { final: false });
  assert.equal(h.api.getState().screen, "setup");
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
 const source=h.api.QUESTION_BANK.byId.get("los-b2-sports-418"),q=h.api.QUESTION_BANK.toGameplay(source);assert.equal(q.a,"Stanley Cup");assert.ok(q.accept.includes("stanley cup"));assert.equal(h.api.accepted("The Stanley Cup.",q),true);assert.equal(h.api.accepted("Stanley",q),false);assert.equal(h.api.accepted("Stanford Cup",q),false)
}));

test("accepted English, Spanish, and legacy alts are precise but transcription-safe",withHarness(h=>{
 assert.equal(h.api.accepted("PACIFIC OCEAN!",{a:"Pacific Ocean",accept:["pacific"],es:["océano pacífico"],alts:["the pacific"]}),true);assert.equal(h.api.accepted("oceano pacifico",{a:"Pacific Ocean",es:["océano pacífico"]}),true);assert.equal(h.api.accepted("three hundred and sixty six",{a:"366",alts:["three hundred and sixty six"]}),true);assert.equal(h.api.accepted("Atlantic Ocean",{a:"Pacific Ocean",accept:["pacific"]}),false)
}));

test("protected question routing scores final answers only", withHarness(h => {
  const state = setupQuestion(h);
  state.game.current={q:"What planet?",a:"Mars"};h.api.question(true);
  assert.equal(h.api.centralQuestionIntent("Mars", false, 1), false);
  assert.equal(state.game.answered,false);
  assert.equal(h.api.centralQuestionIntent("Mars", true, 0.5), true);
  assert.equal(state.game.answered, true);
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

test("player touch controls add, edit, and delete without changing production logic", withHarness(h => {
  const state = h.api.getState();
  state.screen = "players";
  state.mode = "friends";
  state.players = [{ id: "p1", name: "Vicente" }, { id: "p2", name: "Todd" }];
  h.api.players();
  h.click("#add");
  const input = h.document.querySelectorAll("[data-p]")[2];
  input.value = "Maria";
  input.dispatchEvent(new h.window.Event("input", { bubbles: true }));
  assert.equal(state.players[2].name, "Maria");
  h.click(`[data-remove="${state.players[2].id}"]`);
  assert.deepEqual(Array.from(state.players, p => p.name), ["Vicente", "Todd"]);
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
  h.speak("continue", { final: false });
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

test("mouse/touch controls start Original, Work Edition, and Solo through Unified Setup", () => {
  for(const mode of ["original","work","solo"]){
    const h=createHarness();
    try{
      const state=h.api.getState();h.click("#start");h.timers.advance(220);assert.equal(state.screen,"setup");h.click(`[data-setup-mode="${mode}"]`);
      h.click('[data-setup-difficulty="hard"]');h.click('[data-setup-seconds="20"]');h.click('[data-setup-minutes="10"]');h.click("#startGame");h.timers.advance(220);if(mode!=="solo"){assert.equal(state.screen,"players");h.click("#continue");h.timers.advance(220)}
      assert.equal(state.screen,"ready");h.timers.advance(30000);assert.equal(state.screen,"ready");h.click("#showtimeStart");assert.equal(state.screen,"handoff");assert.equal(state.mode,mode);assert.equal(state.game.players.length,mode==="solo"?1:3)
    }finally{h.close()}
  }
});

test("keyboard answer focuses, ignores empty Enter, and submits once", withHarness(h => {
  const state=setupQuestion(h);state.voiceOn=false;h.api.question(true);h.timers.advance(80);
  const input=h.document.querySelector("#typedAnswer");assert.equal(h.document.activeElement,input);
  input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));assert.equal(state.game.answered,false);
  input.value="Mars";input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));
  assert.equal(state.game.players[0].correct,1);assert.equal(state.game.answered,true);assert.equal(state.screen,"result")
}));

test("detached Add Player control cannot perform a duplicate mutation", withHarness(h => {
  const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.players();
  const add=h.document.querySelector("#add");add.click();add.click();assert.equal(state.players.length,3)
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
  state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.players();assert.equal(h.document.querySelector("[data-remove]").getAttribute("aria-label"),"Delete contestant 1")
}));

test("manual Back and Exit controls follow setup state without corrupting selections", () => {
  for(const screen of ["difficulty","players","time","ready"]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.difficulty="hard";state.questionSeconds=20;state.duration=10;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen=screen;h.api[screen]();h.click("#back");assert.equal(state.screen,{difficulty:"mode",players:"setup",time:"players",ready:"players"}[screen]);assert.equal(state.difficulty,"hard");assert.equal(state.questionSeconds,20);assert.equal(state.duration,10);assert.equal(state.players.length,2)}finally{h.close()}}
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

test("Home opens Game Setup with settings only and no roster fields",()=>{
 const h=createHarness();try{const state=h.api.getState();h.click("#start");h.timers.advance(220);assert.equal(state.screen,"setup");assert.equal(h.document.querySelector("[data-setup-player]"),null);assert.equal(h.document.querySelector("#setupAddPlayer"),null);assert.equal(h.document.querySelector('[data-difficulty="easy"]'),null);assert.equal(h.document.querySelector("#startGame").textContent,"CONTINUE");const names=state.players.map(p=>p.name);for(const mode of ["work","solo","original"]){h.click(`[data-setup-mode="${mode}"]`);assert.equal(state.screen,"setup");assert.equal(state.mode,mode);assert.equal(h.document.querySelector(".unified-players"),null)}assert.deepEqual(state.players.map(p=>p.name),names);for(const selector of ['[data-setup-difficulty="hard"]','[data-setup-seconds="20"]','[data-setup-minutes="10"]']){h.click(selector);assert.equal(state.screen,"setup")}assert.equal(state.difficulty,"hard");assert.equal(state.questionSeconds,20);assert.equal(state.duration,10)}finally{h.close()}
});

test("multiplayer Continue opens the dedicated roster page and roster edits remain there",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";h.api.go("setup");h.timers.advance(220);h.click("#startGame");assert.equal(state.screen,"players");const before=state.players.length;h.click("#add");assert.equal(state.screen,"players");assert.equal(state.players.length,before+1);const input=[...h.document.querySelectorAll("[data-p]")].at(-1);input.value="Jordan";input.dispatchEvent(new h.window.Event("input",{bubbles:true}));assert.equal(state.players.at(-1).name,"Jordan")}finally{h.close()}
});

test("roster validation occurs on Who's In and valid Continue reaches Showtime",()=>{
 const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:""}];state.screen="setup";h.api.setup();h.click("#startGame");assert.equal(state.screen,"players");h.timers.advance(220);h.click("#continue");assert.equal(state.screen,"players");assert.match(h.document.getElementById("rosterError").textContent,/two named/i);state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Alex"}];h.api.players();h.click("#continue");assert.equal(state.screen,"players");assert.match(h.document.getElementById("rosterError").textContent,/unique/i);state.players[1].name="Blair";h.api.players();h.click("#continue");assert.equal(state.screen,"ready");assert.match(h.document.querySelector(".compact-ready").textContent,/ORIGINAL.*MEDIUM.*15 SEC.*READ ON/)}finally{h.close()}
});

test("Unified Setup Voice Volume and Read Questions controls use canonical persistence",()=>{
 const h=createHarness();try{const state=h.api.getState();h.api.go("setup");h.timers.advance(220);h.click("#setupVoiceOff");assert.equal(state.screen,"setup");assert.equal(state.voiceOn,false);assert.equal(h.window.localStorage.getItem("los5_voice"),"false");h.click("#setupVoiceOn");assert.equal(state.voiceOn,true);h.click("#readQuestionsOff");assert.equal(state.readQuestions,false);assert.equal(h.window.localStorage.getItem("los5_read_questions"),"false");h.click("#readQuestionsOn");assert.equal(state.readQuestions,true);const volume=h.document.getElementById("vol");volume.value="0.4";volume.dispatchEvent(new h.window.Event("input",{bubbles:true}));assert.equal(state.volume,.4);assert.equal(h.window.localStorage.getItem("los5_volume"),"0.4");assert.equal(state.screen,"setup")}finally{h.close()}
 const restored=createHarness({storage:{los5_read_questions:"false"}});try{assert.equal(restored.api.getState().readQuestions,false)}finally{restored.close()}
});

test("Game Setup voice changes choices and Continue opens the correct next page",()=>{
 const h=createHarness();try{const state=h.api.getState();h.speak("start",{final:false});assert.equal(state.screen,"setup");h.speak("start",{final:true});assert.equal(state.screen,"setup");h.timers.advance(220);h.speak("work edition");assert.equal(state.screen,"setup");assert.equal(state.mode,"work");h.speak("hard");assert.equal(state.difficulty,"hard");h.speak("20 seconds");assert.equal(state.questionSeconds,20);h.speak("5 minutes");assert.equal(state.duration,5);h.speak("read questions off");assert.equal(state.readQuestions,false);h.speak("continue",{final:false});assert.equal(state.screen,"players");h.timers.advance(220);h.speak("continue",{final:true});assert.equal(state.screen,"players","final duplicate must not cross into Showtime")}finally{h.close()}
});

test("detached legacy Continue cannot advance Game Setup and final Back returns Home once",()=>{
 const h=createHarness();try{const state=h.api.getState();state.screen="time";h.api.time();const stale=h.document.getElementById("continue");h.api.go("setup");h.timers.advance(220);stale.click();assert.equal(state.screen,"setup");h.speak("back",{final:false});assert.equal(state.screen,"setup");h.speak("back",{final:true});assert.equal(state.screen,"home");const transition=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().lastTransition;assert.equal(transition.from,"setup");assert.equal(transition.to,"home");assert.equal(transition.reason,"setup-back")}finally{h.close()}
});

test("Who’s In voice player totals create practical editable rosters without a product cap",()=>{
 for(const total of [2,6,13,20,30,120]){const h=createHarness();try{const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.players();h.speak(`${total} players`,{final:true});assert.equal(state.players.length,total);assert.equal(h.document.querySelectorAll("[data-p]").length,total);const last=h.document.querySelectorAll("[data-p]")[total-1];last.value=`Player ${total}`;last.dispatchEvent(new h.window.Event("input",{bubbles:true}));assert.equal(state.players.at(-1).name,`Player ${total}`)}finally{h.close()}}
});

test("player-count commands use total semantics and protect meaningful trailing names",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";h.api.players();h.speak("Add 13 players");assert.equal(state.players.length,13);h.speak("Make it 20 players");assert.equal(state.players.length,20);state.players[19].name="Jordan";h.api.players();h.speak("Set 6 players");assert.equal(state.players.length,20);assert.ok(h.api.getVoiceDiagnostics().some(x=>x.reason==="roster-count-would-remove-names"));state.players.slice(6).forEach(p=>p.name="");h.api.players();h.speak("6 players");assert.equal(state.players.length,6)
}));

test("unfinished Game Setup and Who’s In sessions resume as setup data, never fake games",()=>{
 const setup=createHarness();try{const state=setup.api.getState();state.screen="setup";setup.api.setup();setup.click('[data-setup-mode="work"]');setup.click('[data-setup-difficulty="hard"]');setup.click('[data-setup-seconds="20"]');setup.click('[data-setup-minutes="10"]');setup.click("#readQuestionsOff");setup.api.exitSetup?.();setup.speak("exit game");assert.equal(state.screen,"home");assert.ok(setup.document.querySelector("#resumeSaved"));setup.click("#resumeSaved");assert.equal(state.screen,"setup");assert.equal(state.game,null);assert.equal(state.mode,"work");assert.equal(state.difficulty,"hard");assert.equal(state.questionSeconds,20);assert.equal(state.duration,10);assert.equal(state.readQuestions,false)}finally{setup.close()}
 const roster=createHarness();try{const state=roster.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];state.screen="players";roster.api.players();roster.click("#add");const input=[...roster.document.querySelectorAll("[data-p]")].at(-1);input.value="Casey";input.dispatchEvent(new roster.window.Event("input",{bubbles:true}));roster.click("[data-setup-exit]");assert.equal(state.screen,"home");roster.click("#resumeSaved");assert.equal(state.screen,"players");assert.equal(state.game,null);assert.deepEqual(Array.from(state.players,p=>p.name),["Alex","Blair","Casey"])}finally{roster.close()}
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
 const state=h.api.getState(),messages=()=>h.window.__LOS_PLAYTEST_DIAGNOSTICS__.playerUps().filter(x=>x.phase==="message");state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();let entries=messages();assert.equal(entries.length,1);assert.equal(entries[0].activePlayer,"Alex");h.timers.advance(3450);state.game.current={q:"What planet?",a:"Mars",cat:"Science"};state.game.answered=false;h.api.finish("correct");h.api.advance();entries=messages();assert.equal(entries.length,2);assert.equal(entries[1].activePlayer,"Blair");assert.equal(new Set(entries.map(x=>x.renderGeneration)).size,2)
}));

test("Stage 6.13 Back is final-only and moves exactly one setup screen",()=>{
 for(const [mode,screen,target] of [["original","players","setup"],["original","ready","players"],["solo","ready","setup"]]){const h=createHarness();try{const state=h.api.getState();state.mode=mode;state.screen=screen;h.api[screen]();h.speak("back",{final:false});assert.equal(state.screen,screen);h.speak("back",{final:true});assert.equal(state.screen,target);h.timers.advance(1000);assert.equal(state.screen,target);assert.notEqual(state.screen,"home")}finally{h.close()}}
});

test("fresh preferences never create Resume while explicitly abandoned setup does",()=>{
 const fresh=createHarness({storage:{los5_voice:"false",los5_volume:"0.4",los5_read_questions:"false"}});try{assert.equal(fresh.document.querySelector("#resumeSaved"),null);fresh.click("#start");fresh.timers.advance(220);assert.equal(fresh.api.getState().screen,"setup");assert.equal(fresh.window.localStorage.getItem("los5_setup_state")!==null,true);fresh.api.home();assert.equal(fresh.document.querySelector("#resumeSaved"),null,"ordinary setup rendering is not abandonment");fresh.api.go("setup");fresh.timers.advance(220);fresh.api.back();assert.ok(fresh.document.querySelector("#resumeSaved"),"explicit Back abandons resumable setup")}finally{fresh.close()}
 const stale=createHarness({storage:{los5_setup_state:JSON.stringify({version:1,kind:"setup",screen:"setup",players:[]})}});try{assert.equal(stale.document.querySelector("#resumeSaved"),null,"obsolete setup records are not resumable")}finally{stale.close()}
});

test("one Player-Up composition remains visible while its countdown begins",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.startGame();const message=h.document.getElementById("playerUpMessage");assert.ok(message);assert.equal(message.hidden,false);h.timers.advance(450);assert.equal(message.hidden,false);assert.equal(h.document.getElementById("handoffCount").textContent,"3");h.timers.advance(2000);assert.equal(message.hidden,false);const trace=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.playerUps();assert.equal(trace.filter(x=>x.phase==="message").length,1);assert.equal(trace.filter(x=>x.phase==="countdown").length,1);assert.equal(trace.at(-1).playerUpVisible,true);assert.equal(trace.at(-1).visibleHype,"YOU’RE UP!")
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

test("concept-equivalent answers score through fake recognition after an earlier guess",withHarness(h=>{
 const state=activeTimedQuestion(h);state.game.current={id:"equivalent-voice",q:"What common word means automobile?",a:"car",equivalents:["automobile"]};const remaining=state.game.questionRemaining;h.speak("vehicle",{final:true});assert.equal(state.screen,"question");assert.equal(state.game.questionRemaining,remaining);h.speak("automobile",{final:true});assert.equal(state.screen,"result");assert.equal(state.game.players[0].correct,1);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.answers().at(-1).matchMethod,"concept-equivalent")
}));

test("Read Questions voice commands own one setup action and preserve Voice Volume and navigation",()=>{
 const commands=[["read questions off",false],["turn read questions off",false],["read questions on",true],["turn read questions on",true],["read the questions",true],["don't read the questions",false]];
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

test("player Host style defaults explicitly and persists through setup and Champion replay",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.screen="players";state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Vanessa",hostStyle:"feminine"}];h.api.players();assert.equal(state.players[0].hostStyle,"neutral");const select=h.document.querySelector('[data-host-style="p1"]');assert.equal(select.getAttribute("aria-label"),"Player 1 Host style");select.value="masculine";select.dispatchEvent(new h.window.Event("change",{bubbles:true}));assert.equal(state.players[0].hostStyle,"masculine");const saved=JSON.parse(h.window.localStorage.getItem("los5_setup_state"));assert.equal(saved.players[0].hostStyle,"masculine");h.api.startGame();assert.equal(state.game.players[0].hostStyle,"masculine");h.api.champion(state.game.players[0]);h.api.replayGame();assert.equal(state.players[0].hostStyle,"masculine");assert.equal(state.players[1].hostStyle,"feminine")
}));

test("physical Read Questions controls persist and govern actual question narration",()=>{
 for(const enabled of [false,true]){const pending=[],provider={available:true,calls:[],play(cue){this.calls.push(cue);return new Promise(resolve=>pending.push(resolve))},cancel(){pending.splice(0).forEach(resolve=>resolve())},setVolume(){}},h=createHarness({hostProvider:provider});try{const state=h.api.getState();state.screen="setup";state.voiceOn=true;state.readQuestions=!enabled;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"}];h.api.setup();h.click(enabled?"#readQuestionsOn":"#readQuestionsOff");assert.equal(state.readQuestions,enabled);assert.equal(h.window.localStorage.getItem("los5_read_questions"),String(enabled));assert.equal(h.document.getElementById(enabled?"readQuestionsOn":"readQuestionsOff").getAttribute("aria-pressed"),"true");assert.equal(state.voiceOn,true);h.api.startGame();h.api.question();assert.equal(provider.calls.some(x=>x.event==="questionRead"),enabled);assert.equal(h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().answerTimer,enabled?"stopped":"running")}finally{h.close()}}
});

test("Stage 6.15 production flow preserves every major screen in sequence",withHarness(h=>{
 const state=h.api.getState();state.mode="original";state.voiceOn=false;state.readQuestions=true;state.players=[{id:"p1",name:"Alex"},{id:"p2",name:"Blair"},{id:"p3",name:"Casey"}];state.screen="players";h.api.go("ready","production-playthrough");h.timers.advance(220);assert.equal(state.screen,"ready");h.click("#showtimeStart");assert.equal(state.screen,"handoff");h.timers.advance(3450);assert.equal(state.screen,"transition");h.timers.advance(1000);assert.equal(state.screen,"question");state.game.current={id:"flow-q",q:"What planet is red?",a:"Mars",cat:"Science"};state.game.answered=false;h.api.finish("correct");assert.equal(state.screen,"result");h.timers.advance(3200);assert.equal(state.screen,"handoff");state.game.players[2].eliminated=true;h.api.showdownIntro();assert.equal(state.screen,"showdown");h.timers.advance(3700);assert.equal(state.screen,"handoff");h.api.champion(state.game.players[0]);assert.equal(state.screen,"complete");const screens=h.window.__LOS_PLAYTEST_DIAGNOSTICS__.lifetimes().map(x=>x.screen);for(const expected of ["ready","handoff","transition","question","result","showdown","complete"])assert.ok(screens.includes(expected),expected)
}));

test("Stage 6.19 strike awards are atomic, capped at three, and eliminate immediately",()=>{
 for(const [before,after,eliminated] of [[0,1,false],[1,2,false],[2,3,true]]){const h=createHarness();try{const state=setupQuestion(h);state.game.players[0].strikes=before;h.api.finish("wrong");assert.equal(state.game.players[0].strikes,after);assert.equal(state.game.players[0].eliminated,eliminated);const saved=JSON.parse(h.window.localStorage.getItem("los5_active_game"));assert.equal(saved.game.players[0].strikes,after);assert.equal(saved.game.players[0].eliminated,eliminated)}finally{h.close()}}
 const h=createHarness();try{const state=setupQuestion(h);const player=state.game.players[0];player.strikes=3;player.eliminated=true;h.api.finish("wrong");h.api.finish("timeout");assert.equal(player.strikes,3);assert.equal(player.wrong,0);assert.equal(player.timeout,0)}finally{h.close()}
});

test("eliminated players cannot receive another normal Player-Up turn",withHarness(h=>{
 const state=setupQuestion(h);state.game.players.push({id:"p2",name:"Blair",correct:0,wrong:0,timeout:0,strikes:0,eliminated:false});state.game.startingCount=2;state.game.players[0].strikes=3;state.game.players[0].eliminated=true;state.game.idx=0;h.api.handoff();assert.equal(state.game.idx,1);assert.match(h.document.querySelector(".handoff-player-name").textContent,/Blair/)
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
 {const{h,state}=make();try{assert.equal(h.document.querySelector(".topbar-title").textContent,"IT’S SHOWTIME");h.speak("start",{final:false});assert.equal(state.screen,"ready");h.speak("start",{final:true});assert.equal(state.screen,"handoff")}finally{h.close()}}
 {const{h,state}=make();try{h.speak("go back",{final:false});assert.equal(state.screen,"ready");h.speak("go back",{final:true});assert.equal(state.screen,"players")}finally{h.close()}}
 {const{h,state}=make();try{h.speak("exit",{final:false});assert.equal(state.screen,"ready");h.speak("exit",{final:true});assert.equal(state.screen,"home")}finally{h.close()}}
});

test("Lock In remains visible for a full second without waiting for Host",withHarness(h=>{
 const state=setupQuestion(h);h.api.transition("question",()=>h.api.question(),"lock-in-test");assert.equal(state.screen,"transition");h.timers.advance(999);assert.equal(state.screen,"transition");h.timers.advance(1);assert.equal(state.screen,"question")
}));
