
(()=>{
"use strict";
const BUILD="Clean Foundation 6.0.8 Stabilization Pass";
const app=document.getElementById("app");
const STORAGE={names:"los5_names",voice:"los5_voice",volume:"los5_volume",readQuestions:"los5_read_questions",activeGame:"los5_active_game",setup:"los5_setup_state"};
const DIFFICULTIES=[
 {id:"kids",label:"KIDS"},
 {id:"easy",label:"EASY"},
 {id:"medium",label:"MEDIUM"},
 {id:"hard",label:"HARD"},
 {id:"savage",label:"SAVAGE"}
];
const WORK_INDUSTRIES=[
 "General Workplace","Healthcare","Education","Construction","Hospitality",
 "Retail","Finance","Technology","Manufacturing","Automotive",
 "Government / Public Safety","Other"
];
const EXTRA_CATEGORIES=[
 "Music","Movies & TV","Sports","Food & Drink","History",
 "Science & Nature","Geography","Pop Culture","90s & 2000s","Transportation","Word Play"
];
if(!window.LOS_QUESTION_BANK_DATA||!window.LOS_QUESTION_BANK_BATCH_1||!window.LOS_QUESTION_BANK_BATCH_2||!window.LOS_QUESTION_BANK_BATCH_3||!window.LOSQuestionBank)throw new Error("Question bank failed to load");
const QUESTION_BANK_SOURCE={...window.LOS_QUESTION_BANK_DATA,bankVersion:"stage-6.9-batch-3",questions:[...window.LOS_QUESTION_BANK_DATA.questions,...window.LOS_QUESTION_BANK_BATCH_1.questions,...window.LOS_QUESTION_BANK_BATCH_2.questions,...window.LOS_QUESTION_BANK_BATCH_3.questions]};
const QUESTION_BANK=window.LOSQuestionBank.createQuestionBank(QUESTION_BANK_SOURCE);
const QUESTIONS=QUESTION_BANK.questions.map(QUESTION_BANK.toGameplay);
let state={
 screen:"home",mode:"original",players:[],selectedIds:[],duration:15,questionSeconds:15,
 quick:false,voiceOn:localStorage.getItem(STORAGE.voice)!=="false",readQuestions:localStorage.getItem(STORAGE.readQuestions)!=="false",
 volume:Number(localStorage.getItem(STORAGE.volume)||.65),categories:[],industry:"",difficulty:"medium",answerLanguage:"en",game:null
};
const HOST_LINE_TUNING={
 showtime:[
  {text:"Welcome to Last One Standing! {players}. You get {seconds} seconds, three strikes, and no help from the people making faces behind you. Aight... let's get it crackin'.",workSafe:true,cultural:true},
  {text:"This is Last One Standing! {players}. Beat the {seconds}-second clock, stay under three strikes, and take the title. Somebody came ready. We are about to find out who.",workSafe:true},
  {text:"Welcome, everybody! {players}. {seconds} seconds to answer, three strikes and you are out. Keep it moving, and may the loudest confidence come with actual knowledge.",workSafe:true},
  {text:"Last One Standing starts now! {players}. {seconds} seconds, three strikes, one champion. Ay... no looking at the smart person in the room.",workSafe:true,cultural:true},
  {text:"Welcome to the game! {players}. Correct answers keep you alive. Three strikes send you home. Simple rules... until that clock starts moving.",workSafe:true},
  {text:"We got {players} in the house. {seconds} seconds per question, three strikes, one title. Orale, let's see who really came to play.",workSafe:false,cultural:true},
  {text:"Tonight, somebody gets the title and somebody blames the questions. {players}, you have {seconds} seconds and three strikes. Let's go.",workSafe:true},
  {text:"Welcome to Last One Standing! {players}. Think fast and survive three strikes. Aight, enough talking. Time to play.",workSafe:true,cultural:true},
  {text:"The room is set, the clock is ready, and {players} are officially out of excuses. {seconds} seconds. Three strikes. One champion.",workSafe:true},
  {text:"Last One Standing! {players}. You get {seconds} seconds to lock it in. Three mistakes and that chair gets real comfortable. Let's see what happens.",workSafe:true}
 ],
 firstTurn:[
  {text:"Alright, {name}, you are first. Let's see what you got.",workSafe:true},{text:"{name}, you drew the short straw. You are up first.",workSafe:true},
  {text:"We are starting with {name}. Come on, compa.",workSafe:false,cultural:true},{text:"First one on the floor is {name}. Set the tone.",workSafe:true},
  {text:"{name}, everybody is comfortable because you have to go first. Lock in.",workSafe:true},{text:"Aight, {name}. Lead us off.",workSafe:true,cultural:true},
  {text:"{name}, no pressure. Just the entire room watching the first answer.",workSafe:true},{text:"Okay {name}, first question belongs to you.",workSafe:true},
  {text:"Let's start clean. {name}, you are up.",workSafe:true},{text:"Orale, {name}. First at bat. Show us something.",workSafe:false,cultural:true}
 ],
 turn:[{text:"Alright {name}, you're up.",workSafe:true},{text:"{name}, let's see what you got.",workSafe:true},{text:"Okay {name}, your turn.",workSafe:true},{text:"Aight {name}, you're up.",workSafe:true,cultural:true},{text:"{name}, step up and lock in.",workSafe:true}],
 soloTurn:[{text:"Next one. Stay locked in.",workSafe:true},{text:"Aight, keep it moving.",workSafe:true,cultural:true},{text:"Here comes the next one.",workSafe:true}],
 lockIn:[{text:"Lock in. Let's go.",workSafe:true},{text:"Aight, lock in.",workSafe:true,cultural:true},{text:"Lock in, compa.",workSafe:false,cultural:true},{text:"Here we go. Lock in.",workSafe:true},{text:"Lock in. Focus up.",workSafe:true}],
 questionRead:[{text:"{question}",workSafe:true}],
 answerReveal:[{text:"The answer was {answer}.",workSafe:true},{text:"Time. The answer was {answer}.",workSafe:true}],
 correct:[
  {text:"There you go.",workSafe:true},{text:"Okay, I see you.",workSafe:true,cultural:true},{text:"That is right.",workSafe:true},{text:"Clean answer.",workSafe:true},
  {text:"Put that point on the board.",workSafe:true},{text:"Okayyy, look at you knowing stuff.",workSafe:true},{text:"No hesitation. I respect it.",workSafe:true},
  {text:"That one belongs to {name}.",workSafe:true},{text:"Aight, that was solid.",workSafe:true,cultural:true},{text:"You handled that.",workSafe:true},
  {text:"Correct. Keep that energy.",workSafe:true},{text:"That was smooth.",workSafe:true},{text:"I cannot even argue with that.",workSafe:true},
  {text:"Point secured.",workSafe:true},{text:"You came ready for that one.",workSafe:true},{text:"That answer was all business.",workSafe:true},
  {text:"Yes sir. That is the one.",workSafe:false,cultural:true},{text:"Damn, that was good.",workSafe:false,cultural:true},{text:"Give {name} the point before the celebration starts.",workSafe:true},
  {text:"Correct. The room got real quiet on that one.",workSafe:true}
 ],
 fastCorrect:[
  {text:"Okay, quick draw!",workSafe:true},{text:"You knew that immediately.",workSafe:true},{text:"You did not even let the clock get comfortable.",workSafe:true},
  {text:"That answer was already waiting.",workSafe:true},{text:"Ay, that was clean.",workSafe:true,cultural:true},{text:"No thinking face. Just the answer.",workSafe:true},
  {text:"Man, are you even letting me finish?",workSafe:true},{text:"That was fast enough to make everybody nervous.",workSafe:true},
  {text:"Damn, that was quick.",workSafe:false,cultural:true},{text:"Okay {name}, quick with it.",workSafe:true}
 ],
 slowCorrect:[
  {text:"You barely made it.",workSafe:true},{text:"That clock was coming for you.",workSafe:true},{text:"You took every second I gave you.",workSafe:true},
  {text:"Right answer, dramatic timing.",workSafe:true},{text:"You almost gave that one away.",workSafe:true},{text:"The clock had your bags packed.",workSafe:true},
  {text:"That answer crossed the line by a shoelace.",workSafe:true},{text:"Compa, you made me nervous.",workSafe:false,cultural:true},
  {text:"Correct... with absolutely no time to spare.",workSafe:true},{text:"You waited until the last possible moment, huh?",workSafe:true}
 ],
 wrong:[
  {text:"Nahhh. Not this time.",workSafe:true},{text:"That one got you.",workSafe:true},{text:"Ooooh, that hurt.",workSafe:true},{text:"You almost had it.",workSafe:true},
  {text:"You said that with confidence too. That is the crazy part.",workSafe:false},{text:"Do not look at everybody else now. That was your answer.",workSafe:false},
  {text:"Come on now. We have to leave that one on the board.",workSafe:true},{text:"Not quite, {name}. Shake it off.",workSafe:true},
  {text:"That answer took a wrong turn.",workSafe:true},{text:"The confidence was strong. The answer... not so much.",workSafe:true},
  {text:"Ay, I was rooting for you.",workSafe:true,cultural:true},{text:"That question just collected a point from you.",workSafe:true},
  {text:"Nope. We are going to keep moving like that never happened.",workSafe:true},{text:"The room knew it. The room just did not help you.",workSafe:true},
  {text:"That sounded good right up until it was wrong.",workSafe:true},{text:"Not the one, homie.",workSafe:false,cultural:true},
  {text:"That miss had commitment. I will give you that.",workSafe:true},{text:"Wrong answer. Excellent delivery.",workSafe:true},
  {text:"That one slipped away.",workSafe:true},{text:"No point, but plenty of confidence.",workSafe:true}
 ],
 easyMiss:[
  {text:"Come on, you know that one.",workSafe:true},{text:"I am going to pretend I did not hear that.",workSafe:true},{text:"That one is going to bother you later.",workSafe:true},
  {text:"You are thinking too hard.",workSafe:true},{text:"That was hiding in plain sight.",workSafe:true},{text:"Ay... come on now.",workSafe:true,cultural:true},
  {text:"You had that one in school. I know you did.",workSafe:true},{text:"The answer was practically waving at you.",workSafe:true},
  {text:"Compa, I was rooting for you.",workSafe:false,cultural:true},{text:"That question looked easy until it met you.",workSafe:false}
 ],
 streak:[
  {text:"Somebody came to play.",workSafe:true},{text:"Okay, now you are cooking.",workSafe:true},{text:"We might have a problem here.",workSafe:true},
  {text:"{name} is starting to make this look personal.",workSafe:true},{text:"Aight, somebody slow {name} down.",workSafe:true,cultural:true},
  {text:"That is a real run now.",workSafe:true},{text:"The hot seat is not looking very hot right now.",workSafe:true},
  {text:"Back to back to back. I see you.",workSafe:true,cultural:true},{text:"Everybody else might want to wake up.",workSafe:true},{text:"{name} came ready tonight.",workSafe:true}
 ],
 misses:[{text:"Shake it off. The next one is yours.",workSafe:true},{text:"That question run is fighting back.",workSafe:true},{text:"Yeah... this category might not be your friend tonight.",workSafe:true},{text:"Two in a row. Time to change the conversation.",workSafe:true},{text:"Come on {name}, wake it up.",workSafe:true}],
 lead:[{text:"We got a new leader.",workSafe:true},{text:"Okay, somebody just took the top spot.",workSafe:true},{text:"{name} moved to the front. Everybody noticed.",workSafe:true}],
 tie:[{text:"Now we got a game.",workSafe:true},{text:"Okayyy... this just got interesting.",workSafe:true},{text:"All tied up. Nobody gets comfortable.",workSafe:true}],
 comeback:[{text:"Hold up... comeback season?",workSafe:true},{text:"Do not call it over yet.",workSafe:true},{text:"Look who decided to wake up.",workSafe:true},{text:"Aight, {name} is back in the room.",workSafe:true,cultural:true}],
 tough:[{text:"That one was nasty.",workSafe:true},{text:"That was tougher than it looked.",workSafe:true},{text:"That was a real question. Respect.",workSafe:true},{text:"Savage question, clean answer.",workSafe:true},{text:"I have to give you that one.",workSafe:true}],
 showdown:[
  {text:"Aight... this is it. Final Showdown.",workSafe:true,cultural:true},{text:"Final Showdown. No more excuses.",workSafe:true},{text:"Everything comes down to this.",workSafe:true},
  {text:"This right here decides it.",workSafe:true},{text:"Two players left. One title. Settle it.",workSafe:true},{text:"Final Showdown. The room just got serious.",workSafe:true},
  {text:"No more warm-up questions. This is the finish.",workSafe:true},{text:"One of you is leaving with the title.",workSafe:true},
  {text:"Orale... final two. Let's see who holds up.",workSafe:false,cultural:true},{text:"Last round energy. Make it count.",workSafe:true}
 ],
 categoryRun:[{text:"{name} keeps handling this category. Somebody take notes.",workSafe:true},{text:"Yeah... this category belongs to {name} tonight.",workSafe:true},{text:"Aight, {name} found the lane and stayed in it.",workSafe:true,cultural:true}],
 culturalCorrect:[{text:"Orale, that was clean.",workSafe:true,cultural:true},{text:"Aight, I see you know this one.",workSafe:true,cultural:true},{text:"Okay, that answer came with some soul.",workSafe:true,cultural:true},{text:"Compa came ready for that category.",workSafe:false,cultural:true}],
 champion:[
  {text:"And that is your Last One Standing! {name} takes it!",workSafe:true},{text:"Make some noise for {name}, today's champion!",workSafe:true},
  {text:"That is it. {name} gets the title. Everybody else, go study.",workSafe:true},{text:"{name} came, played, and handled business.",workSafe:true},
  {text:"Your champion is {name}! That was clean.",workSafe:true,cultural:true},{text:"Aight, give it up for {name}. Last One Standing.",workSafe:true,cultural:true},
  {text:"The game is over and {name} is still standing.",workSafe:true},{text:"{name} owns the room tonight.",workSafe:true},
  {text:"Orale, {name}! That title is yours.",workSafe:false,cultural:true},{text:"Everybody else gave it a shot. {name} gave it answers.",workSafe:true}
 ]
};
let hostSystem=null;
let recognition=null,questionTimer=null,flowTimer=null,pausedRemaining=null,pausedFrom=null,pausedResultDelay=null,resultDelayRemaining=null,renamePending=null,lastVolume=state.volume>0?state.volume:.65,questionSoundTimers=[],celebrationTimers=[],handoffTimers=[];
let runtimeSessionId=0,renderGeneration=0,setupRenderId=0,pendingTransitionCause={trigger:"internal",reason:"runtime"},questionReading=false,questionSessionId=0,answerListening=false,playerUpRenderGeneration=0;
const BUILD_INFO={stage:"6.18",version:"game-audio",builtAt:"2026-08-14"},transitionDiagnostics=[],screenLifetimeDiagnostics=[],answerDiagnostics=[],playerUpDiagnostics=[],audioDiagnostics={tick:"off",buzzerFired:false},transitionDebugEnabled=new URLSearchParams(location.search).get("playtestDebug")==="1"||localStorage.getItem("los_playtest_debug")==="1";
function enterScreen(next,reason="render",trigger=pendingTransitionCause.trigger||"internal"){
 const from=state.screen,sourceSession=runtimeSessionId,validScreens=new Set(["home","setup","mode","industry","difficulty","fun","players","time","ready","handoff","transition","question","result","showdown","complete","paused"]),valid=validScreens.has(next);
 if(!valid){const rejected={accepted:false,from,to:next,reason,trigger,command:trigger==="voice"?pendingTransitionCause.reason:null,callback:trigger==="internal-game-event"?reason:null,at:Date.now(),sourceSession,session:runtimeSessionId,renderGeneration};transitionDiagnostics.push(rejected);return runtimeSessionId}
 const now=Date.now(),previous=screenLifetimeDiagnostics.at(-1);if(previous&&!previous.leftAt){previous.leftAt=now;previous.visibleDurationMs=now-previous.enteredAt;previous.transitionReason=reason;previous.transitionSource=trigger}
 runtimeSessionId++;renderGeneration++;state.screen=next;
 const item={accepted:true,from,to:next,reason,trigger,source:trigger,command:trigger==="voice"?pendingTransitionCause.reason:null,voiceTranscript:trigger==="voice"?pendingTransitionCause.reason:null,callback:trigger==="internal-game-event"?reason:null,hostEvent:null,timerId:null,at:now,sourceSession,session:runtimeSessionId,renderGeneration,sourceStillOwnsCurrentScreen:true};transitionDiagnostics.push(item);if(transitionDiagnostics.length>150)transitionDiagnostics.shift();screenLifetimeDiagnostics.push({screen:next,enteredAt:now,firstRenderedAt:now,leftAt:null,visibleDurationMs:null,runtimeSession:runtimeSessionId,renderGeneration,entryReason:reason,entrySource:trigger});if(screenLifetimeDiagnostics.length>150)screenLifetimeDiagnostics.shift();if(transitionDebugEnabled)console.debug("[LOS transition]",item);
 pendingTransitionCause={trigger:"internal",reason:"runtime"};return runtimeSessionId
}
function transitionOwner(screen,session,to,source,meta={}){
 const accepted=state.screen===screen&&runtimeSessionId===session;if(accepted)return true;
 const item={accepted:false,from:state.screen,to,reason:meta.reason||"stale-transition-request",trigger:source,source,callback:meta.callback||null,hostEvent:meta.hostEvent||null,voiceTranscript:meta.voiceTranscript||null,timerId:meta.timerId||null,at:Date.now(),sourceSession:session,session:runtimeSessionId,renderGeneration,sourceStillOwnsCurrentScreen:false,rejectionReason:state.screen!==screen?"source-screen-no-longer-current":"source-session-no-longer-current"};transitionDiagnostics.push(item);if(transitionDiagnostics.length>150)transitionDiagnostics.shift();if(transitionDebugEnabled)console.debug("[LOS transition rejected]",item);return false
}
function playtestSnapshot(){const g=state.game,p=g?.players?.[g.idx];return{build:BUILD_INFO,screen:state.screen,lastTransition:transitionDiagnostics.at(-1)||null,lastScreenLifetime:screenLifetimeDiagnostics.at(-1)||null,activePlayer:p?.name||null,hostEvent:hostSystem?.history.at(-1)||null,hostPlayback:globalThis.__LOS_HOST_AUDIO_DIAGNOSTICS__?.history?.at(-1)||null,readQuestions:state.readQuestions,voiceOn:state.voiceOn,questionReading,questionSessionId,answerListening,recognition:recognition?"active":"inactive",answerTimer:questionTimer?"running":"stopped",runtimeSessionId,renderGeneration,paused:state.screen==="paused",pausedRemaining,audio:{...audioDiagnostics},setupSaved:hasResumableSetup(),playerUpRenderGeneration}}
globalThis.__LOS_PLAYTEST_DIAGNOSTICS__={snapshot:playtestSnapshot,history:()=>transitionDiagnostics.slice(),lifetimes:()=>screenLifetimeDiagnostics.slice(),answers:()=>answerDiagnostics.slice(),playerUps:()=>playerUpDiagnostics.slice(),host:()=>hostSystem?.history.slice()||[]};
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=s=>String(s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
const save=()=>localStorage.setItem(STORAGE.voice,String(state.voiceOn));
function spokenNumber(s){
 const map={one:1,two:2,to:2,too:2,three:3,four:4,for:4,five:5,six:6,seven:7,eight:8,ate:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,"twenty one":21,"twenty two":22,"twenty three":23,"twenty four":24,"twenty five":25,"twenty six":26,"twenty seven":27,"twenty eight":28,"twenty nine":29,thirty:30};
 const n=Number(s);return Number.isFinite(n)&&n>0?n:(map[norm(s)]||0)
}
function nameKey(s){return norm(s).replace(/\b(player|please|the)\b/g,"").replace(/\s+/g," ").trim()}

const GameAudio=(()=>{
 let ctx=null,activated=false,paused=false,music=null,musicTimer=null,generation=0,lastError=null,duckGain=1;
 const gains={music:.28,sfx:.72},recent=new Map(),scheduled=new Set();
 const diagnostics={currentMusic:null,lastSfx:null,activated:false,masterVolume:state.volume,musicGain:gains.music,sfxGain:gains.sfx,playing:false,paused:false,lastPlaybackError:null,owner:null,generation:0,history:[]};
 const record=(type,name,extra={})=>{const item={type,name,at:Date.now(),screen:state.screen,session:runtimeSessionId,generation,...extra};diagnostics.history.push(item);if(diagnostics.history.length>200)diagnostics.history.shift();return item};
 const ensure=()=>{if(!ctx)try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(error){lastError=String(error?.message||error);diagnostics.lastPlaybackError=lastError}if(ctx?.state==="suspended")Promise.resolve(ctx.resume?.()).catch(error=>{lastError=String(error?.message||error);diagnostics.lastPlaybackError=lastError});return ctx};
 const activate=()=>{activated=true;diagnostics.activated=true;ensure();return !!ctx};
 const tone=(freq=440,d=.05,gain=.06,type="sine",delay=0,channel="sfx",ownerGeneration=generation)=>{
  const ac=ensure();if(!ac||paused||ownerGeneration!==generation||state.volume<=0)return false;
  try{const now=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain(),level=Math.max(.0001,gain*state.volume*gains[channel]*(channel==="music"?duckGain:1));o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+d);o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+d+.025);return true}catch(error){lastError=String(error?.message||error);diagnostics.lastPlaybackError=lastError;record("error","tone",{error:lastError});return false}
 };
 const cues={
  countdown3:[[440,.075,.09,"triangle",0],[660,.055,.045,"sine",.035]],countdown2:[[500,.075,.09,"triangle",0],[740,.055,.045,"sine",.035]],countdown1:[[580,.09,.1,"triangle",0],[870,.09,.055,"sine",.045]],
  lockIn:[[180,.08,.09,"sine",0],[540,.13,.1,"triangle",.025],[820,.11,.055,"sine",.075]],questionStart:[[720,.045,.025,"sine",0]],tick:[[480,.035,.035,"triangle",0]],urgentTick:[[610,.035,.05,"triangle",0],[760,.025,.025,"sine",.018]],
  timeout:[[190,.18,.11,"triangle",0],[145,.2,.09,"sine",.14]],correct:[[560,.07,.075,"triangle",0],[720,.09,.08,"triangle",.065],[920,.13,.065,"sine",.14]],wrong:[[270,.1,.065,"triangle",0],[205,.15,.055,"sine",.075]],pass:[[420,.055,.035,"triangle",0],[330,.07,.03,"sine",.045]],strike:[[155,.08,.08,"triangle",0],[110,.13,.075,"sine",.055]],elimination:[[240,.12,.065,"triangle",0],[180,.17,.06,"sine",.09],[120,.22,.05,"sine",.19]],transition:[[360,.07,.04,"triangle",0],[520,.1,.05,"triangle",.075],[680,.12,.045,"sine",.15]],champion:[[330,.16,.08,"triangle",0],[440,.18,.08,"triangle",.1],[660,.24,.085,"triangle",.2],[880,.32,.07,"sine",.31]]
 };
 const playSfx=(name,{eventId=null,force=false}={})=>{if(paused)return false;const key=eventId||`${name}:${runtimeSessionId}`,now=Date.now();if(!force&&recent.has(key)&&now-recent.get(key)<1500)return false;recent.set(key,now);if(recent.size>80)for(const [k,t] of recent)if(now-t>10000)recent.delete(k);const recipe=cues[name];if(!recipe)return false;diagnostics.lastSfx=name;diagnostics.owner={screen:state.screen,session:runtimeSessionId};record("sfx",name,{eventId:key});const own=generation;recipe.forEach(([f,d,g,t,delay])=>{if(!delay){tone(f,d,g,t,0,"sfx",own);return}const id=setTimeout(()=>{scheduled.delete(id);tone(f,d,g,t,0,"sfx",own)},delay*1000);scheduled.add(id)});return true};
 const stopMusic=()=>{if(musicTimer)clearInterval(musicTimer);musicTimer=null;music=null;diagnostics.currentMusic=null;diagnostics.playing=false;record("music-stop","music")};
  const playMusic=(name,{owner=state.screen}={})=>{if(music?.name===name&&!paused)return false;stopMusic();ensure();const patterns={setup:[220,277,330,440],showdown:[110,165,220,277,220,165],champion:[330,440,523,659,784,659]};const seq=patterns[name];if(!seq)return false;music={name,owner,step:0};diagnostics.currentMusic=name;diagnostics.owner=owner;diagnostics.playing=true;record("music-start",name,{owner});const cadence=name==="showdown"?520:name==="champion"?420:700;musicTimer=setInterval(()=>{if(paused||!music)return;const f=seq[music.step++%seq.length];tone(f,name==="showdown"?.22:.14,name==="showdown"?.035:.024,"triangle",0,"music",generation)},cadence);return true};
 const pause=()=>{paused=true;diagnostics.paused=true;diagnostics.playing=false;record("pause","audio")};
 const resume=()=>{paused=false;diagnostics.paused=false;diagnostics.playing=!!music;record("resume","audio")};
 const stopPending=()=>{generation++;diagnostics.generation=generation;for(const id of scheduled)clearTimeout(id);scheduled.clear()};
 const stopAll=()=>{stopPending();stopMusic();record("stop-all","audio")};
 const setVolume=value=>{diagnostics.masterVolume=Math.max(0,Math.min(1,Number(value)||0))};
 const duck=(value=.35)=>{duckGain=Math.max(.1,Math.min(1,value));record("duck","music",{gain:duckGain})};
 const restore=()=>{duckGain=1;record("restore","music")};
 return {activate,ensure,tone,playSfx,playMusic,stopMusic,stopPending,stopAll,pause,resume,setVolume,duck,restore,diagnostics};
})();
globalThis.__LOS_GAME_AUDIO__=GameAudio;
function ensureAudio(){return GameAudio.activate()}
function tone(freq=440,d=.05,gain=.06,type="sine",delay=0){return GameAudio.tone(freq,d,gain,type,delay)}
function handoffTick(value){GameAudio.playSfx(value===3?"countdown3":value===2?"countdown2":"countdown1",{eventId:`countdown:${runtimeSessionId}:${value}`})}
function tickSound(rem){
 if(rem<=0)return;
 audioDiagnostics.tick=rem>=6?"normal":"urgent";
 if(rem>=6){GameAudio.playSfx("tick",{eventId:`tick:${questionSessionId}:${rem}`});return}
 // Pressure zone: same tick character, rapid cadence from 5 through 1.
 [0,200,400,600,800].forEach((ms,index)=>questionSoundTimers.push(setTimeout(()=>GameAudio.playSfx("urgentTick",{eventId:`urgent:${questionSessionId}:${rem}:${index}`}),ms)))
}
function buzzer(){audioDiagnostics.buzzerFired=true;audioDiagnostics.tick="off";GameAudio.playSfx("timeout",{eventId:`timeout:${questionSessionId}`})}
function good(){GameAudio.playSfx("correct",{eventId:`correct:${questionSessionId}`})}
function bad(){GameAudio.playSfx("wrong",{eventId:`wrong:${questionSessionId}`})}
function sting(){GameAudio.playSfx("transition",{eventId:`transition:${runtimeSessionId}`})}

const HOST_LINES={
 showtime:[
  {text:"Welcome to Last One Standing! {players}. You have {seconds} seconds to answer. Get it right and stay in the fight. Three strikes and you are out. Last One Standing takes it. Y'all ready? Let's see who came to play.",workSafe:true},
  {text:"This is Last One Standing! {players}. Answer before the {seconds}-second clock runs out. Correct answers keep you alive, three strikes send you home, and the last player standing wins. Let's get it crackin'.",workSafe:true}
 ],
 showtimeSolo:[
  {text:"Welcome to Last One Standing, {name}! You have {seconds} seconds for each answer. Stay sharp, avoid three strikes, and see how long you can hold the floor. Let's get it crackin'.",workSafe:true},
  {text:"This is Last One Standing, Solo Edition. {name}, beat the {seconds}-second clock, keep the correct answers coming, and stay in the fight. Let's see what you got.",workSafe:true}
 ],
 firstTurn:[{text:"Alright, {name}, you are first up. Lock in when you are ready.",workSafe:true},{text:"{name}, you are leading us off. Let's see what you got.",workSafe:true}],
 opening:[
  {text:"Welcome to Last One Standing! Hope y’all came ready, because somebody in this room has been lying about how smart they are. Let’s get it crackin’!",workSafe:true},
  {text:"Welcome to Last One Standing! Alright, let’s see who really knows something.",workSafe:true},
  {text:"Welcome to Last One Standing! Who’s taking the title tonight?",workSafe:true}
 ],
 turn:[{text:"Alright, {name}, you’re up.",workSafe:true},{text:"Okay {name}, let’s see what you got.",workSafe:true}],
 correct:[{text:"There you go.",workSafe:true},{text:"That’s what I’m talking about.",workSafe:true},{text:"Okay, I see you.",workSafe:true},{text:"Damn, that was good.",workSafe:false}],
 fastCorrect:[{text:"Okay, quick draw!",workSafe:true},{text:"You knew that immediately.",workSafe:true},{text:"Damn! You didn’t even let me finish.",workSafe:false}],
 slowCorrect:[{text:"You got that in just under the wire.",workSafe:true},{text:"That clock was coming for you.",workSafe:true}],
 wrong:[{text:"Nahhh. Not this time.",workSafe:true},{text:"That one got you.",workSafe:true},{text:"Ooooh, that hurt.",workSafe:true},{text:"You almost had it.",workSafe:true}],
 easyMiss:[{text:"Come on now, you knew that one!",workSafe:true},{text:"That one looked easier than it was.",workSafe:true}],
 streak:[{text:"Okay, you’re on a run now.",workSafe:true},{text:"Somebody came to play.",workSafe:true}],
 misses:[{text:"Shake it off. The next one is yours.",workSafe:true},{text:"That question run is fighting back.",workSafe:true}],
 lead:[{text:"We got a new leader.",workSafe:true}],tie:[{text:"Now we got a game.",workSafe:true}],
 comeback:[{text:"Hold up… we might have a comeback.",workSafe:true}],
 tough:[{text:"That one was nasty.",workSafe:true},{text:"That was tougher than it looked.",workSafe:true}],
 strike:[{text:"That’s a strike. Keep it moving.",workSafe:true}],
 elimination:[{text:"And just like that, we’re down one.",workSafe:true}],
 showdown:[{text:"Final Showdown. Two players, one title. Let’s settle it.",workSafe:true}],
 champion:[{text:"{name} is the Last One Standing! That title is yours.",workSafe:true},{text:"Make some noise for {name}, today’s champion!",workSafe:true}],
 ending:[{text:"That’s the game. Respect to everybody who stepped up.",workSafe:true}]
};
Object.assign(HOST_LINES,HOST_LINE_TUNING);
const addHostLines=(event,texts,{workSafe=true,cultural=false,humor=true,...tags}={})=>{HOST_LINES[event]=[...(HOST_LINES[event]||[]),...texts.map(text=>({text,workSafe,cultural,humor,...tags}))]};
addHostLines("turn",[
 "Alright, big dawg, you're up.","Okay {name}, show me something.","Aight, big homie, your turn.","{name}, lock in. Let's work.","Come on, compa. You're up.","The floor belongs to {name}.","{name}, bring that game-night confidence over here.","Alright {name}, make this one look easy.","Your turn, homie. Stay sharp.","Okay {name}, the room is watching.","Step right up, {name}.","{name}, this is your moment. Use it wisely.","Let's see what the big homie knows.","Come on {name}, give us something clean.","New turn, same pressure. You're up, {name}.","{name}, take the wheel.","Okay compa, time to earn it.","{name}, everybody got quiet for you.","Big dawg, the question is yours.","Alright {name}, no warm-up needed."
],{cultural:true});
addHostLines("correct",[
 "Okay, big dawg, I see you.","Órale, that was clean.","Big homie came ready tonight.","Okayyy, somebody knows something.","You did not even have to negotiate with that answer.","Alright, I have to give you that.","Perro, that point looked easy.","That answer walked in like it owned the place.","Clean work. No notes.","Somebody studied without telling the room.","That was smoother than it needed to be.","Correct—and suddenly everybody else is nervous.","You knew it and made sure we knew you knew it.","That point has your name all over it.","Okay, knowledge showed up tonight.","No debate. Put it on the board.","That answer came dressed for the occasion.","Big dawg handled business.","You made that question look unemployed.","That was a grown-up answer right there.","The confidence matched the facts. Beautiful.","Correct. The room may continue pretending it knew too.","You brought the receipt for that answer.","That was clean enough to replay.","Point secured before anybody could object.","I see the gears working, homie.","That answer landed perfectly.","You just made the hard part look suspiciously easy.","Okay {name}, knowledge with a little swagger.","The board says correct, and I agree with the board."
],{cultural:true});
addHostLines("wrongAttempt",[
 "Not that one.","Nah, keep going.","Try again.","Nope. You still have time.","Keep digging.","Wrong lane. Turn around.","Not yet.","Shake that guess off.","Keep working, big dawg.","No, but the clock is still yours.","Try another door.","That is not it, compa.","Keep the answers coming.","No point yet. Stay with it.","Different answer.","Close that tab and open another one.","Not the one. Breathe.","You have time, homie.","Reset and fire again.","Nope. Do not surrender the clock."
],{cultural:true});
addHostLines("wrong",[
 "Big dawg, you had the whole clock.","Dang, perro, that one got you.","You were thinking hard too.","Come on now, you are going to remember that one.","Big homie, we have to let that one go.","That question collected rent and moved in.","You gave it everything except the right answer.","The effort was premium. The result was basic.","That clock watched the whole thing happen.","You looked confident right up to the reveal.","We are filing that answer under learning experience.","The room will politely forget that happened.","That question won the argument.","You took the scenic route and missed the exit.","Not your finest fifteen seconds, but we move.","The answer was hiding. It hid successfully.","That one left with your point.","We gave it time, thought, and still no deal.","You said it like the scoreboard had to agree.","That miss had excellent posture."
],{workSafe:false,cultural:true});
addHostLines("fastCorrect",[
 "Perro, let me finish the question.","Dang, that was quick.","Big homie knew that before I asked it.","The clock barely clocked in.","You answered before doubt entered the room.","That was express-lane knowledge.","Somebody had that answer preloaded.","Okay, no thinking face required.","That point arrived ahead of schedule.","You beat the question to the finish line.","Fast, clean, disrespectful to the clock.","The timer would like a chance next time.","You did not even let suspense sit down.","That answer came out on instinct.","Big dawg was waiting on me."
],{cultural:true});
addHostLines("slowCorrect",[
 "Big dawg, that clock was on your bumper.","You used every second I gave you.","You almost let the clock pack your bags.","Okay, you made it—barely.","That answer crossed the line on fumes.","You waited until suspense got uncomfortable.","The clock had one hand on the buzzer.","That was correct by a heartbeat.","You squeezed a point out of the final second.","Everybody exhale. It counted.","That answer needed a photo finish.","You took the long way, but you got there.","The timer was already writing your obituary.","That point barely made curfew.","Compa, do not scare us like that."
],{cultural:true});
addHostLines("streak",["Somebody better slow big homie down.","Okayyy, now you are cooking.","Big dawg is getting comfortable.","That is a real run. Everybody take notes.","The hot hand just got hotter.","{name} found a rhythm and brought drums.","This is becoming a problem for the room.","Back-to-back knowledge with no apology."] ,{cultural:true});
addHostLines("comeback",["Hold up—look who decided to wake up.","Okay, okay, we have a comeback.","Do not call it over yet.","{name} just reopened the case.","The comeback has officially entered the building.","Big homie found another gear.","Somebody check the scoreboard. This changed fast.","That is how you get back in the conversation."],{cultural:true});
addHostLines("lead",["New leader. Everybody act natural.","{name} just took the good seat.","The top spot has a new address.","Okay, the leaderboard moved.","Big dawg is out front now.","That point came with first place attached."],{cultural:true});
addHostLines("tie",["Now we have a game.","Alright, nobody breathe. This got interesting.","All even. Somebody blink first.","The scoreboard refuses to pick a side.","This room just got real quiet.","Tied up and nobody looks comfortable."],{cultural:true});
addHostLines("tough",["That was Savage and you still got it.","Okay, big dawg. Respect.","Nah, I have to give you that one.","Perro—who even knows that?","That question came with teeth. You handled it.","Savage tried you and lost.","That was not trivia. That was a background check.","You earned every inch of that point.","That answer deserves a slow nod.","Somebody knows the deep cuts."],{cultural:true});
addHostLines("answerReveal",["We will leave that one alone. The answer was {answer}.","Fair enough. The answer was {answer}.","Okay, big homie. The answer was {answer}.","Let that one go. We needed {answer}.","Time called it. The answer was {answer}.","The clock wins. We were looking for {answer}.","No shame in the pass. The answer was {answer}.","Put that one in the memory bank: {answer}.","The correct answer was {answer}. Keep it moving.","That one belonged to {answer}."],{cultural:true});
addHostLines("showdown",["Final Showdown. Everybody sit up.","Two left, one title, zero room for excuses.","This is where the game gets expensive.","Final two. The easy breathing is over.","One of these players is about to own the room.","The scoreboard brought us here. Answers finish it.","Big dawg rules now: survive or sit down.","Órale, final two. Make it count.","We started with a room. Now we have a duel.","No passengers left. Both players have to drive.","This is the last hill. Somebody climb it.","Final Showdown—knowledge under pressure.","The title is close enough to touch.","Two chairs, one champion speech.","Let us settle this properly."],{cultural:true});
addHostLines("champion",["And THAT is your Last One Standing—{name}!","Big dawg took the whole thing.","Give it up for {name}. That is your champion.","Okay, big homie. You earned that.","That is game. Everybody else go study.","Perro, {name} really came in here and took everybody out.","The room had chances. {name} took the title.","Champion status confirmed. Respect, {name}.","Last player up, last player standing: {name}.","That trophy has {name}'s fingerprints all over it.","The questions are done arguing. {name} wins.","Everybody clap like you knew this was coming.","{name} survived the clock, the questions, and all of you.","That is a wrap. Big homie owns the night.","The title stays with {name}. Clean work.","We have a winner and several future study partners.","{name} did not borrow the crown. That crown is owned.","From first question to last answer, {name} handled business.","Órale, champion. Take your moment.","Last One Standing has a name, and it is {name}."],{cultural:true});
addHostLines("turn",["Alright {name}, show 'em something.","Okay girl, your turn.","My girl {name} is up.","Go on girl, take the floor.","{name}, let them know you came to play.","Alright girl, lock in.","Okay {name}, do your thing.","The room is yours, girl.","{name}, bring that energy.","Let's work, girl.","My girl is on the clock.","Okay {name}, make it count.","Go ahead girl, show us what you know.","{name}, this question has your name on it.","Alright {name}, stay sharp.","Girl, everybody got quiet for you.","{name}, step up and own it.","Okay girl, give us a clean one.","My girl {name} came ready.","{name}, take your shot."],{hostStyle:"feminine"});
addHostLines("correct",["Get it, girl!","Okay girl, I see you.","My girl came to play.","That's right, {name}.","Girl, you knew that one.","Okay {name}, don't hurt 'em.","That was clean, girl.","{name} put that point away.","Go on girl, collect that point.","My girl had the answer ready.","Okayyy {name}, knowledge and timing.","Girl, that question never had a chance.","{name} handled that beautifully.","That is how you do it, girl.","My girl made that look easy.","Right answer, right on time, {name}.","Girl, the scoreboard heard you.","{name} came with receipts.","Okay girl, that was all business.","That's a point for my girl {name}."],{hostStyle:"feminine"});
addHostLines("turn",["Alright big dawg, show me something.","Big homie, your turn.","Okay homie, lock in.","{name}, handle your business.","Big dawg, the floor is yours.","Alright {name}, bring the pressure.","Homie, make this one count.","{name}, step up and work.","Big homie is on the clock.","Okay {name}, stay ready.","Your question, big dawg.","{name}, show the room what you know.","Alright homie, take your shot.","Big dawg, keep it clean.","{name}, time to earn that point.","Okay big homie, focus up.","The room is yours, {name}.","Big dawg, let us see that game.","{name}, come get this question.","Alright homie, no excuses."],{hostStyle:"masculine"});
addHostLines("turn",["Alright {name}, show me something.","Your turn, {name}.","Okay, take the floor.","{name}, lock in and work.","The next question belongs to {name}.","Show us what you know.","{name}, make this one count.","Alright, stay sharp.","The room is ready for you, {name}.","Take your shot.","Okay {name}, bring that energy.","New question, fresh opportunity.","{name}, step up.","Let us see a clean answer.","Your clock, your question.","Alright {name}, focus up.","The floor is yours.","{name}, give us your best one.","Time to work.","Okay, show the room something."],{hostStyle:"neutral"});
const SPANISH_PRONUNCIATION_REVIEWED=false;
const HOST_EVENT_POLICY={showtime:["critical",1],showtimeSolo:["critical",1],firstTurn:["major",1],turn:["optional",1],soloTurn:["optional",1],lockIn:["critical",1],questionRead:["critical",1],answerReveal:["critical",1],opening:["critical",1],showdown:["critical",1],champion:["critical",1],elimination:["major",1],streak:["major",.9],categoryRun:["reaction",.55],culturalCorrect:["optional",.42],lead:["major",.8],tie:["major",.65],comeback:["major",.85],fastCorrect:["reaction",.8],slowCorrect:["reaction",.75],easyMiss:["reaction",.75],misses:["reaction",.65],correct:["optional",.32],wrong:["optional",.45],tough:["reaction",.65],strike:["optional",.3],ending:["major",1]};
const HOST_PRIORITY={optional:1,reaction:2,major:3,critical:4};
function defaultHostProvider(){
 const supplied=window.__LOS_HOST_PROVIDER__;
 if(supplied&&typeof supplied.play==="function"&&typeof supplied.cancel==="function")return supplied;
 // Natural speech is deliberately provider-backed. Browser speechSynthesis is not used as a quality substitute.
 return {name:"none",available:false,play:()=>Promise.resolve(),cancel(){},setVolume(){}}
}
function createHostSystem(provider=defaultHostProvider()){
 let token=0,eventSequence=0,speaking=false,currentPriority=0,micWasActive=false,lastIds=[],lastFamilies=[],idleWaiters=[],currentEntry=null;
 const history=[];
 const settleIdle=outcome=>{if(speaking)return;const waiters=idleWaiters;idleWaiters=[];waiters.forEach(resolve=>resolve(outcome||currentEntry||history.at(-1)||{result:"idle"}))};
 const whenIdle=()=>speaking?new Promise(resolve=>idleWaiters.push(resolve)):Promise.resolve(currentEntry||history.at(-1)||{result:"idle"});
 const cancel=(reason,resumeRecognition=true)=>{token++;provider.cancel?.(reason);if(currentEntry&&!/completed|failed|cancelled/.test(currentEntry.result||"")){currentEntry.result="cancelled";currentEntry.cancelReason=reason;currentEntry.settledAt=Date.now()}const outcome=currentEntry;currentEntry=null;const resume=micWasActive;micWasActive=false;speaking=false;currentPriority=0;settleIdle(outcome);if(resume&&resumeRecognition)queueMicrotask(()=>{if(state.voiceOn&&voiceCore.desired&&!voiceCore.permissionBlocked)startVoice(state.screen)});return resume};
 const choose=(event,context={})=>{
  const culturalCategory=/hip-hop|r&b|funk|oldies|music|regional mexican|tejano|corrido|norte|ranchera/i.test(context.category||""),style=["masculine","feminine","neutral"].includes(context.hostStyle)?context.hostStyle:"neutral",pronunciationSafe=line=>SPANISH_PRONUNCIATION_REVIEWED||!/\b(?:compa|perro|orale|órale)\b/i.test(line.text);
  const source=(HOST_LINES[event]||[]).filter(x=>(state.mode!=="work"||x.workSafe!==false)&&(!x.hostStyle||x.hostStyle==="any"||x.hostStyle===style)&&pronunciationSafe(x)),flavored=culturalCategory?source.filter(x=>x.cultural):[];
  const candidates=flavored.length&&Math.random()<.35?flavored:source;
  const phraseFamily=line=>line.family||norm(line.text).replace(/\b(?:name|player|big|dawg|homie|compa|perro|okay|alright|aight|orale)\b/g,"").split(" ").filter(Boolean).slice(0,3).join(" ");
  const pool=candidates.filter(line=>!lastIds.includes(event+":"+(HOST_LINES[event]||[]).indexOf(line))&&!lastFamilies.includes(phraseFamily(line)));
  const usable=pool.length?pool:source;if(!usable.length)return null;
  const line=usable[Math.floor(Math.random()*usable.length)],index=(HOST_LINES[event]||[]).indexOf(line),id=event+":"+index;
  const replacements={name:context.name||"player",players:context.players||"Players, welcome to the game",seconds:context.seconds||state.questionSeconds||15,question:context.question||"",answer:context.answer||""};
  lastIds=[...lastIds,id].slice(-5);lastFamilies=[...lastFamilies,phraseFamily(line)].slice(-4);return {...line,id,text:line.text.replace(/\{(name|players|seconds|question|answer)\}/g,(_,key)=>String(replacements[key]))}
 };
 const emit=(event,context={})=>{
  if(!state.voiceOn){history.push({hostEventId:`host-${++eventSequence}`,event,result:"voice-disabled",screen:state.screen,session:runtimeSessionId,at:Date.now(),context});return false}
  const explicitPlayer=[...(state.game?.players||[]),...(state.players||[])].find(p=>p.name===context.name);context={...context,hostStyle:context.hostStyle||explicitPlayer?.hostStyle||"neutral"};
  const [level="optional",chance=0]=HOST_EVENT_POLICY[event]||[],priority=HOST_PRIORITY[level]||1;
  if(chance<1&&Math.random()>chance){history.push({event,result:"frequency-skip",context});return false}
  const line=choose(event,context);if(!line){history.push({event,result:"no-safe-line",context});return false}
  history.push({hostEventId:`host-${++eventSequence}`,event,result:provider.available===false?"provider-unavailable":"selected",priority,lineId:line.id,text:line.text,screen:state.screen,session:runtimeSessionId,renderGeneration,requestTime:Date.now(),context});
  if(provider.available===false)return true;
  if(speaking&&priority<currentPriority)return false;
  const carriedMic=speaking?cancel("interrupted-by-"+event,false):false;
  const myToken=++token;currentPriority=priority;speaking=true;micWasActive=carriedMic||temporarilySuspendRecognitionForHost();
  const historyEntry=history.at(-1),spanishTerms=line.text.match(/\b(?:compa|perro|orale|órale|vicente fernández|ramón ayala|jenni rivera|selena|los tigres del norte|ana gabriel|rocío dúrcal)\b/gi)||[];currentEntry=historyEntry;historyEntry.playbackRequestedAt=Date.now();historyEntry.volume=state.volume;historyEntry.pronunciation={mode:"human-review-gated",terms:spanishTerms};
  Promise.resolve(provider.play({hostEventId:historyEntry.hostEventId,event,text:line.text,priority:level,volume:state.volume,context:{...context,screen:state.screen,runtimeSession:runtimeSessionId,renderGeneration}})).then(()=>{historyEntry.result="playback-completed";historyEntry.playbackCompletedAt=Date.now()}).catch(error=>{historyEntry.result="playback-failed";historyEntry.error=String(error?.message||error)}).finally(()=>{
   if(myToken!==token)return;speaking=false;currentPriority=0;historyEntry.settledAt=Date.now();currentEntry=null;settleIdle(historyEntry);const resume=micWasActive;micWasActive=false;if(resume&&state.voiceOn&&voiceCore.desired&&!voiceCore.permissionBlocked)startVoice(state.screen)
  });return true
 };
 return {emit,cancel,choose,whenIdle,history,isSpeaking:()=>speaking,provider}
}
function startMusic(){if(isSetupScreen()||state.screen==="home")GameAudio.playMusic("setup",{owner:"setup"})}
function stopMusic(){GameAudio.stopMusic()}
function clearRuntime(){hostSystem?.cancel("runtime-change");questionReading=false;answerListening=false;audioDiagnostics.tick="off";GameAudio.stopPending();clearInterval(questionTimer);questionTimer=null;clearTimeout(flowTimer);flowTimer=null;questionSoundTimers.forEach(clearTimeout);questionSoundTimers=[];handoffTimers.forEach(clearTimeout);handoffTimers=[];celebrationTimers.forEach(id=>{clearTimeout(id);clearInterval(id)});celebrationTimers=[]}
function isSetupScreen(){return ["setup","mode","industry","difficulty","fun","players","time","ready"].includes(state.screen)}
function exitSetup(){if(state.game)return;markSetupAbandoned(state.screen);state.game=null;home()}
function bindSetupShell(){document.querySelectorAll("[data-setup-exit]").forEach(button=>button.onclick=exitSetup)}
function shell(title,content,footer=""){return `<section class="screen"><div class="shell"><header class="topbar"><div></div><div class="topbar-title">${title||""}</div><div></div></header><div class="content">${content}</div><footer class="footer">${footer}</footer></div></section>${state.voiceOn?`<div id="voiceDiagnostic" class="voice-diagnostic">MIC LISTENING</div>`:""}`}
function remembered(){try{return JSON.parse(localStorage.getItem(STORAGE.names)||"[]")}catch{return[]}}
function rememberNames(){const ns=state.players.map(p=>p.name.trim()).filter(Boolean);localStorage.setItem(STORAGE.names,JSON.stringify([...new Set([...remembered(),...ns])].slice(-50)))}
function ensurePlayers(){
 if(!state.players.length)state.players=[{id:uid(),name:"Vicente"},{id:uid(),name:"Todd"},{id:uid(),name:"Maria"}];
 if(state.mode==="solo")state.players=state.players.slice(0,1);
 state.players=state.players.map(p=>({...p,hostStyle:["masculine","feminine","neutral"].includes(p.hostStyle)?p.hostStyle:"neutral"}));
 state.selectedIds=state.players.filter(p=>p.name.trim()).map(p=>p.id)
}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function temporarilySuspendRecognitionForHost(){
 if(!state.voiceOn||!recognition)return false;
 clearTimeout(voiceCore.restart);voiceCore.restart=null;voiceCore.generation++;
 const r=recognition;recognition=null;try{r.onstart=r.onresult=r.onerror=r.onend=null;r.abort()}catch{};return true
}
function stopVoice(){
 voiceCore.desired=false;
 voiceCore.handledInterimSlots.clear();voiceCore.navQueued=null;
 clearTimeout(voiceCore.restart);voiceCore.restart=null;
 voiceCore.generation++;
 const r=recognition;recognition=null;
 try{if(r){r.onstart=r.onresult=r.onerror=r.onend=null;r.abort()}}catch{}
}

let lastVoiceAction={key:"",at:0};

function voiceFeedback(text,kind="heard"){
 const el=document.getElementById("voiceFeedback");if(!el)return;
 el.textContent=text||"";el.dataset.kind=kind;
 clearTimeout(voiceFeedback._t);
 voiceFeedback._t=setTimeout(()=>{if(el)el.textContent=""},1500)
}
function commandKey(s){return norm(s).replace(/\b(the|button|option|please)\b/g,"").replace(/\s+/g," ").trim()}
function phraseMatch(a,b){
 a=commandKey(a);b=commandKey(b);if(!a||!b)return false;
 if(a===b)return true;
 const shortControls=new Set(["continue","start","next","back","skip","pass","select all","clear all","add player"]);
 if(shortControls.has(a)||shortControls.has(b))return false;
 if(a.length>=6&&b.length>=6&&(a.includes(b)||b.includes(a)))return true;
 const aa=a.split(" "),bb=b.split(" ");
 const common=aa.filter(x=>bb.includes(x)).length;
 return common>=2&&common>=Math.ceil(Math.min(aa.length,bb.length)*.75)
}
function visibleVoiceTargets(){
 return [...document.querySelectorAll('button:not([disabled]),[role="button"]:not([aria-disabled="true"]),input[type="button"]:not([disabled]),input[type="submit"]:not([disabled])')]
   .filter(el=>{
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return r.width>0&&r.height>0&&cs.visibility!=="hidden"&&cs.display!=="none"
   })
   .map(el=>{
     const label=(el.dataset.voice||el.getAttribute("aria-label")||el.textContent||el.value||"").trim();
     const aliases=(el.dataset.voiceAliases||"").split("|").map(x=>x.trim()).filter(Boolean);
     return {el,label,phrases:[label,...aliases].filter(Boolean)}
   })
}
function fuzzyVisibleTarget(h){
 const n=commandKey(h);if(!n)return false;
 const generic=/^(continue|start|begin|next|go|go ahead|lets go|let s go|lets begin|let s begin|im ready|i m ready|were ready|we re ready|move on)$/;
 if(generic.test(n)){
   const primary=document.querySelector('button.primary:not([disabled]),#continue:not([disabled]),#cont:not([disabled]),#start:not([disabled])');
   if(primary){voiceFeedback("✓ "+(primary.textContent||"CONTINUE").trim(),"action");primary.click();return true}
 }
 const targets=visibleVoiceTargets();
 let best=null,bestScore=0;
 for(const t of targets){
   for(const p of t.phrases){
     const k=commandKey(p);if(!k)continue;
     let score=0;
     if(n===`click ${k}`||n===`choose ${k}`||n===`select ${k}`||n===`pick ${k}`||n===`press ${k}`)score=95;
     else if(k==="add player"){
       if(/^(add player|add a player|add another player)$/.test(n))score=100;
     } else if(phraseMatch(n,k))score=70+Math.min(k.length,20);
     if(score>bestScore){best=t;bestScore=score}
   }
 }
 if(best&&bestScore>=72){
   const key=commandKey(best.label),now=Date.now();
   if(lastVoiceAction.key===key&&now-lastVoiceAction.at<700)return true;
   lastVoiceAction={key,at:now};
   voiceFeedback("✓ "+best.label,"action");best.el.click();return true
 }
 return false
}
let voiceCore={ctx:null,restart:null,generation:0,retryAttempt:0,desired:false,lastKey:"",lastAt:0,lastHeard:"",permissionBlocked:false,handledInterimSlots:new Set(),navQueued:null,diagnostics:[],utterance:0,currentUtterance:null,latencySeen:new Set()},lastPlayerVoiceMutation={key:"",at:0};
const VOICE_LATENCY_MODE=new URLSearchParams(location.search).get("voiceLatency")==="1";

function renderVoiceLatencyPanel(){
 if(!VOICE_LATENCY_MODE)return;
 let panel=document.getElementById("voiceLatencyPanel");
 if(!panel){
  panel=document.createElement("pre");panel.id="voiceLatencyPanel";
  panel.style.cssText="position:fixed;left:8px;bottom:8px;z-index:9999;max-width:min(94vw,720px);max-height:42vh;overflow:auto;margin:0;padding:9px;border:1px solid #ffd04f;border-radius:8px;background:rgba(0,0,0,.88);color:#fff;font:11px/1.35 monospace;pointer-events:none;white-space:pre-wrap";
  document.body.appendChild(panel)
 }
 const rows=voiceCore.diagnostics.slice(-18),bases=new Map();
 panel.textContent="VOICE LATENCY MODE · "+navigator.userAgent+"\n"+rows.map(x=>{
  if(x.utterance&&!bases.has(x.utterance)&&["sound-start","speech-start","first-result-activity"].includes(x.stage))bases.set(x.utterance,x.monoAt);
  const base=x.utterance?bases.get(x.utterance):null,delta=base==null?"":` +${Math.round(x.monoAt-base)}ms`;
  return `${Math.round(x.monoAt)}ms${delta} U${x.utterance||"-"} ${x.stage}${x.text?` “${x.text}”`:""}${Number.isFinite(x.confidence)?` c=${x.confidence.toFixed(2)}`:""}${x.reason?` (${x.reason})`:""}`
 }).join("\n")
}
function beginVoiceLatencyUtterance(stage){
 voiceCore.currentUtterance=++voiceCore.utterance;voiceCore.latencySeen.clear();voiceDiagnostic(stage)
}

function voiceDiagnostic(stage,detail={}){
 voiceCore.diagnostics.push({stage,screen:state.screen,at:Date.now(),monoAt:performance.now(),utterance:voiceCore.currentUtterance,...detail});
 if(voiceCore.diagnostics.length>80)voiceCore.diagnostics.splice(0,voiceCore.diagnostics.length-80);
 if(VOICE_LATENCY_MODE){console.debug("[LOS voice latency]",voiceCore.diagnostics.at(-1));renderVoiceLatencyPanel()}
}

function voiceStatus(text,kind="listening"){
 voiceCore.lastHeard=text||"";
 const el=document.getElementById("voiceDiagnostic");
 if(!el)return;
 if(kind==="error"){el.style.display="block";el.textContent=text||"MIC ISSUE";return}
 el.style.display="none"
}
function voiceOnce(key,fn,windowMs=600){
 const now=Date.now(),k=commandKey(key);
 if(voiceCore.lastKey===k&&now-voiceCore.lastAt<windowMs){voiceDiagnostic("command-rejected",{reason:"duplicate",command:k});return true}
 voiceCore.lastKey=k;voiceCore.lastAt=now;voiceDiagnostic("command-matched",{command:k});voiceDiagnostic("command-executed",{command:k});fn();return true
}
function exactVisibleTarget(h){
 const n=commandKey(h);if(!n)return false;
 for(const t of visibleVoiceTargets()){
  for(const p of t.phrases){
   if(commandKey(p)===n){
    return voiceOnce("btn:"+t.label,()=>{voiceFeedback("✓ "+t.label,"action");t.el.click()})
   }
  }
 }
 return false
}
function queueVoiceNavigation(h,isFinal,confidence){
 voiceCore.navQueued={h,isFinal,confidence,screen:state.screen,session:runtimeSessionId};
 voiceDiagnostic("command-matched",{command:commandKey(h),result:"queued-navigation-lock"});
 return true
}
function centralNavIntent(h,isFinal=false,confidence=0){
 const n=norm(h);
 if(state.screen==="setup"){
  if(/^(continue|start game)$/.test(n))return voiceOnce("continue:setup",()=>startUnifiedGame());
  if(/^(back|go back)$/.test(n)){if(!isFinal)return false;return voiceOnce("back:setup",()=>{markSetupAbandoned("setup");go("home","setup-back")})}
  return false
 }
 if(/^(continue|next|done|go ahead|go on|move on|lets go|let s go|im ready|i m ready|ready|start|play|go|begin|lets begin|let s begin)$/.test(n)){
  if(navLock)return queueVoiceNavigation(h,isFinal,confidence);
  if(state.screen==="players")return voiceOnce("continue:players",()=>playersContinue());
  if(state.screen==="industry")return voiceOnce("continue:industry",()=>industryContinue());
  return voiceOnce("continue:"+state.screen,()=>{
   if(state.screen==="fun"&&typeof funContinue==="function"){funContinue();return}
   if(state.screen==="players"){
    state.players=state.players.filter(p=>(p.name||"").trim());
    if(state.players.length<(state.mode==="solo"?1:2)){
     players();return
    }
    rememberNames();go("time");return
   }
   primaryAction()
  })
 }
 if(/^(back|go back|previous|previous screen)$/.test(n)){
  if(!isFinal)return false;
  if(navLock)return queueVoiceNavigation(h,isFinal,confidence);
  return voiceOnce("back:"+state.screen,()=>back())
 }
 return false
}
function resolveExtraCategory(h){
 const n=norm(h);
 const aliases={
  "music":"Music",
  "movie":"Movies & TV","movies":"Movies & TV","movies and tv":"Movies & TV","movie and tv":"Movies & TV","tv":"Movies & TV",
  "food":"Food & Drink","food and drink":"Food & Drink","food drink":"Food & Drink","food drinks":"Food & Drink",
  "history":"History",
  "90s 2000s":"90s & 2000s","90s and 2000s":"90s & 2000s","90 s and 2000 s":"90s & 2000s",
  "nineties and two thousands":"90s & 2000s","nineties two thousands":"90s & 2000s","the nineties and two thousands":"90s & 2000s",
  "transport":"Transportation","transportation":"Transportation"
 };
 if(aliases[n]&&EXTRA_CATEGORIES.includes(aliases[n]))return aliases[n];
 return EXTRA_CATEGORIES.find(x=>norm(x)===n||phraseMatch(h,x))||null
}
function centralSetupIntent(h){
 const n=norm(h);
 if(state.screen==="setup"){
  // Named toggle intents own these phrases before any generic setup control can see them.
  if(/^(read questions on|turn read questions on|question reading on|read on|read the questions)$/.test(n))return voiceOnce("setup-read:on",()=>setReadQuestionsVoice(true,h));
  if(/^(read questions off|turn read questions off|question reading off|read off|do not read questions|dont read questions|don t read questions|don t read the questions|do not read the questions)$/.test(n))return voiceOnce("setup-read:off",()=>setReadQuestionsVoice(false,h));
  if(/^(voice on|turn voice on|microphone on)$/.test(n))return voiceOnce("setup-voice:on",()=>setSetupVoiceVoice(true,h));
  if(/^(voice off|turn voice off|microphone off)$/.test(n))return voiceOnce("setup-voice:off",()=>setSetupVoiceVoice(false,h));
 }
 if(state.screen==="time"||state.screen==="setup"){
  const durationMatch=n.match(/^(?:(?:set )?game length(?: to)?\s+)?(5|five|10|ten|15|fifteen|20|twenty)\s*(?:minutes?|mins?|min)$/);
  if(durationMatch){
   const values={five:5,ten:10,fifteen:15,twenty:20},minutes=values[durationMatch[1]]||Number(durationMatch[1]);
   return voiceOnce("duration:"+minutes,()=>setGameDuration(minutes))
  }
  if(/^(mute|mute volume|volume off)$/.test(n))return voiceOnce("volume:mute",()=>setVolume(0,true));
  if(/^(unmute|volume on)$/.test(n))return voiceOnce("volume:unmute",()=>setVolume(lastVolume,true));
  if(/^(volume up|louder|turn it up)$/.test(n))return voiceOnce("volume:up",()=>adjustGameVolume(.1));
  if(/^(volume down|quieter|turn it down)$/.test(n))return voiceOnce("volume:down",()=>adjustGameVolume(-.1));
  if(/^(full volume|max volume|maximum volume)$/.test(n))return voiceOnce("volume:max",()=>setVolume(1,true));
  if(/^half volume$/.test(n))return voiceOnce("volume:half",()=>setVolume(.5,true));
  const vm=n.match(/^(?:set )?volume(?: to)?\s+(\d{1,3})(?: percent)?$/);
  if(vm){const pct=Math.max(0,Math.min(100,Number(vm[1])));return voiceOnce("volume:"+pct,()=>setVolume(pct/100,true))}
 }
 if(state.screen==="setup"){
  const mode={original:"original","original game":"original",work:"work","work edition":"work","work game":"work",solo:"solo","solo game":"solo"}[n];
  if(mode)return voiceOnce("setup-mode:"+mode,()=>setUnifiedMode(mode));
  const difficulty=DIFFICULTIES.find(x=>x.id!=="kids"&&(n===norm(x.label)||n===`${norm(x.label)} questions`));
  if(difficulty)return voiceOnce("setup-difficulty:"+difficulty.id,()=>{state.difficulty=difficulty.id;setup()});
  const answerTime=n.match(/^(?:(?:set )?answer time(?: to)?\s+)?(10|ten|15|fifteen|20|twenty|30|thirty)\s*(?:seconds?|secs?|sec)$/);
  if(answerTime){const values={ten:10,fifteen:15,twenty:20,thirty:30},seconds=values[answerTime[1]]||Number(answerTime[1]);return voiceOnce("setup-seconds:"+seconds,()=>{state.questionSeconds=seconds;setup()})}
 }
 if(state.screen==="fun"){
  if(/^(select all|all categories|choose all|give me everything)$/.test(n)){
   return voiceOnce("select-all",()=>{state.categories=[...EXTRA_CATEGORIES];voiceFeedback("✓ ALL CATEGORIES","action");fun()})
  }
  if(/^(clear all|clear categories|remove all categories)$/.test(n)){
   return voiceOnce("clear-all",()=>{state.categories=[];voiceFeedback("✓ CLEAR ALL","action");fun()})
  }
  if(/^(continue|next|done|go ahead|go on|move on|lets go|let s go|im done|i m done|thats it|that s it|start|begin|im ready|i m ready)$/.test(n)){
   return voiceOnce("fun-continue",()=>funContinue())
  }

  let rm=h.match(/^(?:remove|unselect|deselect)\s+(.+)$/i);
  if(rm){
   const target=resolveExtraCategory(rm[1]);
   if(target){
    return voiceOnce("remove-category:"+target,()=>{voiceFeedback("✓ REMOVE "+target,"action");setCategorySelected(target,false)})
   }
  }

  const stripped=h.replace(/^(?:add|select|choose)\s+/i,"").trim();
  const target=resolveExtraCategory(stripped);
  if(target){
   return voiceOnce("add-category:"+target,()=>{voiceFeedback("✓ "+target,"action");setCategorySelected(target,true)})
  }
 }
 if(state.screen==="difficulty"){
  const d=DIFFICULTIES.find(x=>norm(x.label)===n||n===`make it ${norm(x.label)}`||n===`${norm(x.label)} questions`);
  if(d)return voiceOnce("difficulty:"+d.id,()=>{state.difficulty=d.id;voiceFeedback("✓ "+d.label,"action");difficulty()})
 }
 if(state.screen==="industry"){
  const target=WORK_INDUSTRIES.find(x=>norm(x)===n||phraseMatch(h,x));
  if(target)return voiceOnce("industry:"+target,()=>{state.industry=target;voiceFeedback("✓ "+target,"action");industry()})
 }
 return false
}
function centralExitIntent(h){
 const n=norm(h);
 if(isSetupScreen()&&/^(exit|exit game|exit the game|leave|leave game|leave the game|cancel|cancel game|cancel setup|quit setup|go home|back to home|return home)$/.test(n)){
  return voiceOnce("exit-setup",()=>exitSetup())
 }
 if(state.game&&/^(exit game|exit the game|leave game|leave the game|save and leave|save game and leave|go home and save)$/.test(n)){
  return voiceOnce("exit-active",()=>{voiceFeedback("✓ EXIT GAME","action");leaveGame()})
 }
 if(state.game&&/^(quit|quit game|quit the game|end game|end the game|stop game|stop the game)$/.test(n)){
  return voiceOnce("quit-active",()=>{voiceFeedback("✓ QUIT","action");confirmEnd()})
 }
 return false
}
function centralChampionIntent(h,isFinal=false){
 if(state.screen!=="complete"||!isFinal)return false;
 const n=norm(h);
 if(/^(play again|play another game|another game)$/.test(n))return voiceOnce("champion-play-again",()=>replayGame());
 if(/^(home|go home|back to home)$/.test(n))return voiceOnce("champion-home",()=>championHome());
 return false
}
function playersVoiceController(h){
 const raw=(h||"").trim(),n=norm(raw);
 if(!n)return false;
 if(renamePending&&renamePending.spell){
  if(/^(cancel|never mind|nevermind)$/.test(n)){renamePending=null;voiceFeedback("✓ CANCEL","action");return true}
  if(/^(done|save|save name|finished)$/.test(n)){renamePending=null;rerenderPlayerContext();return true}
  if(/^(clear|clear name)$/.test(n)){
   const p=state.players.find(x=>x.id===renamePending.id);if(p){p.name="";rerenderPlayerContext()}return true
  }
  if(/^(backspace|delete letter)$/.test(n)){
   const p=state.players.find(x=>x.id===renamePending.id);if(p){p.name=(p.name||"").slice(0,-1);rerenderPlayerContext()}return true
  }
  const letters=spokenLetters(raw);
  if(letters){
   const p=state.players.find(x=>x.id===renamePending.id);
   if(p){p.name=((p.name||"")+letters).replace(/\s+/g,"");rerenderPlayerContext()}
   return true
  }
 }

 if(/^(continue|next|done|go ahead|go on|move on|lets go|let s go|im ready|i m ready|ready|start|begin|back|go back|exit|exit game|go home)$/.test(n))return false;
 if(/^(player|players|player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+))$/.test(n))return false;

 let m;

 // A player-count command sets the desired total; it never means "add N more".
 m=raw.match(/^(?:(?:make it|set|add)\s+)?(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:\s+(?:one|two|three|four|five|six|seven|eight|nine))?|thirty)\s+players?$/i);
 if(m){
  const total=spokenNumber(m[1]);if(total<1)return false;
  if(total<state.players.length&&state.players.slice(total).some(p=>(p.name||"").trim())){voiceFeedback("CLEAR TRAILING PLAYER NAMES FIRST","error");voiceDiagnostic("command-rejected",{reason:"roster-count-would-remove-names",requestedRosterCount:total});return true}
  while(state.players.length<total)state.players.push({id:uid(),name:""});
  if(state.players.length>total)state.players.length=total;
  voiceDiagnostic("roster-count",{requestedRosterCount:total,actualRosterCount:state.players.length});voiceFeedback(`✓ ${total} PLAYERS`,"action");rerenderPlayerContext();return true
 }

 // Delete/remove
 m=raw.match(/^(?:please\s+)?(?:delete|remove|get rid of|take out)\s+(?:player\s+)?(.+?)(?:\s+please)?$/i);
 if(m){
  const token=m[1].trim(),num=spokenNumber(token);
  if(num){
   const i=num-1;
   if(i>=0&&i<state.players.length){state.players.splice(i,1);voiceFeedback("✓ PLAYER REMOVED","action");rerenderPlayerContext();return true}
  }
  const key=nameKey(token);
  let i=state.players.findIndex(p=>nameKey(p.name)===key);
  if(i<0)i=state.players.findIndex(p=>{const pk=nameKey(p.name);return pk&&key&&(pk.startsWith(key)||key.startsWith(pk))});
  if(i>=0){state.players.splice(i,1);voiceFeedback("✓ PLAYER REMOVED","action");rerenderPlayerContext();return true}
  return false
 }

 // Rename/change by player number
 m=raw.match(/^(?:change|rename|make|set)\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:(?:to|as|is)\s+)?(.+)$/i);
 if(m){
  const i=spokenNumber(m[1])-1,name=m[2].trim();
  if(i>=0&&name){
   while(state.players.length<=i)state.players.push({id:uid(),name:""});
   state.players[i].name=name;voiceFeedback("✓ "+name.toUpperCase(),"action");rerenderPlayerContext();return true
  }
 }

 // Rename by current name
 m=raw.match(/^(?:change|rename)\s+(.+?)\s+to\s+(.+)$/i);
 if(m){
  const from=nameKey(m[1]),to=m[2].trim();
  const p=state.players.find(x=>nameKey(x.name)===from);
  if(p&&to){p.name=to;voiceFeedback("✓ "+to.toUpperCase(),"action");rerenderPlayerContext();return true}
 }

 // Assign by number
 m=raw.match(/^player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:(?:is|to|should be|can be|will be)\s+)?(.+)$/i);
 if(m){
  const i=spokenNumber(m[1])-1,name=m[2].trim();
  if(i>=0&&name){
   while(state.players.length<=i)state.players.push({id:uid(),name:""});
   state.players[i].name=name;voiceFeedback("✓ "+name.toUpperCase(),"action");rerenderPlayerContext();return true
  }
 }

 // Spell
 m=n.match(/^(?:spell name|spell player|spell the name)$/);
 if(m){
  const p=state.players[state.players.length-1];
  if(p){renamePending={id:p.id,spell:true};voiceFeedback("SPELL THE NAME","heard");return true}
 }
 m=n.match(/^spell\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)$/);
 if(m){
  const p=state.players[spokenNumber(m[1])-1];
  if(p){renamePending={id:p.id,spell:true};voiceFeedback("SPELL THE NAME","heard");return true}
 }

 // Add. Accept several natural variants.
 m=raw.match(/^(?:please\s+)?add\s+(?:a\s+|another\s+)?player(?:\s+(?:named|called))?(?:\s+(.+))?$/i);
 if(!m)m=raw.match(/^add\s+(.+)$/i);
 if(!m)m=raw.match(/^player\s+(?:named|called)\s+(.+)$/i);
 if(!m)m=raw.match(/^put\s+(.+?)\s+in$/i);
 if(m){
  let name=(m[1]||"").trim();
  if(/^player$/i.test(name))name="";
  state.players.push({id:uid(),name});
  voiceFeedback(name?`✓ ${name.toUpperCase()}`:"✓ PLAYER ADDED","action");
  rerenderPlayerContext();return true
 }

 return false
}
function centralGameIntent(h){
 const n=norm(h);if(!state.game)return false;
 if((state.screen==="paused"||document.getElementById("pauseOverlay"))&&/^(quit|quit game|quit the game|end game|end the game|stop game|stop the game)$/.test(n)){
  return voiceOnce("pause-quit",()=>{voiceFeedback("✓ QUIT","action");confirmEnd()})
 }

 if(/^(exit game|exit the game|leave game|leave the game|save and leave|save game and leave|go home and save)$/.test(n)){
  return voiceOnce("exit-game",()=>{voiceFeedback("✓ EXIT GAME","action");leaveGame()})
 }
 if(/^(quit|quit game|quit the game|end game|end the game|stop game|stop the game)$/.test(n)){
  return voiceOnce("end-game",()=>{voiceFeedback("✓ END GAME","action");confirmEnd()})
 }
 if(/^(pause|pause game|pause the game|hold on)$/.test(n) && state.screen!=="paused"){
  return voiceOnce("pause",()=>{voiceFeedback("✓ PAUSE","action");pauseGame()})
 }
 if(state.screen==="paused" || document.getElementById("pauseOverlay")){
  if(/^(resume|resume game|continue game|keep playing|continue)$/.test(n)){
   return voiceOnce("resume",()=>{voiceFeedback("✓ RESUME","action");resumeGame()})
  }
 }
 return false
}
function centralQuestionIntent(h,isFinal=false,confidence=0){
 if(state.screen!=="question"||!state.game?.current||!answerListening||state.game.answered)return false;
 const n=norm(h);
 if(!isFinal){if(n)voiceDiagnostic("answer-attempt-rejected",{rawTranscript:h,isFinal:false,reason:"interim",questionSessionId,remaining:state.game.questionRemaining});return false}
 if(/^(skip|skip it|skip this one|skip question|next question)$/.test(n)){
  return voiceOnce("skip",()=>{state.game.lastOutcomeDetail="skip";voiceFeedback("✓ SKIP","action");finish("pass")})
 }
 if(/^(pass|i pass|pass this|ill pass|i ll pass|im passing|i m passing)$/.test(n)){
  return voiceOnce("pass",()=>{state.game.lastOutcomeDetail="pass";voiceFeedback("✓ PASS","action");finish("pass")})
 }
 const match=answerMatchTrace(h,state.game.current);
 if(match.accepted){
  const canonical=norm(state.game.current.a||"");
  return voiceOnce("answer:"+questionSessionId+":"+canonical,()=>{recordAnswerAttempt(h,true,confidence);voiceFeedback("✓ ANSWER","action");finish("correct")})
 }
 if(n&&n.split(" ").length<=16)return voiceOnce("attempt:"+questionSessionId+":"+n,()=>recordAnswerAttempt(h,false,confidence));
 voiceDiagnostic("answer-attempt-rejected",{rawTranscript:h,isFinal:true,reason:"non-answer-noise",questionSessionId,remaining:state.game.questionRemaining});return true
}
function recordAnswerAttempt(raw,correct,confidence=0){const g=state.game;if(state.screen!=="question"||!g||g.answered||!answerListening)return false;g.speechLog=g.speechLog||[];const q=g.current,match=answerMatchTrace(raw,q),attempt={rawTranscript:String(raw||""),normalizedTranscript:norm(raw),isFinal:true,attempt:g.speechLog.length+1,correct:!!correct,accepted:!!match.accepted,matchMethod:match.method,rejectionReason:match.reason||null,questionId:q?.id||null,canonicalAnswer:q?.a||"",acceptedEnglish:[...(q?.accept||[]),...(q?.aliases||[])],acceptedSpanish:[...(q?.es||[])],legacyAlts:[...(q?.alts||[])],heardPhonetic:match.heardPhonetic||phoneticKey(raw),canonicalPhonetic:match.canonicalPhonetic||phoneticKey(q?.a),remaining:g.questionRemaining,questionSessionId,listeningSessionId:runtimeSessionId,recognitionGeneration:voiceCore.generation,playerId:g.players[g.idx]?.id||null,confidence};g.speechLog.push(attempt);answerDiagnostics.push(attempt);if(answerDiagnostics.length>150)answerDiagnostics.shift();if(!correct){const feedback=document.getElementById("answerAttemptFeedback");if(feedback)feedback.textContent="TRY AGAIN"}return true}
function endConfirmIntent(h){
 const n=norm(h);
 const modal=document.querySelector(".modal,.confirm,.overlay");
 const yes=document.querySelector("[data-confirm-end],#confirmEnd,#endYes,.danger");
 const no=document.querySelector("[data-cancel-end],#cancelEnd,#endNo,#no");
 if(!modal)return false;
 if(/^(yes|confirm|do it|end game|exit|quit)$/.test(n)&&yes){return voiceOnce("confirm-end",()=>yes.click())}
 if(/^(no|cancel|go back|keep playing|resume)$/.test(n)&&no){return voiceOnce("cancel-end",()=>no.click())}
 return false
}
function routeVoiceCentral(h,{isFinal=false,confidence=0}={}){
 h=(h||"").trim();if(!h)return false;
 pendingTransitionCause={trigger:"voice",reason:h};
 if(!isFinal&&/^(back|go back|previous|previous screen)$/i.test(h)){voiceDiagnostic("command-rejected",{command:norm(h),reason:"back-final-only",screen:state.screen,session:runtimeSessionId});return false}
 voiceStatus(isFinal?`HEARD: ${h}`:`… ${h}`,isFinal?"heard":"listening");
 if(endConfirmIntent(h))return true;
 if(centralChampionIntent(h,isFinal))return true;

 // Highest priority commands first.
 if(centralExitIntent(h))return true;
 if(centralGameIntent(h))return true;

 // WHO'S IN owns complete player-data phrases before generic setup parsing.
 if(state.screen==="players" && isFinal){
  const key=commandKey(h),now=Date.now();
  if(lastPlayerVoiceMutation.key===key&&now-lastPlayerVoiceMutation.at<1000)return true;
  if(playersVoiceController(h)){lastPlayerVoiceMutation={key,at:now};return true}
 }

 // On unified Game Setup, named settings own the utterance before navigation.
 // Other setup screens retain their established navigation priority.
 if(state.screen==="setup"){
  if(centralSetupIntent(h))return true;
  if(centralNavIntent(h,isFinal,confidence))return true;
 }else{
  if(centralNavIntent(h,isFinal,confidence))return true;
  if(centralSetupIntent(h))return true;
 }

 // Keep the working question answer path unchanged in behavior.
 if(centralQuestionIntent(h,isFinal,confidence))return true;

 // Exact visible controls can fire quickly everywhere except player Add/Edit controls on interim speech.
 // Game Setup has multiple ON/OFF buttons. Bare toggle labels are ambiguous and
 // must never fall through to whichever matching DOM button happens to come first.
 const ambiguousSetupToggle=state.screen==="setup"&&/^(on|off)$/.test(norm(h));
 if(!ambiguousSetupToggle && (state.screen!=="players" || isFinal) && (state.screen!=="complete"||isFinal) && exactVisibleTarget(h))return true;
 if(ambiguousSetupToggle){voiceDiagnostic("command-rejected",{command:norm(h),reason:"ambiguous-setup-toggle-label",screen:state.screen,session:runtimeSessionId});return false}

 // Fuzzy control matching remains final-only.
 if(isFinal&&fuzzyVisibleTarget(h))return true;
 return false
}
function scheduleVoiceRestart(){
 if(!voiceCore.desired||!state.voiceOn||voiceCore.permissionBlocked||recognition||voiceCore.restart)return;
 const delays=[25,100,250,500,1000],delay=delays[Math.min(voiceCore.retryAttempt++,delays.length-1)];
 voiceCore.restart=setTimeout(()=>{
  voiceCore.restart=null;
  if(voiceCore.desired&&state.voiceOn&&!voiceCore.permissionBlocked&&!recognition)startVoice(voiceCore.ctx||state.screen)
 },delay)
}
function startVoice(ctx){
 voiceCore.ctx=ctx;
 if(hostSystem?.isSpeaking()){voiceCore.desired=!!state.voiceOn;return}
 if(!state.voiceOn||!speechSupported()){stopVoice();return}
 if(voiceCore.permissionBlocked){voiceCore.desired=false;return}
 voiceCore.desired=true;

 if(recognition){
  return
 }
 clearTimeout(voiceCore.restart);voiceCore.restart=null;

 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 const generation=++voiceCore.generation;
 voiceCore.handledInterimSlots.clear();
 try{
  const r=new SR();recognition=r;
  r.lang="en-US";
  r.interimResults=true;
  try{r.continuous=true}catch{}
  try{r.maxAlternatives=5}catch{}

  r.onstart=()=>{
   if(voiceCore.generation!==generation||recognition!==r)return;
   voiceCore.retryAttempt=0;voiceCore.currentUtterance=null;voiceDiagnostic("recognition-started",{generation});voiceStatus("MIC LISTENING","listening")
  };
  if(VOICE_LATENCY_MODE){
   r.onaudiostart=()=>voiceDiagnostic("audio-start",{generation});
   r.onsoundstart=()=>beginVoiceLatencyUtterance("sound-start");
   r.onspeechstart=()=>{if(!voiceCore.currentUtterance)beginVoiceLatencyUtterance("speech-start");else voiceDiagnostic("speech-start")};
   r.onspeechend=()=>voiceDiagnostic("speech-end");
   r.onsoundend=()=>voiceDiagnostic("sound-end");
   r.onaudioend=()=>voiceDiagnostic("audio-end",{generation})
  }

  r.onresult=e=>{
   if(voiceCore.generation!==generation||recognition!==r)return;
   if(VOICE_LATENCY_MODE&&!voiceCore.currentUtterance)beginVoiceLatencyUtterance("first-result-activity");
   if(!e?.results||e.resultIndex>=e.results.length){voiceDiagnostic("no-transcript",{reason:"empty-result-event"});return}
   for(let i=e.resultIndex;i<e.results.length;i++){
    const res=e.results[i];
    if(!res)continue;
    let handled=false;

    if(res.isFinal&&voiceCore.handledInterimSlots.has(i)){
     voiceCore.handledInterimSlots.delete(i);
     voiceDiagnostic("command-rejected",{reason:"final-after-handled-interim",resultIndex:i});
     if(VOICE_LATENCY_MODE)voiceCore.currentUtterance=null;
     continue
    }

    for(let a=0;a<Math.min(res.length,5);a++){
     const alt=res[a],text=(alt?.transcript||"").trim();
     if(!text)continue;
     const confidence=Number.isFinite(alt.confidence)?alt.confidence:0;
     voiceDiagnostic("transcript-received",{text,confidence,isFinal:!!res.isFinal,resultIndex:i,alternative:a});
     const firstStage=res.isFinal?"first-final-transcript":"first-interim-transcript";
     if(a===0&&!voiceCore.latencySeen.has(firstStage)){voiceCore.latencySeen.add(firstStage);voiceDiagnostic(firstStage,{text,confidence,resultIndex:i})}

     if(!res.isFinal){
      const n=norm(text);
      const fastControl=/^(continue|next|done|go ahead|go on|move on|lets go|let s go|im ready|i m ready|start|begin|back|go back|exit|exit game|leave game|cancel game|quit setup|go home|pause|resume|quit|quit game|end game|stop game|pass|skip|select all|clear all|kids|easy|medium|hard|savage)$/;
      const setupFast=["home","setup","mode","industry","difficulty","fun","players","time","ready","paused"].includes(state.screen);
      if(fastControl.test(n)||setupFast||state.screen==="question"){
       if(routeVoiceCentral(text,{isFinal:false,confidence})){handled=true;break}
      }
     }else{
      if(routeVoiceCentral(text,{isFinal:true,confidence})){handled=true;break}
     }
    }
    if(handled&&!res.isFinal)voiceCore.handledInterimSlots.add(i);
    if(!handled&&res.isFinal)voiceDiagnostic("command-rejected",{reason:"no-command-match",resultIndex:i});
    if(res.isFinal&&VOICE_LATENCY_MODE)voiceCore.currentUtterance=null;
    if(handled)break
   }
  };

  r.onerror=e=>{
   if(voiceCore.generation!==generation||recognition!==r)return;
   const err=e?.error||"";
   voiceDiagnostic("recognition-error",{generation,error:err});
   if(err==="not-allowed"||err==="service-not-allowed"){
    voiceCore.permissionBlocked=true;voiceCore.desired=false;
    clearTimeout(voiceCore.restart);voiceCore.restart=null;
    voiceStatus("MIC PERMISSION NEEDED","error")
   }
   else if(err!=="aborted"&&err!=="no-speech")voiceStatus("MIC LISTENING","listening")
  };

  r.onend=()=>{
   if(voiceCore.generation!==generation||recognition!==r)return;
   voiceDiagnostic("recognition-ended",{generation});recognition=null;scheduleVoiceRestart()
  };

  r.start()
 }catch{
  if(voiceCore.generation!==generation)return;
  recognition=null;scheduleVoiceRestart()
 }
}
function phoneticKey(s){
 return norm(String(s||"").normalize("NFKD").replace(/\p{M}/gu,"")).replace(/[^a-z0-9 ]/g,"").split(/\s+/).map(w=>w
  .replace(/^kn/,"n").replace(/^wr/,"r").replace(/^ph/,"f")
  .replace(/tion/g,"shun").replace(/ght/g,"t").replace(/ck/g,"k")
  .replace(/[aeiouy]+/g,"a").replace(/(.)\1+/g,"$1")).join(" ")
}
function properNamePronunciationMatch(heard,target){
 const hs=norm(heard).split(" ").filter(Boolean),ts=norm(target).split(" ").filter(Boolean);if(ts.length<2||hs.length!==ts.length)return false;
 const scores=ts.map((token,i)=>{const heardToken=hs[i],plain=editSimilarity(heardToken,token),phonetic=editSimilarity(phoneticKey(heardToken),phoneticKey(token));return Math.max(plain,phonetic)});
 return scores.every((score,i)=>score>=(i===scores.length-1 ? .8 : .72))&&editSimilarity(phoneticKey(heard),phoneticKey(target))>=.78
}
const SAFE_CONCEPT_EQUIVALENTS=[
 ["car","automobile"],["television","tv"],["united states","united states of america","usa","us","u s"],["world war two","world war 2","world war ii","second world war","wwii"],["new york city","nyc"]
].map(group=>new Set(group.map(norm)));
function genericConceptEquivalent(a,b){a=norm(a);b=norm(b);return SAFE_CONCEPT_EQUIVALENTS.some(group=>group.has(a)&&group.has(b))}
function safeWordFormEquivalent(a,b){a=norm(a);b=norm(b);if(!a||!b||a.includes(" ")||b.includes(" "))return false;const singular=x=>x.length>4&&x.endsWith("ies")?x.slice(0,-3)+"y":x.length>4&&/(?:ches|shes|xes|zes|ses)$/.test(x)?x.slice(0,-2):x.length>3&&x.endsWith("s")&&!x.endsWith("ss")?x.slice(0,-1):x;return singular(a)===singular(b)&&Math.min(a.length,b.length)>=4}
function editSimilarity(a,b){
 a=norm(a);b=norm(b);if(a===b)return 1;if(!a||!b)return 0;
 const dp=Array.from({length:b.length+1},(_,j)=>j);
 for(let i=1;i<=a.length;i++){let prev=dp[0];dp[0]=i;for(let j=1;j<=b.length;j++){const old=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}
 return 1-dp[b.length]/Math.max(a.length,b.length)
}
function answerMatchTrace(h,q){
 if(!q)return{accepted:false,method:"no-question",reason:"no-current-question"};
 const answerNorm=value=>String(value||"").toLocaleLowerCase().normalize("NFKD").replace(/\p{M}/gu,"").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
 const stripSafeArticle=value=>answerNorm(value).replace(/^(?:the|a|an|el|la|los|las|un|una)\s+/,"");
 const heard=answerNorm(h).replace(/^(?:the answer is|my answer is|i think it is|i think it s)\s+/,""),heardCore=stripSafeArticle(heard);
 const entries=[{value:q.a,source:"canonical"},...(q.accept||[]).map(value=>({value,source:"accepted-english"})),...(q.aliases||[]).map(value=>({value,source:"legacy-alias"})),...(q.alts||[]).map(value=>({value,source:"legacy-alt"})),...(q.es||[]).map(value=>({value,source:"accepted-spanish"})),...(q.equivalents||[]).map(value=>({value,source:"concept-equivalent"}))].filter(x=>x.value).map(entry=>({...entry,target:answerNorm(entry.value),targetCore:stripSafeArticle(entry.value)}));
 for(const {value:ans,source,target,targetCore} of entries)if(heard===target||heardCore===targetCore)return{accepted:true,method:source==="canonical"?"exact-canonical":source,matched:ans,heard,heardCore,target,targetCore};
 for(const {value:ans,source,target,targetCore} of entries){
  if(genericConceptEquivalent(heardCore,targetCore))return{accepted:true,method:"generic-safe-equivalence",matched:ans,heard,heardCore,target,targetCore};
  if(safeWordFormEquivalent(heardCore,targetCore))return{accepted:true,method:"safe-word-form",matched:ans,heard,heardCore,target,targetCore};
  if(targetCore.length>=7&&Math.abs(heardCore.length-targetCore.length)<=1&&editSimilarity(heardCore,targetCore)>=.88)return{accepted:true,method:"normalization-edit",matched:ans,heard,heardCore,target,targetCore};
  const hp=phoneticKey(heardCore),tp=phoneticKey(targetCore);
  if(targetCore.length>=7&&hp===tp)return{accepted:true,method:"phonetic-exact",matched:ans,heard,heardCore,target,targetCore,heardPhonetic:hp,targetPhonetic:tp};
  if(properNamePronunciationMatch(heardCore,targetCore))return{accepted:true,method:"proper-name-phonetic",matched:ans,heard,heardCore,target,targetCore,heardPhonetic:hp,targetPhonetic:tp};
 }
 return{accepted:false,method:"rejected",reason:"no-controlled-concept-or-identity-match",heard,heardCore,heardPhonetic:phoneticKey(heardCore),canonical:answerNorm(q.a),canonicalPhonetic:phoneticKey(q.a),acceptedEnglish:[...(q.accept||[]),...(q.aliases||[])],acceptedSpanish:[...(q.es||[])],conceptEquivalents:[...(q.equivalents||[])],legacyAlts:[...(q.alts||[])]}
}
function accepted(h,q){return answerMatchTrace(h,q).accepted}
function spokenLetters(s){
 const map={ay:"a",bee:"b",see:"c",sea:"c",dee:"d",eff:"f",gee:"g",aitch:"h",eye:"i",jay:"j",kay:"k",el:"l",em:"m",en:"n",oh:"o",pee:"p",cue:"q",are:"r",ess:"s",tee:"t",you:"u",vee:"v",doubleyou:"w",ex:"x",why:"y",zee:"z",zed:"z"};
 const p=norm(s).split(" ");let out="";for(const x of p){if(x.length===1)out+=x;else if(map[x])out+=map[x];else return""}return out
}
function setVolume(v,announce=false){state.volume=Math.max(0,Math.min(1,Number(v)||0));if(state.volume>0)lastVolume=state.volume;localStorage.setItem(STORAGE.volume,String(state.volume));const e=document.getElementById("vol");if(e)e.value=state.volume;const p=document.getElementById("volPct");if(p)p.textContent=Math.round(state.volume*100)+"%";const pe=document.getElementById("pauseVol");if(pe)pe.value=state.volume;const pp=document.getElementById("pauseVolPct");if(pp)pp.textContent=Math.round(state.volume*100)+"%";GameAudio.setVolume(state.volume);hostSystem?.provider?.setVolume?.(state.volume);applyVolume();if(["setup","players"].includes(state.screen))saveSetupState(state.screen);if(announce)voiceFeedback(state.volume===0?"✓ MUTED":"✓ VOLUME "+Math.round(state.volume*100),"action")}
function saveActiveGame(){
 if(!state.game){localStorage.removeItem(STORAGE.activeGame);return}
 try{
  const payload={
   version:1,
   savedAt:Date.now(),
   mode:state.mode,quick:state.quick,duration:state.duration,
   questionSeconds:state.questionSeconds,categories:state.categories||[],
   industry:state.industry||"",difficulty:state.difficulty||"medium",answerLanguage:state.answerLanguage||"en",readQuestions:state.readQuestions!==false,players:state.players,game:state.game
  };
  localStorage.setItem(STORAGE.activeGame,JSON.stringify(payload))
 }catch{}
}
function setupPayload(screen=state.screen,resumable=false){return{version:2,kind:"setup",resumable:!!resumable,savedAt:Date.now(),screen:["setup","players"].includes(screen)?screen:"setup",mode:state.mode,quick:!!state.quick,duration:state.duration,questionSeconds:state.questionSeconds,categories:state.categories||[],industry:state.industry||"",difficulty:state.difficulty||"medium",answerLanguage:state.answerLanguage||"en",voiceOn:!!state.voiceOn,volume:state.volume,readQuestions:state.readQuestions!==false,players:state.players.map(p=>({id:p.id||uid(),name:String(p.name||""),hostStyle:["masculine","feminine","neutral"].includes(p.hostStyle)?p.hostStyle:"neutral"}))}}
function saveSetupState(screen=state.screen){if(state.game||!["setup","players"].includes(screen))return;try{const previous=loadSetupState();localStorage.setItem(STORAGE.setup,JSON.stringify(setupPayload(screen,previous?.resumable===true)))}catch{}}
function markSetupAbandoned(screen=state.screen){if(state.game||!["setup","players"].includes(screen))return;try{localStorage.setItem(STORAGE.setup,JSON.stringify(setupPayload(screen,true)))}catch{}}
function loadSetupState(){try{const x=JSON.parse(localStorage.getItem(STORAGE.setup)||"null");return x?.kind==="setup"?x:null}catch{return null}}
function hasResumableSetup(){const x=loadSetupState();return !!(x&&x.version===2&&x.resumable===true&&["setup","players"].includes(x.screen)&&Array.isArray(x.players))}
function clearSetupState(){localStorage.removeItem(STORAGE.setup)}
function loadActiveGame(){
 try{return JSON.parse(localStorage.getItem(STORAGE.activeGame)||"null")}catch{return null}
}
function hasActiveGame(){const x=loadActiveGame();return !!(x&&x.game&&Array.isArray(x.game.players)&&x.game.players.length)}
function hasSavedSession(){return hasActiveGame()||hasResumableSetup()}
function clearActiveGame(){localStorage.removeItem(STORAGE.activeGame)}
function resumeSavedGame(){
 const x=loadActiveGame();if(!x||!x.game){const setupSave=loadSetupState();if(!setupSave?.resumable){clearActiveGame();clearSetupState();home();return}state.mode=setupSave.mode||"original";state.quick=!!setupSave.quick;state.duration=setupSave.duration||15;state.questionSeconds=setupSave.questionSeconds||15;state.categories=setupSave.categories||[];state.industry=setupSave.industry||"";state.difficulty=setupSave.difficulty||"medium";state.answerLanguage=setupSave.answerLanguage||"en";state.voiceOn=setupSave.voiceOn!==false;state.volume=Number.isFinite(Number(setupSave.volume))?Number(setupSave.volume):.65;state.readQuestions=setupSave.readQuestions!==false;state.players=Array.isArray(setupSave.players)?setupSave.players:[];state.game=null;localStorage.setItem(STORAGE.voice,String(state.voiceOn));localStorage.setItem(STORAGE.volume,String(state.volume));localStorage.setItem(STORAGE.readQuestions,String(state.readQuestions));if(state.volume>0)localStorage.setItem(STORAGE.lastVolume,String(state.volume));enterScreen(setupSave.screen==="players"&&state.mode!=="solo"?"players":"setup","resume-setup");render();return}
 state.mode=x.mode||"friends";state.quick=!!x.quick;state.duration=x.duration||10;
 state.questionSeconds=x.questionSeconds||15;state.categories=x.categories||[];
 state.industry=x.industry||"";state.difficulty=x.difficulty||"medium";state.answerLanguage=x.answerLanguage||"en";state.readQuestions=x.readQuestions!==false;state.players=x.players||[];
 state.game=x.game;
 // Resume cleanly at the beginning of the saved player's turn.
 const alive=state.game.players.filter(p=>!p.eliminated);
 if(!alive.length){clearActiveGame();home();return}
 handoff()
}
function primaryAction(){
 switch(state.screen){
  case "home": chooseGame(); return true;
  case "setup": startUnifiedGame(); return true;
  case "mode": return false;
  case "industry": industryContinue(); return true;
  case "difficulty": nextAfterDifficulty(); return true;
  case "fun": funContinue(); return true;
  case "players":
   playersContinue();return true;
  case "time": go("ready"); return true;
  case "ready": return false;
  case "paused": resumeGame(); return true;
  default:return false;
 }
}
let navLock=false;
function go(s,reason="setup-navigation"){
 if(navLock)return;
 navLock=true;clearRuntime();const session=enterScreen(s,reason);render();
 setTimeout(()=>{if(runtimeSessionId!==session){navLock=false;voiceCore.navQueued=null;return}navLock=false;const queued=voiceCore.navQueued;voiceCore.navQueued=null;if(queued&&queued.screen===state.screen&&queued.session===runtimeSessionId)routeVoiceCentral(queued.h,{isFinal:queued.isFinal,confidence:queued.confidence});else if(queued)voiceDiagnostic("command-rejected",{command:norm(queued.h),reason:"stale-navigation-context",fromScreen:queued.screen,currentScreen:state.screen})},220)
}
function back(){
 const m={setup:"home",mode:"home",industry:"mode",difficulty:"mode",fun:"difficulty",players:"setup",time:state.mode==="solo"?"difficulty":"players",ready:state.mode==="solo"?"setup":"players"};
 const target=m[state.screen]||"home";if(target==="home"&&isSetupScreen())markSetupAbandoned(state.screen);go(target,"back-one-screen")
}
function home(){
 if(state.screen!=="home")enterScreen("home","home-cleanup");
 hostSystem?.cancel("home");GameAudio.stopAll();state.screen="home";app.innerHTML=shell("",`<div class="hero"><div class="logo">LAST ONE<br>STANDING</div><div class="tagline">THINK FAST. STAY IN THE GAME.<br><strong>3 STRIKES AND YOU’RE OUT.</strong></div><div class="build-badge">BUILD 6.18</div></div><div class="actions">${hasSavedSession()?`<button id="resumeSaved" class="btn primary large">RESUME GAME</button>`:""}<button id="start" class="btn ${hasSavedSession()?"":"primary"} large">START</button></div>`);
 document.getElementById("start").onclick=chooseGame;const rs=document.getElementById("resumeSaved");if(rs)rs.onclick=resumeSavedGame;startVoice("home")
}
function chooseGame(){ensureAudio();clearSetupState();go("setup","home-start")}
function ensureUnifiedRoster(){
 if(!state.players.length)state.players=[{id:uid(),name:"Vicente"},{id:uid(),name:"Todd"},{id:uid(),name:"Maria"}];
 state.players=state.players.map(p=>({id:p.id||uid(),name:String(p.name||""),hostStyle:["masculine","feminine","neutral"].includes(p.hostStyle)?p.hostStyle:"neutral"}));state.selectedIds=state.players.filter(p=>p.name.trim()).map(p=>p.id)
}
function setupSection(title,body,extra=""){return `<section class="setup-card card ${extra}" data-setup-section="${title.toLowerCase().replace(/\s+/g,"-")}" tabindex="-1"><div class="setup-label">${title}</div>${body}</section>`}
function setup(){
 ensureUnifiedRoster();const renderId=++setupRenderId,live=fn=>()=>{if(state.screen==="setup"&&renderId===setupRenderId)fn()};
 const modes=[["original","ORIGINAL"],["work","WORK EDITION"],["solo","SOLO"]].map(([id,label])=>`<button class="btn setup-choice ${state.mode===id?"selected":""}" data-setup-mode="${id}" aria-pressed="${state.mode===id}">${label}</button>`).join("");
 const difficulties=DIFFICULTIES.filter(d=>d.id!=="kids").map(d=>`<button class="btn setup-choice ${state.difficulty===d.id?"selected":""}" data-setup-difficulty="${d.id}" aria-pressed="${state.difficulty===d.id}">${d.label}</button>`).join("");
 const answerTimes=[10,15,20,30].map(s=>`<button class="btn setup-choice ${state.questionSeconds===s?"selected":""}" data-setup-seconds="${s}" aria-pressed="${state.questionSeconds===s}">${s} SEC</button>`).join("");
 const lengths=[5,10,15,20].map(m=>`<button class="btn setup-choice ${state.duration===m?"selected":""}" data-setup-minutes="${m}" aria-pressed="${state.duration===m}">${m} MIN</button>`).join("");
 app.innerHTML=shell("GAME SETUP",`<div class="unified-setup"><div class="unified-setup-heading">GAME SETUP</div><div id="setupError" class="setup-error" role="alert" aria-live="assertive"></div><div class="unified-setup-grid">${setupSection("GAME MODE",`<div class="setup-options setup-game-options">${modes}</div>`,"setup-game-row")}${setupSection("DIFFICULTY",`<div class="setup-options">${difficulties}</div>`,"setup-middle-row")}${setupSection("ANSWER TIME",`<div class="setup-options">${answerTimes}</div>`,"setup-middle-row")}${setupSection("GAME LENGTH",`<div class="setup-options">${lengths}</div>`,"setup-middle-row")}${setupSection("VOICE",`<div class="setup-options"><button id="setupVoiceOn" class="btn setup-choice ${state.voiceOn?"selected":""}" aria-pressed="${state.voiceOn}">ON</button><button id="setupVoiceOff" class="btn setup-choice ${!state.voiceOn?"selected":""}" aria-pressed="${!state.voiceOn}">OFF</button></div>`,"setup-bottom-row")}${setupSection("VOLUME",`<div class="volume-wrap"><input id="vol" type="range" min="0" max="1" step=".05" value="${state.volume}" aria-label="Game volume"><strong id="volPct">${Math.round(state.volume*100)}%</strong></div>`,"setup-bottom-row")}${setupSection("READ QUESTIONS",`<div class="setup-options"><button id="readQuestionsOn" class="btn setup-choice ${state.readQuestions?"selected":""}" aria-pressed="${state.readQuestions}">ON</button><button id="readQuestionsOff" class="btn setup-choice ${!state.readQuestions?"selected":""}" aria-pressed="${!state.readQuestions}">OFF</button></div>`,"setup-bottom-row")}</div></div>`,`<button id="startGame" class="btn primary large" data-voice="CONTINUE" data-voice-aliases="start game">CONTINUE</button>`);
 document.querySelectorAll("[data-setup-mode]").forEach(b=>b.onclick=live(()=>setUnifiedMode(b.dataset.setupMode)));
 document.querySelectorAll("[data-setup-difficulty]").forEach(b=>b.onclick=live(()=>{state.difficulty=b.dataset.setupDifficulty;setup()}));
 document.querySelectorAll("[data-setup-seconds]").forEach(b=>b.onclick=live(()=>{state.questionSeconds=Number(b.dataset.setupSeconds);setup()}));
 document.querySelectorAll("[data-setup-minutes]").forEach(b=>b.onclick=live(()=>{state.duration=Number(b.dataset.setupMinutes);state.quick=false;setup()}));
 document.getElementById("setupVoiceOn").onclick=()=>setSetupVoice(true);document.getElementById("setupVoiceOff").onclick=()=>setSetupVoice(false);
 document.getElementById("readQuestionsOn").onclick=()=>setReadQuestions(true);document.getElementById("readQuestionsOff").onclick=()=>setReadQuestions(false);
 document.getElementById("vol").oninput=e=>{if(renderId===setupRenderId){setVolume(Number(e.target.value));saveSetupState("setup")}};document.getElementById("startGame").onclick=live(startUnifiedGame);saveSetupState("setup");startVoice("setup")
}
function setUnifiedMode(mode){if(!["original","work","solo"].includes(mode))return;state.mode=mode;state.quick=false;state.categories=[];state.industry="";setup()}
function setSetupVoice(on){state.voiceOn=!!on;voiceCore.permissionBlocked=on?false:voiceCore.permissionBlocked;voiceCore.retryAttempt=0;save();if(!on)stopVoice();setup()}
function setupSettingDiagnostic(raw,matchedIntent,matchedSetting,oldValue,newValue,parserBranch,rejectedSecondaryMatches){voiceDiagnostic("setup-setting-command",{rawTranscript:String(raw||""),normalizedTranscript:norm(raw),matchedIntent,matchedSetting,oldValue,newValue,parserBranch,parserStopped:true,rejectedSecondaryMatches,screen:state.screen,session:runtimeSessionId})}
function setSetupVoiceVoice(on,raw){const oldValue=state.voiceOn;setSetupVoice(on);setupSettingDiagnostic(raw,"voice", "voiceOn",oldValue,state.voiceOn,"named-voice-toggle",["volume","other-setup","navigation"])}
function setReadQuestions(on){state.readQuestions=!!on;localStorage.setItem(STORAGE.readQuestions,String(state.readQuestions));saveSetupState("setup");setup()}
function setReadQuestionsVoice(on,raw){const oldValue=state.readQuestions;setReadQuestions(on);setupSettingDiagnostic(raw,"read-questions","readQuestions",oldValue,state.readQuestions,"named-read-questions-toggle",["voice","volume","other-setup","navigation"])}
function setupError(message,section,selector){const box=document.getElementById("setupError");if(box)box.textContent=message;const target=document.querySelector(selector||`[data-setup-section="${section}"]`);target?.focus();target?.scrollIntoView?.({block:"nearest"});return false}
function startUnifiedGame(){
 if(state.screen!=="setup")return false;
 if(!["original","work","solo"].includes(state.mode))return setupError("CHOOSE ORIGINAL, WORK EDITION, OR SOLO.","game");
 if(!["easy","medium","hard","savage"].includes(state.difficulty))return setupError("CHOOSE A DIFFICULTY.","difficulty");
 if(![10,15,20,30].includes(Number(state.questionSeconds)))return setupError("CHOOSE AN ANSWER TIME.","answer-time");
 if(![5,10,15,20].includes(Number(state.duration)))return setupError("CHOOSE A GAME LENGTH.","game-length");
 if(state.mode!=="solo"){go("players","game-setup-continue");return true}
 rememberNames();go("ready","game-setup-continue");return true
}
function rerenderPlayerContext(){if(state.screen==="setup")setup();else players()}
function mode(){
 app.innerHTML=shell("CHOOSE YOUR GAME",`<div class="grid"><button class="btn option primary" data-mode="original" data-voice="ORIGINAL" data-voice-aliases="original game|friends|family|quick game">ORIGINAL</button><button class="btn option" data-mode="work" data-voice="WORK EDITION" data-voice-aliases="work|work game">WORK EDITION</button><button class="btn option" data-mode="solo" data-voice="SOLO" data-voice-aliases="solo game|one player|1 player">SOLO</button></div>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>selectMode(b.dataset.mode));startVoice("mode")
}
function selectMode(mode){
 state.mode=mode;state.quick=false;state.categories=[];state.industry="";
 if(mode==="solo"){
  const existing=state.players.find(p=>(p.name||"").trim());
  state.players=[existing?{...existing}:{id:uid(),name:"SOLO PLAYER"}]
 }
 go("difficulty")
}
function nextAfterDifficulty(){go(state.mode==="solo"?"time":"players")}
function industryContinue(){
 if(!state.industry){voiceFeedback("CHOOSE AN INDUSTRY","error");return}
 voiceFeedback("✓ CONTINUE","action");go("difficulty")
}
function industry(){
 const selected=state.industry||"";
 const cards=WORK_INDUSTRIES.map(name=>`<button class="btn industry-choice ${selected===name?"selected":""}" data-industry="${esc(name)}">${esc(name)}</button>`).join("");
 app.innerHTML=shell("CHOOSE YOUR INDUSTRY",
   `<div class="category-intro">WORK MODE</div>
    <div class="industry-grid">${cards}</div>
    <div class="subtle center">Tap an industry or just say its name.</div>`,
   `<button id="back" class="btn">BACK</button><button class="btn setup-exit-bottom" data-setup-exit data-voice="EXIT" data-voice-aliases="exit game|leave game|cancel game|quit setup|go home|back to home">EXIT</button><button id="cont" class="btn primary" data-voice="CONTINUE" data-voice-aliases="next|done|go ahead|go on|move on|lets go|im ready|start|begin">CONTINUE</button>`);
 document.querySelectorAll("[data-industry]").forEach(b=>b.onclick=()=>{state.industry=b.dataset.industry;industry()});
 document.getElementById("back").onclick=()=>go("mode");
 document.getElementById("cont").onclick=()=>{if(state.screen==="industry")industryContinue()};
 bindSetupShell();startVoice("industry");
}
function difficulty(){
 const cards=DIFFICULTIES.map(d=>`<button class="btn difficulty-choice ${state.difficulty===d.id?"selected":""}" data-difficulty="${d.id}" aria-pressed="${state.difficulty===d.id}">${d.label}</button>`).join("");
 app.innerHTML=shell("CHOOSE YOUR LEVEL",
  `<div class="category-intro">HOW HARD DO YOU WANT IT?</div>
   <div class="difficulty-grid">${cards}</div>
   <div class="subtle center">Medium is the default. Say Kids, Easy, Medium, Hard, or Savage.</div>`,
  `<button id="back" class="btn">BACK</button><button class="btn setup-exit-bottom" data-setup-exit data-voice="EXIT" data-voice-aliases="exit game|leave game|cancel game|quit setup|go home|back to home">EXIT</button><button id="cont" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-difficulty]").forEach(b=>b.onclick=()=>{state.difficulty=b.dataset.difficulty;difficulty()});
 document.getElementById("back").onclick=()=>go("mode");
 document.getElementById("cont").onclick=()=>{if(state.screen==="difficulty")nextAfterDifficulty()};
 bindSetupShell();startVoice("difficulty")
}
function funContinue(){
 voiceFeedback("✓ CONTINUE","action");
 go("players");
}
function setCategorySelected(name,selected){
 const set=new Set(state.categories||[]);
 if(selected)set.add(name);else set.delete(name);
 state.categories=[...set];fun()
}
function fun(){
 const selected=new Set(state.categories||[]);
 const cards=EXTRA_CATEGORIES.map(name=>`<button class="btn category-choice ${selected.has(name)?"selected":""}" data-cat="${esc(name)}" data-voice="${esc(name)}">${esc(name)}</button>`).join("");
 app.innerHTML=shell("",
   `<div class="extra-category-title">MIX IN EXTRA CATEGORIES</div>
    <div class="category-master"><button id="selectAllCats" class="btn primary" data-voice="${selected.size===EXTRA_CATEGORIES.length?"CLEAR ALL":"SELECT ALL"}" data-voice-aliases="${selected.size===EXTRA_CATEGORIES.length?"clear categories|remove all categories":"all categories|choose all|give me everything"}">${selected.size===EXTRA_CATEGORIES.length?"CLEAR ALL":"SELECT ALL"}</button></div>
    <div class="category-grid">${cards}</div>
    <div class="subtle center">Pick as many as you want, or say “Skip.” You can also say “Add Music,” “Add Sports,” or “Remove Geography.”</div>`,
   `<button id="skip" class="btn">SKIP</button><button id="cont" class="btn primary" data-voice="CONTINUE" data-voice-aliases="next|done|go ahead|lets go|im done|thats it|start|begin|im ready">CONTINUE</button>`);
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{
   const name=b.dataset.cat;
   setCategorySelected(name,!(state.categories||[]).includes(name))
 });
 const allBtn=document.getElementById("selectAllCats");
 allBtn.onclick=()=>{state.categories=state.categories.length===EXTRA_CATEGORIES.length?[]:[...EXTRA_CATEGORIES];fun()};

 document.getElementById("skip").onclick=()=>{state.categories=[];go("players")};
 document.getElementById("cont").onclick=()=>{if(state.screen==="fun")funContinue()};
 bindSetupShell();startVoice("fun")
}
function playersContinue(){
 state.players=state.players.filter(p=>(p.name||"").trim());
 const min=state.mode==="solo"?1:2;
 if(state.players.length<min){voiceFeedback("ADD PLAYER NAMES","error");const msg=document.getElementById("rosterError");if(msg)msg.textContent=state.mode==="solo"?"ADD A PLAYER NAME TO CONTINUE":"ADD AT LEAST TWO NAMED PLAYERS TO CONTINUE";return}
 const names=state.players.map(p=>norm(p.name));
 if(new Set(names).size!==names.length){const msg=document.getElementById("rosterError");if(msg)msg.textContent="PLAYER NAMES MUST BE UNIQUE";return}
 rememberNames();go("ready","players-continue")
}
function players(){
 ensurePlayers();const list=state.players.map((p,i)=>`<div class="player-row"><div class="player-num">PLAYER ${i+1}</div><input data-p="${p.id}" value="${esc(p.name)}" placeholder="Name" aria-label="Player ${i+1} name"><button class="btn" data-remove="${p.id}" aria-label="Delete contestant ${i+1}">×</button></div>`).join("");
 app.innerHTML=shell("WHO’S IN?",`<div class="players-list">${list}</div><div id="rosterError" class="roster-error"></div><button id="add" class="btn">ADD PLAYER</button><div class="subtle center">Try: “Player 1 Joe,” “Change player 2 to Tom,” “Spell player 2,” or “Add player Maria.”</div>`,`<button id="back" class="btn">BACK</button><button class="btn setup-exit-bottom" data-setup-exit data-voice="EXIT" data-voice-aliases="exit game|leave game|cancel game|quit setup|go home|back to home">EXIT</button><button id="continue" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-p]").forEach(e=>{const p=state.players.find(x=>x.id===e.dataset.p),row=e.closest(".player-row"),label=document.createElement("label");label.className="host-style-label";label.innerHTML=`<span>HOST STYLE</span><select data-host-style="${p.id}" aria-label="Player ${state.players.indexOf(p)+1} Host style"><option value="neutral">NEUTRAL</option><option value="masculine">MASCULINE</option><option value="feminine">FEMININE</option></select>`;const select=label.querySelector("select");select.value=p.hostStyle||"neutral";row.insertBefore(label,row.querySelector("[data-remove]"));e.oninput=()=>{p.name=e.value;saveSetupState("players")}});
 document.querySelectorAll("[data-host-style]").forEach(e=>e.onchange=()=>{const p=state.players.find(x=>x.id===e.dataset.hostStyle);if(p)p.hostStyle=e.value;saveSetupState("players")});
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.players=state.players.filter(p=>p.id!==b.dataset.remove);players()});
 document.getElementById("add").onclick=e=>{e.currentTarget.onclick=null;state.players.push({id:uid(),name:""});players()};document.getElementById("back").onclick=back;
 document.getElementById("continue").onclick=()=>{if(state.screen==="players")playersContinue()};bindSetupShell();saveSetupState("players");startVoice("players")
}
function adjustGameVolume(delta){setVolume((state.volume??0.8)+delta,true)}
function setGameDuration(minutes){state.quick=false;state.duration=minutes;if(state.screen==="setup")setup();else time()}
function applyVolume(){
 // Audio helpers read state.volume; keep any media elements synced too.
 document.querySelectorAll("audio,video").forEach(el=>{try{el.volume=state.volume??0.8}catch{}})
}
function time(){
 app.innerHTML=shell("GAME SETTINGS",`<div class="grid game-time-grid"><div class="card center game-time-card"><div class="game-time-label">ANSWER TIME</div><div class="actions" style="margin-top:10px">${[10,15,20,30].map(s=>`<button class="btn ${state.questionSeconds===s?"selected":""}" data-sec="${s}" aria-pressed="${state.questionSeconds===s}">${s} SEC</button>`).join("")}</div></div><div class="card center game-time-card"><div class="game-time-label">GAME LENGTH</div><div class="actions" style="margin-top:10px">${[5,10,15,20].map(m=>`<button class="btn ${state.duration===m?"selected":""}" data-min="${m}" aria-pressed="${state.duration===m}">${m} MIN</button>`).join("")}</div></div></div><div class="settings-utilities"><div class="volume-wrap"><span>VOLUME</span><input id="vol" type="range" min="0" max="1" step=".05" value="${state.volume}" aria-label="Game volume"><strong id="volPct">${Math.round(state.volume*100)}%</strong></div><div class="actions"><button id="voiceOn" class="btn ${state.voiceOn?"selected":""}" aria-pressed="${state.voiceOn}">VOICE ON</button><button id="voiceOff" class="btn ${!state.voiceOn?"selected":""}" aria-pressed="${!state.voiceOn}">VOICE OFF</button></div></div>`,`<button id="back" class="btn">BACK</button><button class="btn setup-exit-bottom" data-setup-exit data-voice="EXIT" data-voice-aliases="exit game|leave game|cancel game|quit setup|go home|back to home">EXIT</button><button id="continue" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{state.questionSeconds=Number(b.dataset.sec);time()});document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>setGameDuration(Number(b.dataset.min)));
 document.getElementById("vol").oninput=e=>setVolume(Number(e.target.value));document.getElementById("voiceOn").onclick=()=>{voiceCore.permissionBlocked=false;voiceCore.retryAttempt=0;state.voiceOn=true;save();time()};document.getElementById("voiceOff").onclick=()=>{state.voiceOn=false;save();stopVoice();time()};document.getElementById("back").onclick=back;document.getElementById("continue").onclick=()=>{if(state.screen==="time")go("ready")};bindSetupShell();startVoice("time")
}
function ready(){
 const ps=selectedPlayers(),names=ps.map(p=>p.name).filter(Boolean),spokenPlayers=names.length<=4?names.join(", "):names.slice(0,3).join(", ")+`, and ${names.length-3} more contenders`;
 app.innerHTML=shell("LAST ONE STANDING",`<div class="card center ready-card showtime-card"><div class="showtime-kicker">IT’S SHOWTIME</div><div class="ready-player-names">${names.map(esc).join(" · ")}</div><div class="compact-ready">${state.mode==="work"?"WORK EDITION":state.mode==="solo"?"SOLO":"ORIGINAL"} · ${state.difficulty.toUpperCase()} · ${state.questionSeconds} SEC · ${state.voiceOn?"VOICE ON":"VOICE OFF"} · READ ${state.readQuestions?"ON":"OFF"}</div><div class="ready-rule">3 STRIKES. ONE CHAMPION.</div><div id="showtimeStatus" class="subtle center">${state.voiceOn?"THE GAME BEGINS AFTER THE HOST INTRO.":"PRESS START WHEN EVERYBODY IS READY."}</div></div>`,`<button id="back" class="btn">BACK</button><button class="btn setup-exit-bottom" data-setup-exit data-voice="EXIT" data-voice-aliases="exit game|leave game|cancel game|quit setup|go home|back to home">EXIT</button><button id="showtimeStart" class="btn primary" data-voice="START" data-voice-aliases="start game|begin game">START</button>`);
 document.querySelector(".screen")?.classList.add("showtime-screen");
 document.getElementById("back").onclick=()=>{clearRuntime();back()};
 document.querySelector("[data-setup-exit]").onclick=()=>{clearRuntime();exitSetup()};startVoice("ready");
 const session=runtimeSessionId;
 const event=state.mode==="solo"?"showtimeSolo":"showtime",context={name:names[0]||"player",players:spokenPlayers||"Players, welcome to the game",seconds:state.questionSeconds,mode:state.mode};
 hostSystem?.emit(event,context);
 let launched=false;
 const launch=source=>{if(launched||state.game)return;if(!transitionOwner("ready",session,"handoff",source||"showtime-complete",{reason:"showtime-launch",callback:"launch"}))return;launched=true;clearTimeout(flowTimer);flowTimer=null;pendingTransitionCause={trigger:source||"showtime-complete",reason:source||"showtime-complete"};startGame()};
 document.getElementById("showtimeStart").onclick=()=>{hostSystem?.cancel("showtime-explicit-start");launch("explicit-start")};
 if(hostSystem?.isSpeaking()){
  hostSystem.whenIdle().then(outcome=>{if(!transitionOwner("ready",session,"handoff","host-settled",{reason:"showtime-host-settled",callback:"whenIdle",hostEvent:outcome?.hostEventId}))return;if(outcome?.result==="playback-completed")launch("showtime-playback-completed");else if(outcome?.cancelReason!=="showtime-timeout"){const status=document.getElementById("showtimeStatus");if(status)status.textContent="HOST AUDIO UNAVAILABLE — PRESS START TO CONTINUE."}});
  flowTimer=setTimeout(()=>{if(state.screen!=="ready"||runtimeSessionId!==session)return;hostSystem?.cancel("showtime-timeout");const status=document.getElementById("showtimeStatus");if(status)status.textContent="HOST AUDIO TIMED OUT — PRESS START TO CONTINUE."},20000)
 }else{const status=document.getElementById("showtimeStatus");if(status&&state.voiceOn)status.textContent="HOST AUDIO UNAVAILABLE — PRESS START TO CONTINUE."}
}
function selectedPlayers(){return state.mode==="solo"?state.players.slice(0,1):state.players}
function startGame(){
 if(state.game)return;
 clearSetupState();rememberNames();stopMusic();const ps=selectedPlayers();state.game={players:ps.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),startingCount:ps.length,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:"",hostOpened:false,hostLeaderId:null};saveActiveGame();handoff()
}
function activePlayers(){return state.game.players.filter(p=>!p.eliminated)}
function nextActive(from){const g=state.game;for(let i=1;i<=g.players.length;i++){const x=(from+i)%g.players.length;if(!g.players[x].eliminated)return x}return from}
function gamebar(showName=true){
 const p=state.game.players[state.game.idx];return `<header class="game-topbar"><div class="controls"><button id="pause" class="btn">PAUSE</button></div>${showName?`<div class="game-player">${esc(p.name)}</div>`:""}<div class="topbar-spacer"></div></header>`
}
function bindGamebar(){document.getElementById("pause").onclick=pauseGame}
function handoff(){
 clearRuntime();const session=enterScreen("handoff","player-up","internal-game-event"),g=state.game;if(g.players[g.idx].eliminated)g.idx=nextActive(g.idx);const p=g.players[g.idx],opening=!g.hostOpened;g.hostOpened=true;saveActiveGame();
 const renderGeneration=++playerUpRenderGeneration,renderDiagnostic={phase:"message",screen:"player-up",renderGeneration,runtimeSession:session,activePlayer:p.name,playerId:p.id,at:Date.now(),previousScreen:transitionDiagnostics.at(-1)?.from||null,domText:"",visible:true};playerUpDiagnostics.push(renderDiagnostic);if(playerUpDiagnostics.length>150)playerUpDiagnostics.shift();if(transitionDebugEnabled)console.debug("[LOS player-up]",renderDiagnostic);
 const nameSize=p.name.length>24?"name-long":"name-regular";
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(false)}<div class="handoff"><div class="handoff-intro"><div class="handoff-player-name ${nameSize}">${esc(p.name)}</div><div class="handoff-hype">YOU’RE UP!</div><div class="handoff-sub">${g.showdown?"FINAL SHOWDOWN":""}</div></div><div id="handoffCount" class="handoff-count urgent" aria-live="polite"></div></div></div></section>`;
 const playerUpMessage=document.querySelector(".handoff-intro");if(playerUpMessage){playerUpMessage.id="playerUpMessage";renderDiagnostic.domText=playerUpMessage.innerText||playerUpMessage.textContent||""}bindGamebar();const event=state.mode==="solo"?"soloTurn":opening?"firstTurn":"turn";hostSystem?.emit(event,{name:p.name,mode:state.mode});
 const enteredAt=Date.now(),postHostBeatMs=450,minFallbackVisibleMs=1200;
 let countdownStarted=false,countdownScheduled=false,advanced=false;
 const valid=()=>state.screen==="handoff"&&runtimeSessionId===session&&state.game===g;
 const advanceOnce=()=>{if(advanced)return;if(!valid()){transitionOwner("handoff",session,"transition","timer",{reason:"stale-player-countdown",callback:"advanceOnce",timerId:"handoff-countdown"});return}advanced=true;transition("question",()=>question(),"player-countdown-complete")};
 const beginCountdown=()=>{
  if(countdownStarted||!valid())return;countdownStarted=true;
  const count=document.getElementById("handoffCount"),message=document.getElementById("playerUpMessage");if(!count)return;if(message){message.hidden=true;message.setAttribute("aria-hidden","true")}
  const countdownDiagnostic={phase:"countdown",screen:"player-up",renderGeneration,runtimeSession:session,activePlayer:p.name,playerId:p.id,at:Date.now(),previousScreen:"player-up",domText:"3",playerUpVisible:!!message&&!message.hidden};playerUpDiagnostics.push(countdownDiagnostic);if(playerUpDiagnostics.length>150)playerUpDiagnostics.shift();
  const showDigit=value=>{count.textContent=String(value);count.classList.remove("countdown-punch");void count.offsetWidth;count.classList.add("countdown-punch");handoffTick(value)};
  showDigit(3);
  [2,1].forEach((value,index)=>handoffTimers.push(setTimeout(()=>{if(!valid())return;const current=document.getElementById("handoffCount");if(current){current.textContent=String(value);current.classList.remove("countdown-punch");void current.offsetWidth;current.classList.add("countdown-punch");handoffTick(value)}},(index+1)*1000)));
 handoffTimers.push(setTimeout(advanceOnce,3000))
 };
 const scheduleCountdown=()=>{
  if(countdownScheduled||countdownStarted||!valid())return;countdownScheduled=true;
  handoffTimers.push(setTimeout(()=>{countdownScheduled=false;beginCountdown()},postHostBeatMs))
 };
 if(hostSystem?.isSpeaking()){
  hostSystem.whenIdle().then(outcome=>{const remaining=outcome?.result==="playback-completed"?0:Math.max(0,minFallbackVisibleMs-(Date.now()-enteredAt));if(remaining)handoffTimers.push(setTimeout(scheduleCountdown,remaining));else scheduleCountdown()});
  handoffTimers.push(setTimeout(()=>{if(!valid()||countdownStarted||countdownScheduled)return;hostSystem?.cancel("handoff-host-timeout");scheduleCountdown()},20000))
 }else scheduleCountdown()
}
function transition(kind,done,reason="game-transition"){
 clearRuntime();const session=enterScreen("transition",reason,"internal-game-event"),enteredAt=Date.now(),map={question:["LOCK IN","QUESTION INCOMING"],elimination:["PLAYER ELIMINATED","THE GAME CONTINUES"],showdown:["FINAL SHOWDOWN","PLAYOFF MODE"]};const [a,b]=map[kind]||map.question;
 app.innerHTML=`<section class="screen transition-screen"><div class="transition-stage"><div class="transition-glow"></div><div class="transition-copy"><div class="transition-big">${a}</div><div class="transition-small">${b}</div></div></div></section>`;if(kind==="question")GameAudio.playSfx("lockIn",{eventId:`lock-in:${session}`});else sting();
 const complete=()=>{if(transitionOwner("transition",session,kind==="question"?"question":kind==="showdown"?"showdown":"handoff","timer-or-host",{reason:`${kind}-transition-complete`,callback:"complete"}))done()};
 if(kind==="question"){hostSystem?.emit("lockIn",{mode:state.mode});const afterHost=()=>{const remaining=Math.max(0,650-(Date.now()-enteredAt));flowTimer=setTimeout(complete,remaining)};if(hostSystem?.isSpeaking())hostSystem.whenIdle().then(afterHost);else afterHost()}else flowTimer=setTimeout(complete,kind==="elimination"?2200:1800)
}
function pickQuestion(){
 const g=state.game;
 const source=QUESTION_BANK.select({edition:state.mode==="work"?"work":state.mode==="solo"?"solo":"original",difficulty:state.difficulty,usedIds:g.used||[],recentCategories:g.recentCategories||[],random:Math.random});
 if(!source)throw new Error(`No eligible questions for ${state.mode}/${state.difficulty}`);
 const item=QUESTION_BANK.toGameplay(source),eligibleIds=new Set((QUESTION_BANK.byEdition.get(state.mode==="work"?"work":state.mode==="solo"?"solo":"original")||[]).map(q=>q.id));
 g.used=(g.used||[]).filter(id=>eligibleIds.has(id));
 if(g.used.includes(item.id))g.used=g.used.filter(id=>id!==item.id);
 g.used.push(item.id);g.recentCategories=[...(g.recentCategories||[]),item.cat].slice(-2);return item
}
function question(resumeCurrent=false){
 clearRuntime();const session=enterScreen("question",resumeCurrent?"resume-question":"lock-in-complete","internal-game-event");saveActiveGame();const g=state.game;
 const regularSeconds=Number(state.questionSeconds)||15;
 const resuming=resumeCurrent&&g.current&&!g.answered;
 const remStart=resuming?Math.max(1,Number(pausedRemaining??g.questionRemaining)||regularSeconds):(g.showdown?Math.max(5,regularSeconds-5):regularSeconds);
 if(!resuming){g.current=pickQuestion();g.answered=false;g.speechLog=[];questionSessionId++}
 let rem=remStart;
 g.questionRemaining=rem;g.questionStartedWith=remStart;
 const questionSize=g.current.q.length>90?"question-long":g.current.q.length>55?"question-medium":"question-short";
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(true)}<div class="question-area"><div class="question-text ${questionSize}">${esc(g.current.q)}</div>
     ${!state.voiceOn?`<div class="keyboard-answer"><input id="typedAnswer" disabled autocomplete="off" autocapitalize="sentences" enterkeyhint="done" placeholder="TYPE YOUR ANSWER"><button id="lockAnswer" disabled class="btn primary">LOCK IN</button></div>`:""}<div id="answerAttemptFeedback" class="answer-attempt-feedback" aria-live="polite"></div><div id="timer" class="timer ${rem<=5?"urgent":""}" style="--timer-progress:${rem/remStart}" aria-label="${rem} seconds remaining">${rem}</div></div></div></section>`;
 bindGamebar();
 const startClock=()=>{
  if(state.screen!=="question"||runtimeSessionId!==session||g.answered)return;questionReading=false;answerListening=true;audioDiagnostics.buzzerFired=false;const input=document.getElementById("typedAnswer"),lock=document.getElementById("lockAnswer");if(input)input.disabled=false;if(lock)lock.disabled=false;startVoice("question");GameAudio.playSfx("questionStart",{eventId:`question-start:${questionSessionId}`});tickSound(rem);
  questionTimer=setInterval(()=>{
   rem--;g.questionRemaining=Math.max(0,rem);
   const t=document.getElementById("timer");
   if(t){t.textContent=Math.max(0,rem);t.classList.toggle("urgent",rem<=5);t.style.setProperty("--timer-progress",String(Math.max(0,rem)/remStart));t.setAttribute("aria-label",`${Math.max(0,rem)} seconds remaining`)}
   if(rem>0)tickSound(rem);
   if(rem<=0){clearInterval(questionTimer);questionTimer=null;finish("timeout")}
  },1000)
 };
 if(state.voiceOn&&state.readQuestions&&!resuming){questionReading=true;hostSystem?.emit("questionRead",{question:g.current.q,name:g.players[g.idx]?.name,category:g.current.cat,mode:state.mode});if(hostSystem?.isSpeaking())hostSystem.whenIdle().then(startClock);else startClock()}
 else{questionReading=false;startClock()}

 if(!state.voiceOn){
   const input=document.getElementById("typedAnswer"),lock=document.getElementById("lockAnswer");
   const submitTyped=()=>{const v=input?.value?.trim();if(!v)return;if(accepted(v,g.current)){recordAnswerAttempt(v,true,1);finish("correct")}else{recordAnswerAttempt(v,false,1);input.value=""}};
   if(lock)lock.onclick=submitTyped;
   if(input){input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submitTyped()}});questionSoundTimers.push(setTimeout(()=>{if(input.isConnected&&!g.answered)input.focus()},80))}
 }
}
function finish(outcome){
 const g=state.game;if(!g||g.answered)return;g.answered=true;clearRuntime();const p=g.players[g.idx];g.lastSpeechLog=[...g.speechLog];saveActiveGame();
 if(outcome==="correct"){p.correct++;p.hostCorrectStreak=(p.hostCorrectStreak||0)+1;p.hostMissStreak=0;good()}else{if(outcome==="timeout"){p.timeout++;buzzer()}else{p.wrong++;if(outcome==="pass")GameAudio.playSfx("pass",{eventId:`pass:${questionSessionId}`});else bad()}p.strikes++;p.hostMissStreak=(p.hostMissStreak||0)+1;p.hostCorrectStreak=0;if(p.strikes>=3)p.eliminated=true;if(p.eliminated)GameAudio.playSfx("elimination",{eventId:`elimination:${questionSessionId}`});else GameAudio.playSfx("strike",{eventId:`strike:${questionSessionId}`})}
 const category=g.current?.cat||"General Knowledge",categoryKey=norm(category);p.hostCategoryStats=p.hostCategoryStats||{};const categoryStats=p.hostCategoryStats[categoryKey]||{correct:0,miss:0};if(outcome==="correct")categoryStats.correct++;else categoryStats.miss++;p.hostCategoryStats[categoryKey]=categoryStats;
 const context={name:p.name,mode:state.mode,difficulty:state.difficulty,category,remaining:g.questionRemaining,elapsed:Math.max(0,(g.questionStartedWith||state.questionSeconds)-(g.questionRemaining||0)),streak:p.hostCorrectStreak||p.hostMissStreak||0,categoryCorrect:categoryStats.correct,categoryMiss:categoryStats.miss};
 let event;
 if(outcome==="correct"){
  const ranked=[...activePlayers()].sort((a,b)=>(b.correct-a.correct)||(a.strikes-b.strikes)),leader=ranked[0],tied=ranked.length>1&&leader.correct===ranked[1].correct&&leader.strikes===ranked[1].strikes;
  if(categoryStats.correct>=3&&categoryStats.correct%3===0)event="categoryRun";else if(p.hostCorrectStreak>=3)event="streak";else if((p.strikes||0)>=2&&p.hostCorrectStreak>=2)event="comeback";else if(!tied&&leader?.id===p.id&&g.hostLeaderId&&g.hostLeaderId!==p.id)event="lead";else if(tied)event="tie";else if(context.elapsed<=3)event="fastCorrect";else if(context.remaining<=2)event="slowCorrect";else if(state.difficulty==="hard"||state.difficulty==="savage")event="tough";else if(/hip-hop|r&b|funk|oldies|music|regional mexican|tejano|corrido|norte|ranchera/i.test(category))event="culturalCorrect";else event="correct";
  g.hostLeaderId=tied?null:leader?.id||null
 }else if(p.eliminated)event="elimination";else if(p.hostMissStreak>=2)event="misses";else if(state.difficulty==="kids"||state.difficulty==="easy"||g.current?.cat==="I Should Have Known That")event="easyMiss";else if(state.difficulty==="hard"||state.difficulty==="savage")event="tough";else event="wrong";
 if(outcome==="correct"){result(outcome);hostSystem?.emit(event,context)}else result(outcome,null,true)
}
function marks(p){
 return [0,1,2].map(i=>i<Math.min(3,p.strikes)
  ?`<span class="strike-hit">✕</span>`
  :`<span class="strike-empty">—</span>`).join(" ")
}
function standings(){return `<div class="standings">${[...state.game.players].sort((a,b)=>(a.eliminated-b.eliminated)||(a.strikes-b.strikes)||(b.correct-a.correct)).map(p=>`<div class="standing-row ${p.eliminated?"out":""}"><strong>${esc(p.name)}</strong><span>✓ ${p.correct}</span><span class="standing-strikes">${marks(p)}</span><span>${p.eliminated?"OUT":"IN"}</span></div>`).join("")}</div>`}
function fitResultAnswer(){
 const body=document.querySelector(".result-body"),answer=document.querySelector(".answer-big");if(!body||!answer)return;
 const tiers=["result-fit-1","result-fit-2","result-fit-3","result-fit-4"],fits=()=>body.scrollHeight<=body.clientHeight+1&&answer.scrollWidth<=answer.clientWidth+1;
 answer.classList.remove(...tiers);let tier=0;while(!fits()&&tier<tiers.length)answer.classList.add(tiers[tier++]);answer.dataset.fitTier=String(tier)
}
function result(outcome,resumeDelay=null,revealAnswer=false){
 const session=enterScreen("result","answer-result","internal-game-event");saveActiveGame();const g=state.game,p=g.players[g.idx],q=g.current;
 const label=outcome==="correct"?"CORRECT!":outcome==="pass"?(g.lastOutcomeDetail==="skip"?"SKIP":"PASS"):outcome==="timeout"?"TIME’S UP!":"NOT QUITE";
 const strike=outcome!=="correct", eliminated=strike&&p.eliminated;
 const phase=g.showdown?"FINAL SHOWDOWN":"CURRENT STANDINGS";
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(true)}
 <div class="result-body">
   <div class="result-word result-${outcome}">${label}</div>
   <div class="answer-panel">
     <div class="answer-label">CORRECT ANSWER</div>
     <div class="answer-big answer-${String(q?.a||"").length>16?"long":String(q?.a||"").length>10?"medium":"short"}">${esc(q?.a||"")}</div>
   </div>
   ${strike?`<div class="strike-box">${outcome==="wrong"?`<div class="result-impact" aria-hidden="true">×</div>`:""}<div>${eliminated?"THIRD STRIKE — ELIMINATED":"STRIKE"}</div><div class="strike-marks">${marks(p)}</div><div>${eliminated?esc(p.name)+" IS OUT":p.strikes+" OF 3 STRIKES"}</div></div>`:""}
   <div class="phase-heading">${phase}</div>
   ${standings()}
 </div></div></section>`;
 bindGamebar();fitResultAnswer();if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>{if(state.screen==="result"&&document.querySelector(".answer-big")?.isConnected)fitResultAnswer()});startVoice("result");
 const delay=resumeDelay??(g.showdown?(eliminated?5200:3900):eliminated?5200:strike?4200:3200),scheduleAdvance=()=>{if(state.screen!=="result"||runtimeSessionId!==session)return;resultDelayRemaining=delay;flowTimer=setTimeout(()=>{if(state.screen==="result"&&runtimeSessionId===session)advance()},delay)};
 g.lastOutcome=outcome;
 if(revealAnswer){hostSystem?.emit("answerReveal",{answer:q?.a||"",name:p.name,mode:state.mode});if(hostSystem?.isSpeaking())hostSystem.whenIdle().then(scheduleAdvance);else scheduleAdvance()}else scheduleAdvance()
}
function advance(){
 clearRuntime();resultDelayRemaining=null;const g=state.game;g.lastOutcomeDetail="";g.qnum++;
 if(g.showdown){
  const out=g.players.find(p=>p.eliminated);
  if(out){const champ=g.players.find(p=>p.id!==out.id);champion(champ);return}
  g.idx=(g.idx+1)%g.players.length;handoff();return
 }
 const alive=activePlayers();
 if(g.startingCount>=3&&alive.length===2){transition("elimination",showdownIntro);return}
 if(g.startingCount===2&&alive.length===1){champion(alive[0]);return}
 const expired=!state.quick&&(Date.now()-g.started)/60000>=state.duration;
 if(expired||g.qnum>=(state.quick?6:40)){
  if(g.startingCount>=3){transition("showdown",showdownIntro);return}
  const champ=[...alive].sort((a,b)=>(a.strikes-b.strikes)||(b.correct-a.correct))[0]||g.players[0];
  champion(champ);return
 }
 g.idx=nextActive(g.idx);handoff()
}
function showdownIntro(){
 clearRuntime();
 const g=state.game;
 let finalists=activePlayers();
 if(finalists.length>2){
   finalists=[...finalists].sort((a,b)=>(a.strikes-b.strikes)||(b.correct-a.correct)).slice(0,2);
 }
 if(finalists.length<2){
   const champ=finalists[0]||g.players.find(p=>!p.eliminated)||g.players[0];
   champion(champ);return;
 }
 g.players=finalists.map(p=>({...p,strikes:0,eliminated:false}));
 g.idx=0;g.showdown=true;g.qnum=0;g.used=[];
 const session=enterScreen("showdown","final-showdown","internal-game-event"),enteredAt=Date.now(),minimumVisibleMs=3600;saveActiveGame();
 const secs=Math.max(5,(Number(state.questionSeconds)||15)-5);
 app.innerHTML=`<section class="screen showdown-screen"><div class="showdown-stage">
   <div class="showdown-kicker">ONLY TWO REMAIN</div>
   <div class="showdown-title">FINAL<br>SHOWDOWN</div>
   <div class="showdown-vs">
     <div class="finalist-card"><div class="showdown-name">${esc(g.players[0].name)}</div><div class="showdown-strikes"><span class="strike-empty">—</span> <span class="strike-empty">—</span> <span class="strike-empty">—</span></div></div>
     <div class="vs">VS</div>
     <div class="finalist-card"><div class="showdown-name">${esc(g.players[1].name)}</div><div class="showdown-strikes"><span class="strike-empty">—</span> <span class="strike-empty">—</span> <span class="strike-empty">—</span></div></div>
   </div>
   <div class="showdown-rule">3 STRIKES AND YOU’RE OUT.</div>
   <div class="showdown-time">${secs} SECOND QUESTIONS</div>
 </div></section>`;
 GameAudio.playMusic("showdown",{owner:"final-showdown"});sting();hostSystem?.emit("showdown",{names:g.players.map(p=>p.name),mode:state.mode});
 const launchShowdown=()=>{if(!transitionOwner("showdown",session,"handoff","host-settled",{reason:"showdown-sequence-ready",callback:"launchShowdown",hostEvent:hostSystem?.history.at(-1)?.hostEventId}))return;const remaining=Math.max(0,minimumVisibleMs-(Date.now()-enteredAt));flowTimer=setTimeout(()=>{if(transitionOwner("showdown",session,"handoff","timer",{reason:"showdown-minimum-visible-complete",callback:"launchShowdownTimer",timerId:"showdown-minimum-visible"}))handoff()},remaining)};
 if(hostSystem?.isSpeaking())hostSystem.whenIdle().then(launchShowdown);else launchShowdown()
}
function applause(){
 [330,392,494,587,659,784].forEach((f,i)=>celebrationTimers.push(setTimeout(()=>{if(state.screen==="complete")tone(f,.28,.045,"triangle")},80+i*80)));
 celebrationTimers.push(setTimeout(()=>{if(state.screen==="complete")[523,659,784,1047].forEach((f,i)=>tone(f,.34,.035,"triangle",i*.06))},850));
}
function champion(p){
 clearRuntime();stopMusic();clearActiveGame();enterScreen("complete","champion","internal-game-event");
 app.innerHTML=`<section class="screen complete-screen"><div class="confetti" id="confetti"></div><div class="complete-stage">
   <div class="complete-kicker champion-los">LAST ONE<br>STANDING</div>
   <div class="champion-box">
     <div class="champion-name">${esc(p.name)}</div>
     <div class="champion-label">CHAMPION</div>
   </div>
   <div class="champion-actions"><button id="playAgain" class="btn primary large" data-voice="PLAY AGAIN" aria-label="Play again with the same setup">PLAY AGAIN</button><button id="home" class="btn large" data-voice="HOME" aria-label="Back to Home">HOME</button></div>
 </div></section>`;
 document.getElementById("playAgain").onclick=replayGame;document.getElementById("home").onclick=championHome;
 victory();applause();confetti();startVoice("complete");hostSystem?.emit("champion",{name:p.name,mode:state.mode});
}
function resetMatchRuntime(){pausedRemaining=pausedFrom=pausedResultDelay=resultDelayRemaining=null;renamePending=null;state.game=null;clearActiveGame()}
function replayGame(){
 if(state.screen!=="complete")return;const players=(state.game?.players||state.players).map(p=>({id:p.id||uid(),name:p.name,hostStyle:p.hostStyle||"neutral"}));
 clearRuntime();GameAudio.stopAll();resetMatchRuntime();state.players=players;state.selectedIds=players.map(p=>p.id);enterScreen("ready","play-again",pendingTransitionCause.trigger||"touch");ready()
}
function championHome(){clearRuntime();GameAudio.stopAll();resetMatchRuntime();home()}
function victory(){GameAudio.playSfx("champion",{eventId:`champion:${runtimeSessionId}`});GameAudio.playMusic("champion",{owner:"champion"})}
function confetti(){
 const box=document.getElementById("confetti");if(!box)return;
 if(typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const spawn=()=>{
   if(state.screen!=="complete")return;
   for(let i=0;i<22;i++){
     const x=document.createElement("i");x.style.left=Math.random()*100+"%";x.style.animationDuration=(2.1+Math.random()*2)+"s";x.style.animationDelay=Math.random()*.25+"s";x.style.transform=`rotate(${Math.random()*180}deg)`;box.appendChild(x);
     celebrationTimers.push(setTimeout(()=>x.remove(),4500))
   }
 };
 spawn();[500,1000].forEach(delay=>celebrationTimers.push(setTimeout(spawn,delay)))
}
function showPauseOverlay(){
 document.getElementById("pauseOverlay")?.remove();const o=document.createElement("div");o.className="overlay";o.id="pauseOverlay";o.innerHTML=`<div class="pause-card card" role="dialog" aria-modal="true" aria-labelledby="pauseTitle"><div class="pause-title" id="pauseTitle">GAME PAUSED</div><div class="pause-volume"><span>VOLUME</span><input id="pauseVol" type="range" min="0" max="1" step=".05" value="${state.volume}"><strong id="pauseVolPct">${Math.round(state.volume*100)}%</strong></div><button id="resume" class="btn primary large">RESUME</button><button id="leave" class="btn">LEAVE GAME</button><button id="end" class="btn danger">QUIT</button></div>`;document.body.appendChild(o);document.getElementById("resume").onclick=resumeGame;document.getElementById("leave").onclick=leaveGame;document.getElementById("end").onclick=confirmEnd;document.getElementById("pauseVol").oninput=e=>{setVolume(Number(e.target.value));document.getElementById("pauseVolPct").textContent=Math.round(state.volume*100)+"%"};document.getElementById("resume").focus();startVoice("paused")
}
function pauseGame(){
 if(!state.game)return;if(state.screen!=="paused"){pausedFrom=state.screen;if(pausedFrom==="question")pausedRemaining=state.game.questionRemaining??state.questionSeconds;if(pausedFrom==="result")pausedResultDelay=resultDelayRemaining;clearRuntime();GameAudio.pause();enterScreen("paused","pause",pendingTransitionCause.trigger)}showPauseOverlay()
}
function resumeGame(){document.getElementById("pauseOverlay")?.remove();GameAudio.resume();const from=pausedFrom;pausedFrom=null;if(from==="question"){question(true);pausedRemaining=null}else if(from==="result"&&state.game?.lastOutcome){const delay=pausedResultDelay;pausedResultDelay=null;result(state.game.lastOutcome,delay)}else{pausedRemaining=null;pausedResultDelay=null;handoff()}}
function leaveGame(){document.getElementById("pauseOverlay")?.remove();clearRuntime();GameAudio.stopAll();saveActiveGame();state.game=null;home()}
function confirmEnd(){if(!document.querySelector(".pause-card"))pauseGame();const c=document.querySelector(".pause-card");if(!c)return;c.setAttribute("aria-labelledby","confirmEndTitle");c.innerHTML=`<div class="pause-title" id="confirmEndTitle">END THIS GAME?</div><button id="yes" class="btn danger large">YES</button><button id="no" class="btn">CANCEL</button>`;document.getElementById("yes").onclick=()=>{document.getElementById("pauseOverlay")?.remove();clearRuntime();clearActiveGame();state.game=null;home()};document.getElementById("no").onclick=showPauseOverlay;document.getElementById("yes").focus()}
function render(){clearRuntime();({home,setup,mode,industry,difficulty,fun,players,time,ready,handoff,question,result}[state.screen]||home)()}
function installLayoutBoundsDebug(){
 const enabled=new URLSearchParams(location.search).get("layoutDebug")==="1"||localStorage.getItem("los_layout_debug")==="1";
 if(!enabled)return;
 const colors={layout:"#ffffff",visual:"#ff3f55",app:"#52db91",screen:"#ffd04f",shell:"#53b7ff",gameShell:"#b978ff",topbar:"#ff8b3d",content:"#42e5db",footer:"#ff65c7"};
 const layer=document.createElement("div"),panel=document.createElement("pre");
 layer.id="losLayoutBounds";layer.style.cssText="position:fixed;inset:0;z-index:2147483645;pointer-events:none";
 panel.id="losLayoutMetrics";panel.style.cssText="position:fixed;z-index:2147483646;left:6px;top:6px;width:min(96vw,760px);max-height:48vh;overflow:auto;margin:0;padding:8px;border:1px solid #fff;background:rgba(0,0,0,.88);color:#fff;font:10px/1.3 monospace;white-space:pre-wrap;pointer-events:auto";
 document.body.append(layer,panel);
 panel.title="Tap to collapse or expand layout measurements";panel.onclick=()=>{const collapsed=panel.dataset.collapsed==="1";panel.dataset.collapsed=collapsed?"0":"1";panel.style.maxHeight=collapsed?"48vh":"24px";panel.style.overflow=collapsed?"auto":"hidden"};
 const num=x=>Math.round((Number(x)||0)*10)/10,box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{rect:{x:num(r.x),y:num(r.y),width:num(r.width),height:num(r.height),right:num(r.right),bottom:num(r.bottom)},computed:{height:s.height,minHeight:s.minHeight,maxHeight:s.maxHeight,marginTop:s.marginTop,marginBottom:s.marginBottom,paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,rowGap:s.rowGap,columnGap:s.columnGap,display:s.display,position:s.position,overflowY:s.overflowY,gridTemplateRows:s.gridTemplateRows}}};
 const safe=()=>{const p=document.createElement("div");p.style.cssText="position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";document.body.appendChild(p);const s=getComputedStyle(p),x={top:s.paddingTop,right:s.paddingRight,bottom:s.paddingBottom,left:s.paddingLeft};p.remove();return x};
 const snapshot=()=>{const vv=visualViewport,html=document.documentElement,body=document.body;return{runtime:{userAgent:navigator.userAgent,devicePixelRatio:num(devicePixelRatio),outerWidth,outerHeight,windowOrientation:typeof orientation==="number"?orientation:null,screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight,orientationType:screen.orientation?.type||null,orientationAngle:screen.orientation?.angle??null}},viewport:{innerWidth:innerWidth,innerHeight:innerHeight,visualViewport:vv?{width:num(vv.width),height:num(vv.height),offsetTop:num(vv.offsetTop),offsetLeft:num(vv.offsetLeft),pageTop:num(vv.pageTop),pageLeft:num(vv.pageLeft),scale:num(vv.scale)}:null,documentClientWidth:html.clientWidth,documentClientHeight:html.clientHeight,safeArea:safe(),displayMode:{standalone:matchMedia("(display-mode: standalone)").matches,fullscreen:matchMedia("(display-mode: fullscreen)").matches,minimalUi:matchMedia("(display-mode: minimal-ui)").matches,browser:matchMedia("(display-mode: browser)").matches,navigatorStandalone:navigator.standalone===true},appHeightVariable:getComputedStyle(html).getPropertyValue("--app-h").trim()},boxes:{html:box(html),body:box(body),app:box(document.getElementById("app")),screen:box(document.querySelector(".screen")),shell:box(document.querySelector(".shell")),gameShell:box(document.querySelector(".game-shell")),topbar:box(document.querySelector(".topbar,.game-topbar")),content:box(document.querySelector(".content,.question-area,.handoff,.result-body,.transition-stage,.showdown-stage,.complete-stage")),footer:box(document.querySelector(".footer"))},parentChain:[...function*(){let e=document.querySelector(".screen");while(e){yield{name:e.id?`#${e.id}`:e.className?`.${String(e.className).trim().replace(/\s+/g,".")}`:e.tagName.toLowerCase(),box:box(e)};e=e.parentElement}}()]}};
 let queued=false;
 const refresh=()=>{queued=false;const data=snapshot();layer.replaceChildren();const vv=visualViewport,targets=[{name:"layout",rect:{x:0,y:0,width:innerWidth,height:innerHeight}},{name:"visual",rect:{x:vv?.offsetLeft||0,y:vv?.offsetTop||0,width:vv?.width||innerWidth,height:vv?.height||innerHeight}},{name:"app",element:document.getElementById("app")},{name:"screen",element:document.querySelector(".screen")},{name:"shell",element:document.querySelector(".shell")},{name:"gameShell",element:document.querySelector(".game-shell")},{name:"topbar",element:document.querySelector(".topbar,.game-topbar")},{name:"content",element:document.querySelector(".content,.question-area,.handoff,.result-body,.transition-stage,.showdown-stage,.complete-stage")},{name:"footer",element:document.querySelector(".footer")}];for(const t of targets){const r=t.rect||(t.element&&t.element.getBoundingClientRect());if(!r)continue;const d=document.createElement("div");d.style.cssText=`position:fixed;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;border:2px solid ${colors[t.name]};box-sizing:border-box;color:${colors[t.name]};font:700 10px monospace;text-shadow:0 1px 2px #000`;d.textContent=t.name;layer.appendChild(d)}panel.textContent="LAYOUT DEBUG — WHITE layout | RED visual | GREEN app | GOLD screen\n"+JSON.stringify(data,null,2)};
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(refresh)}};
 addEventListener("resize",schedule,{passive:true});addEventListener("orientationchange",schedule,{passive:true});visualViewport?.addEventListener("resize",schedule,{passive:true});visualViewport?.addEventListener("scroll",schedule,{passive:true});new MutationObserver(schedule).observe(document.getElementById("app"),{childList:true,subtree:true});
 globalThis.__LOS_LAYOUT_DEBUG__={snapshot,refresh:schedule};schedule()
}
function viewport(){document.documentElement.style.setProperty("--app-h",Math.max(document.documentElement.clientHeight||0,window.innerHeight||0)+"px")}
window.addEventListener("resize",viewport,{passive:true});window.visualViewport?.addEventListener("resize",viewport,{passive:true});
window.addEventListener("pointerdown",()=>{ensureAudio();hostSystem?.provider?.activate?.();if(["home","mode","industry","difficulty","fun","players","time","ready"].includes(state.screen))startMusic()},{passive:true});
window.addEventListener("pointerdown",()=>{pendingTransitionCause={trigger:"click",reason:"pointer-control"}},{capture:true,passive:true});
window.addEventListener("keydown",event=>{ensureAudio();hostSystem?.provider?.activate?.();pendingTransitionCause={trigger:"keyboard",reason:event.key||"key"};if(state.screen==="question"&&!event.repeat&&(event.key==="Escape"||String(event.key).toLowerCase()==="p")){event.preventDefault();pauseGame()}},{capture:true});
document.documentElement.dataset.build="6.18";
try{hostSystem=createHostSystem();viewport();home();installLayoutBoundsDebug()}
catch(err){
 console.error("LOS startup error",err);
 app.innerHTML=`<section class="screen"><div class="shell"><div class="content"><div class="card"><h1>LAST ONE STANDING</h1><p>Build 6.0.1 could not start.</p><p class="subtle">${esc(err?.message||"Unknown startup error")}</p></div></div></div></section>`
}
})();
