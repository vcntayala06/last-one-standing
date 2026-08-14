"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness");

function withHarness(fn) {
  return async () => {
    const h = createHarness();
    try { await fn(h); } finally { h.close(); }
  };
}

function gameState(h, { players = 2, strikes = 0 } = {}) {
  const state = h.api.getState();
  state.voiceOn = false;
  state.mode = "original";
  state.questionSeconds = 15;
  state.players = Array.from({ length: players }, (_, i) => ({ id: `p${i + 1}`, name: i ? "Blair" : "Alex" }));
  state.game = {
    players: state.players.map(p => ({ ...p, correct: 0, wrong: 0, timeout: 0, strikes, eliminated: false })),
    startingCount: players, idx: 0, qnum: 0, used: [], current: { q: "What planet is red?", a: "Mars", cat: "Science" },
    answered: false, started: Date.now(), speechLog: [], lastSpeechLog: [], showdown: false, lastOutcomeDetail: "",
    questionRemaining: 10, questionStartedWith: 15
  };
  return state;
}

const events = h => h.api.GameAudio.diagnostics.history;
const count = (h, type, name) => events(h).filter(x => x.type === type && x.name === name).length;

test("Lock In plays first, then countdown plays exactly one distinct cue per digit", withHarness(h => {
  gameState(h);
  h.api.handoff();
  assert.equal(count(h, "sfx", "lockIn"), 1);
  h.timers.advance(1600);
  h.timers.advance(450);
  assert.equal(count(h, "sfx", "countdown3"), 1);
  h.timers.advance(1000);
  assert.equal(count(h, "sfx", "countdown2"), 1);
  h.timers.advance(1000);
  assert.equal(count(h, "sfx", "countdown1"), 1);
  h.timers.advance(1000);
  assert.equal(h.api.getState().screen, "question");
}));

test("correct, wrong final, pass, strike, and timeout cues remain semantically distinct", withHarness(h => {
  let state = gameState(h); h.api.finish("correct");
  assert.equal(count(h, "sfx", "correct"), 1); assert.equal(count(h, "sfx", "timeout"), 0);
  state = gameState(h); state.game.lastOutcomeDetail = "pass"; h.api.finish("pass");
  assert.equal(count(h, "sfx", "pass"), 1); assert.equal(count(h, "sfx", "timeout"), 0);
  state = gameState(h); h.api.finish("wrong");
  assert.equal(count(h, "sfx", "wrong"), 1); assert.equal(count(h, "sfx", "strike"), 1);
  state = gameState(h); h.api.finish("timeout");
  assert.equal(count(h, "sfx", "timeout"), 1);
}));

test("ordinary wrong answer attempt does not play final-failure audio", withHarness(h => {
  const state = gameState(h); h.api.question(true);
  const input = h.document.querySelector("#typedAnswer"); input.value = "Venus"; h.click("#lockAnswer");
  assert.equal(state.game.answered, false);
  assert.equal(count(h, "sfx", "wrong"), 0);
  assert.equal(count(h, "sfx", "strike"), 0);
}));

test("timeout cue is idempotent and Pass or Skip never creates a buzzer", withHarness(h => {
  gameState(h); h.api.GameAudio.playSfx("timeout", { eventId: "timeout:q1" }); h.api.GameAudio.playSfx("timeout", { eventId: "timeout:q1" });
  assert.equal(count(h, "sfx", "timeout"), 1);
  const state = gameState(h); state.game.lastOutcomeDetail = "skip"; h.api.finish("pass");
  assert.equal(count(h, "sfx", "timeout"), 1);
}));

test("Pause suppresses timer audio and Resume does not duplicate music", withHarness(h => {
  const state = gameState(h); h.api.question(true); h.api.pauseGame();
  const before = count(h, "sfx", "urgentTick") + count(h, "sfx", "tick");
  h.timers.advance(5000);
  assert.equal(count(h, "sfx", "urgentTick") + count(h, "sfx", "tick"), before);
  h.api.GameAudio.playMusic("showdown", { owner: "test" }); h.api.GameAudio.pause(); h.api.GameAudio.resume(); h.api.GameAudio.resume();
  assert.equal(count(h, "music-start", "showdown"), 1);
  assert.equal(state.game.questionRemaining, 10);
}));

