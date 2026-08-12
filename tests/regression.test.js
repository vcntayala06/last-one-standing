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
  assert.equal(h.api.getState().screen, "mode");
}));

test("protected answer matcher accepts exact, contained, fuzzy, and phonetic answers", withHarness(h => {
  const q = { a: "Sacramento" };
  assert.equal(h.api.accepted("Sacramento", q), true);
  assert.equal(h.api.accepted("the answer is Sacramento", q), true);
  assert.equal(h.api.accepted("Sacramnto", q), true);
  assert.equal(h.api.accepted("Sakramento", q), true);
  assert.equal(h.api.accepted("Los Angeles", q), false);
}));

test("protected question routing waits for final or sufficiently confident interim answers", withHarness(h => {
  const state = setupQuestion(h);
  assert.equal(h.api.centralQuestionIntent("Mars", false, 0.5), true, "exact canonical answers are strong enough on interim speech");
  assert.equal(state.game.answered, true);
  assert.equal(state.game.players[0].correct, 1);
}));

test("protected question routing records a short final non-answer as wrong", withHarness(h => {
  const state = setupQuestion(h);
  h.api.centralQuestionIntent("Venus", true, 1);
  assert.equal(state.game.players[0].wrong, 1);
  assert.equal(state.game.players[0].strikes, 1);
  assert.equal(state.game.answered, true);
}));

test("Pass and Skip each produce one strike and distinct result detail", withHarness(h => {
  let state = setupQuestion(h);
  h.api.centralQuestionIntent("pass", false, 1);
  assert.equal(state.game.players[0].strikes, 1);
  assert.equal(state.game.lastOutcomeDetail, "pass");

  state = setupQuestion(h);
  h.api.centralQuestionIntent("skip", false, 1);
  assert.equal(state.game.players[0].strikes, 1);
  assert.equal(state.game.lastOutcomeDetail, "skip");
}));

test("finish is idempotent when duplicate recognition results arrive", withHarness(h => {
  const state = setupQuestion(h);
  h.api.finish("correct");
  h.api.finish("correct");
  assert.equal(state.game.players[0].correct, 1);
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

test("player Continue touch and voice both advance a valid roster to Game Settings", withHarness(h => {
  const state = h.api.getState();
  state.screen = "players";
  state.mode = "friends";
  state.players = [{ id: "p1", name: "Alex" }, { id: "p2", name: "Blair" }];
  h.api.players();
  h.click("#continue");
  assert.equal(state.screen, "time");

  h.timers.advance(220);
  state.screen = "players";
  h.api.players();
  h.speak("continue", { final: false });
  assert.equal(state.screen, "time");
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
