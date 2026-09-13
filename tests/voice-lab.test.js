"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {QUESTIONS,evaluate,createAttempt,createAttemptClock,formatLatency,friendlyRecognitionError}=require("../voice-lab.js");

test("Voice Lab accepts every specified safe answer",()=>{
 const cases=[[0,"Pacific"],[1,"Graham Bell"],[1,"Bell"],[2,"Stanley Cup"],[2,"Stanley"],[3,"Ramp"],[3,"Wheelchair ramp"],[3,"Lift"],[4,"Natural selection"]];
 for(const [index,heard] of cases)assert.equal(evaluate(heard,QUESTIONS[index],{isFinal:true}).accepted,true,heard);
});

test("Voice Lab rejects common-word and related-but-wrong answers",()=>{
 const cases=[[0,"ocean"],[0,"Atlantic Ocean"],[1,"Alexander Hamilton"],[1,"telephone"],[2,"cup"],[2,"World Cup"],[3,"wheelchair"],[3,"stairs"],[4,"evolution"],[4,"artificial selection"]];
 for(const [index,heard] of cases)assert.equal(evaluate(heard,QUESTIONS[index],{isFinal:true}).accepted,false,heard);
});

test("a safe interim accepts immediately and its final cannot score twice",()=>{
 let scored=0;const attempt=createAttempt(()=>scored++),question=QUESTIONS[0];
 const interim=attempt.process("Pacific",{question,isFinal:false,confidence:.5});
 const final=attempt.process("Pacific Ocean",{question,isFinal:true,confidence:.95});
 assert.equal(interim.newAcceptance,true);assert.equal(final.newAcceptance,false);assert.equal(final.alreadyAccepted,true);assert.equal(scored,1);
});

test("a minor uncertain error needs supporting evidence before early acceptance",()=>{
 let scored=0;const attempt=createAttempt(()=>scored++),question=QUESTIONS[2];
 assert.equal(attempt.process("Stanly",{question,isFinal:false,confidence:.4}).accepted,false);
 assert.equal(attempt.process("Stanly",{question,isFinal:false,confidence:.4}).newAcceptance,true);
 assert.equal(scored,1);
});

test("reset rejects a speech event from before the current attempt",()=>{
 let now=100;const clock=createAttemptClock(()=>now);const first=clock.current().attemptId;
 now=200;clock.reset();assert.equal(clock.current().attemptId,first+1);
 assert.equal(clock.recordSpeechActivity("browser speechstart",150),false);
 clock.recordTranscript(false,240);clock.recordAccepted(260);
 assert.deepEqual(clock.metrics(),{speechToFirstMs:null,speechToCorrectMs:null,firstToCorrectMs:20});
 assert.equal(formatLatency(clock.metrics().speechToCorrectMs),"Unavailable");
});

test("current-attempt timing never shares acceptance or timestamps",()=>{
 let now=10;const clock=createAttemptClock(()=>now);
 clock.recordSpeechActivity("browser speechstart",20);clock.recordTranscript(false,30);clock.recordAccepted(40);
 assert.deepEqual(clock.metrics(),{speechToFirstMs:10,speechToCorrectMs:20,firstToCorrectMs:10});
 now=100;clock.reset();const state=clock.current();
 assert.equal(state.firstSpeechActivityAt,null);assert.equal(state.firstTranscriptAt,null);assert.equal(state.acceptedAt,null);assert.equal(state.finalTranscriptAt,null);
 clock.recordTranscript(false,120);clock.recordAccepted(145);
 assert.deepEqual(clock.metrics(),{speechToFirstMs:null,speechToCorrectMs:null,firstToCorrectMs:25});
});

test("question-scoped lyft transcription accepts early and identifies Lift",()=>{
 const wheelchair=evaluate("lyft",QUESTIONS[3],{isFinal:false,confidence:.1});
 assert.equal(wheelchair.accepted,true);assert.equal(wheelchair.method,"controlled-transcription");assert.equal(wheelchair.matchedAnswer,"Lift");assert.match(wheelchair.reason,/“Lift”/);
 assert.equal(evaluate("lyft",QUESTIONS[0],{isFinal:true}).accepted,false);
 assert.equal(evaluate("ramp",QUESTIONS[3],{isFinal:false}).matchedAnswer,"Ramp");
 assert.equal(evaluate("lift",QUESTIONS[3],{isFinal:false}).matchedAnswer,"Lift");
});

test("consecutive attempts each accept once with their own explanation",()=>{
 const reasons=[];let first=createAttempt(result=>reasons.push(result.reason));
 assert.equal(first.process("lyft",{question:QUESTIONS[3],isFinal:false}).newAcceptance,true);
 assert.equal(first.process("lift",{question:QUESTIONS[3],isFinal:true}).newAcceptance,false);
 first=createAttempt(result=>reasons.push(result.reason));
 assert.equal(first.process("ramp",{question:QUESTIONS[3],isFinal:false}).newAcceptance,true);
 assert.equal(first.process("ramp",{question:QUESTIONS[3],isFinal:true}).newAcceptance,false);
 assert.match(reasons[0],/“Lift”/);assert.match(reasons[1],/“Ramp”/);assert.equal(reasons.length,2);
});

test("iPhone-facing diagnostics explain permission and browser failures",()=>{
 assert.match(friendlyRecognitionError("not-allowed"),/permission was denied/i);
 assert.match(friendlyRecognitionError("audio-capture"),/microphone/i);
 assert.match(friendlyRecognitionError("network"),/internet connection/i);
 assert.equal(friendlyRecognitionError(""),"None");
});