test("Final Showdown and Champion own one music track and cleanup is safe", withHarness(h => {
  const state = gameState(h, { players: 3 }); h.api.showdownIntro();
  assert.equal(h.api.GameAudio.diagnostics.currentMusic, "showdown");
  assert.equal(count(h, "music-start", "showdown"), 1);
  h.api.champion(state.game.players[0]);
  assert.equal(h.api.GameAudio.diagnostics.currentMusic, "champion");
  assert.equal(count(h, "music-start", "champion"), 1);
  h.api.replayGame();
  assert.equal(h.api.GameAudio.diagnostics.currentMusic, null);
  h.api.home();
  assert.equal(h.api.GameAudio.diagnostics.currentMusic, null);
}));

test("master volume, ducking, activation, and playback failure diagnostics are centralized", withHarness(h => {
  h.api.setVolume(.3);
  assert.equal(h.api.GameAudio.diagnostics.masterVolume, .3);
  assert.equal(h.api.GameAudio.activate(), true);
  assert.equal(h.api.GameAudio.diagnostics.activated, true);
  h.api.GameAudio.duck(.35); h.api.GameAudio.restore();
  assert.equal(events(h).filter(x => x.type === "duck").length, 1);
  assert.equal(events(h).filter(x => x.type === "restore").length, 1);
  assert.doesNotThrow(() => h.api.GameAudio.playSfx("missing-cue"));
}));

test("stale-session and duplicate cue requests cannot stack critical playback", withHarness(h => {
  gameState(h);
  assert.equal(h.api.GameAudio.playSfx("correct", { eventId: "answer:one" }), true);
  assert.equal(h.api.GameAudio.playSfx("correct", { eventId: "answer:one" }), false);
  h.api.home();
  assert.equal(h.api.GameAudio.diagnostics.currentMusic, null);
  assert.equal(count(h, "sfx", "correct"), 1);
}));

test("Web Audio playback failure is diagnostic-only and never breaks gameplay flow", withHarness(h => {
  gameState(h);
  h.window.AudioContext.prototype.createOscillator = () => { throw new Error("audio device unavailable"); };
  assert.doesNotThrow(() => h.api.GameAudio.playSfx("correct", { eventId: "failure-test" }));
  assert.match(h.api.GameAudio.diagnostics.lastPlaybackError, /audio device unavailable/);
  assert.doesNotThrow(() => h.api.finish("correct"));
  assert.equal(h.api.getState().screen, "result");
}));

test("Stage 6.22 final five seconds schedule two urgent pressure cues per second then one buzzer", withHarness(h => {
  const state=gameState(h);state.game.questionRemaining=6;h.api.GameAudio.activate();h.api.question(true);h.timers.advance(6000);
  const urgent=Array.from(events(h).filter(x=>x.type==="sfx"&&x.name==="urgentTick"));assert.deepEqual(urgent.map(x=>x.remaining),[5,5,4,4,3,3,2,2,1,1]);assert.deepEqual(urgent.map(x=>x.eventId.split(":").at(-1)),["primary","pressure","primary","pressure","primary","pressure","primary","pressure","primary","pressure"]);assert.equal(new Set(urgent.map(x=>x.eventId)).size,10);assert.ok(urgent.every(x=>x.urgency==="urgent"&&x.activated===true&&x.paused===false&&x.sfxGain>.5));assert.equal(count(h,"sfx","timeout"),1);assert.equal(state.screen,"result")
}));

test("urgent tick dedupe rejects only the same second and records the reason", withHarness(h => {
  gameState(h);h.api.GameAudio.activate();assert.equal(h.api.GameAudio.playSfx("urgentTick",{eventId:"urgent:q:5",remaining:5,urgency:"urgent"}),true);assert.equal(h.api.GameAudio.playSfx("urgentTick",{eventId:"urgent:q:5",remaining:5,urgency:"urgent"}),false);assert.equal(h.api.GameAudio.playSfx("urgentTick",{eventId:"urgent:q:4",remaining:4,urgency:"urgent"}),true);assert.equal(count(h,"sfx","urgentTick"),2);assert.ok(events(h).some(x=>x.type==="sfx-rejected"&&x.result==="duplicate"&&x.remaining===5))
}));

test("game audio playback never suppresses or restarts healthy recognition", withHarness(h => {
  const recognizer=h.recognition(),snapshot=()=>h.window.__LOS_PLAYTEST_DIAGNOSTICS__.snapshot().recognition;
  h.api.GameAudio.activate();
  h.api.GameAudio.playSfx("urgentTick",{eventId:"urgent:voice:5",remaining:5,urgency:"urgent"});
  h.api.GameAudio.playMusic("showdown",{owner:"voice-coexistence"});
  assert.equal(h.recognition(),recognizer);
  assert.equal(snapshot().state,"listening");
  assert.equal(snapshot().suppressionReason,"");
}));
