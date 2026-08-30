"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {createHarness}=require("./helpers/harness");

function question(h){const state=h.api.getState();state.screen="question";state.voiceOn=true;state.questionSeconds=10;state.game={players:[{id:"p1",name:"Alex",correct:0,wrong:0,timeout:0,strikes:0,eliminated:false}],startingCount:1,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:""};h.api.question();state.game.current={id:"focused",q:"What planet is red?",a:"Mars"};return state}

test("onend temporary errors and recovery preserve Mic preference ON",()=>{const h=createHarness();try{const state=h.api.getState();assert.equal(state.voiceOn,true);let r=h.recognition();r.error("no-speech");r.end();assert.equal(state.voiceOn,true);h.timers.advance(25);r=h.recognition();assert.ok(r);assert.equal(state.voiceOn,true);r.error("network");r.end();h.timers.advance(100);assert.equal(state.voiceOn,true);assert.ok(h.recognition())}finally{h.close()}});

test("Mic OFF stays OFF and explicit OFF to ON stays ON",()=>{const h=createHarness();try{h.click("#start");const state=h.api.getState();h.api.setState({voiceOn:false});h.api.stopVoice("focused-off");h.api.startVoice("players");assert.equal(state.voiceOn,false);h.click("[data-mic-toggle]");assert.equal(state.voiceOn,true);assert.ok(h.recognition())}finally{h.close()}});

for(const phrase of ["skip","Skip!","skip it","skip this","pass","Pass!","I pass","I'll pass","pass it"]){test(`voice command ${phrase} passes immediately during presentation`,()=>{const h=createHarness();try{const state=question(h);h.speak(phrase,{final:false,confidence:.95});assert.equal(state.screen,"result");assert.equal(state.game.players[0].strikes,1);assert.match(state.game.lastOutcomeDetail,/^(skip|pass)$/)}finally{h.close()}})}

for(const phrase of ["skip","SKIP","pass","Pass!"]){test(`typed command ${phrase} uses the shared pass action`,()=>{const h=createHarness();try{const state=question(h);const input=h.document.querySelector("#typedAnswer");input.value=phrase;input.dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));assert.equal(state.screen,"result");assert.equal(state.game.players[0].strikes,1);assert.match(state.game.lastOutcomeDetail,/^(skip|pass)$/)}finally{h.close()}})}

test("commands are exact, normal answers still route normally, and duplicate callbacks are harmless",()=>{const h=createHarness();try{let state=question(h),r=h.recognition();const input=h.document.querySelector("#typedAnswer");input.value="compass";h.click("#lockAnswer");assert.equal(state.screen,"question");input.value="Mars";h.click("#lockAnswer");assert.equal(state.game.players[0].correct,1);state=question(h);r=h.recognition();r.emit("skip",{final:false});r.emit("skip",{final:true});assert.equal(state.game.players[0].strikes,1)}finally{h.close()}});
