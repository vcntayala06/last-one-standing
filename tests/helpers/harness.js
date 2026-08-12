"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

class FakeTimers {
  constructor() {
    this.now = 0;
    this.nextId = 1;
    this.jobs = new Map();
  }

  setTimeout(fn, delay = 0) { return this.add(fn, delay, 0); }
  setInterval(fn, delay = 0) { return this.add(fn, delay, Math.max(1, Number(delay) || 1)); }
  clear(id) { this.jobs.delete(id); }

  add(fn, delay, interval) {
    const id = this.nextId++;
    this.jobs.set(id, { fn, at: this.now + Math.max(0, Number(delay) || 0), interval });
    return id;
  }

  advance(ms) {
    const target = this.now + ms;
    let guard = 0;
    while (guard++ < 10000) {
      let selected = null;
      for (const [id, job] of this.jobs) {
        if (job.at <= target && (!selected || job.at < selected.job.at || (job.at === selected.job.at && id < selected.id))) {
          selected = { id, job };
        }
      }
      if (!selected) break;
      this.now = selected.job.at;
      if (selected.job.interval) selected.job.at += selected.job.interval;
      else this.jobs.delete(selected.id);
      selected.job.fn();
    }
    if (guard >= 10000) throw new Error("Fake timer runaway");
    this.now = target;
  }
}

class FakeSpeechRecognition {
  static instances = [];
  static startFailures = 0;

  constructor() {
    this.lang = "";
    this.interimResults = false;
    this.continuous = false;
    this.maxAlternatives = 1;
    this.started = false;
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    if (FakeSpeechRecognition.startFailures > 0) {
      FakeSpeechRecognition.startFailures--;
      throw new Error("simulated recognition start failure");
    }
    this.started = true;
    this.onstart?.();
  }
  abort() { this.started = false; }

  emit(transcript, { final = true, confidence = 1, alternatives = [] } = {}) {
    const result = [{ transcript, confidence }, ...alternatives.map(x => typeof x === "string" ? { transcript: x, confidence } : x)];
    result.isFinal = final;
    const results = [result];
    this.onresult?.({ resultIndex: 0, results });
  }

  end() { this.started = false; this.onend?.(); }
  error(error) { this.onerror?.({ error }); }
}

class FakeAudioParam {
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeAudioNode {
  constructor() { this.frequency = new FakeAudioParam(); this.gain = new FakeAudioParam(); this.type = ""; }
  connect() { return this; }
  start() {}
  stop() {}
}

class FakeAudioContext {
  constructor() { this.currentTime = 0; this.state = "running"; this.destination = {}; }
  createOscillator() { return new FakeAudioNode(); }
  createGain() { return new FakeAudioNode(); }
  resume() { this.state = "running"; }
}

function instrument(source) {
  const marker = "})();";
  const at = source.lastIndexOf(marker);
  if (at < 0) throw new Error("Unable to instrument app.js");
  const exposure = `\nObject.assign(globalThis.__LOS_TEST__, {\n` +
    ` getState:()=>state, setState:patch=>Object.assign(state,patch), getRecognition:()=>recognition,\n` +
    ` routeVoiceCentral, centralQuestionIntent, accepted, question, finish, startGame,\n` +
    ` players, playersContinue, fun, time, pauseGame, resumeGame, confirmEnd, leaveGame,\n` +
    ` setVolume, go, back, home, mode, industry, difficulty, ready, handoff, result,\n` +
    ` startVoice, stopVoice, saveActiveGame, loadActiveGame, resumeSavedGame, clearActiveGame,\n` +
    ` EXTRA_CATEGORIES, QUESTIONS\n` +
    `});\n`;
  return source.slice(0, at) + exposure + source.slice(at);
}

function createHarness({ storage = {} } = {}) {
  FakeSpeechRecognition.instances.length = 0;
  FakeSpeechRecognition.startFailures = 0;
  const timers = new FakeTimers();
  const dom = new JSDOM("<!doctype html><html><body><main id=\"app\"></main></body></html>", {
    url: "https://example.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);

  window.SpeechRecognition = FakeSpeechRecognition;
  window.webkitSpeechRecognition = FakeSpeechRecognition;
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
  window.setTimeout = timers.setTimeout.bind(timers);
  window.clearTimeout = timers.clear.bind(timers);
  window.setInterval = timers.setInterval.bind(timers);
  window.clearInterval = timers.clear.bind(timers);
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return { width: 100, height: 40, top: 0, left: 0, right: 100, bottom: 40 };
  };
  window.__LOS_TEST__ = {};

  const appPath = path.resolve(__dirname, "..", "..", "app.js");
  const source = instrument(fs.readFileSync(appPath, "utf8"));
  vm.runInContext(source, dom.getInternalVMContext(), { filename: appPath });

  const api = window.__LOS_TEST__;
  return {
    window,
    document: window.document,
    api,
    timers,
    recognition: () => api.getRecognition(),
    speak(text, options) {
      const recognition = api.getRecognition();
      if (!recognition) throw new Error("Speech recognition is not active");
      recognition.emit(text, options);
    },
    click(selector) {
      const element = window.document.querySelector(selector);
      if (!element) throw new Error(`Missing element: ${selector}`);
      element.click();
    },
    close() { dom.window.close(); }
  };
}

module.exports = { createHarness, FakeSpeechRecognition, FakeTimers };
