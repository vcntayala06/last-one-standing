
(()=>{
"use strict";
const BUILD="Clean Foundation 6.0.5 Continuous Voice Fix";
const app=document.getElementById("app");
const STORAGE={names:"los5_names",voice:"los5_voice",volume:"los5_volume",activeGame:"los5_active_game"};
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
const QUESTIONS=[
 {q:"What gas do humans need to breathe to survive?",cat:"Science & Nature",a:"oxygen",alts:["oxygen"]},
 {q:"What planet is known as the Red Planet?",cat:"Science & Nature",a:"Mars",alts:["mars"]},
 {q:"What is the largest ocean on Earth?",cat:"Geography",a:"Pacific Ocean",alts:["pacific","pacific ocean"]},
 {q:"How many days are in a leap year?",cat:"General Knowledge",a:"366",alts:["366","three hundred sixty six","three hundred and sixty six"]},
 {q:"What is the capital of California?",cat:"Geography",a:"Sacramento",alts:["sacramento"]},
 {q:"What animal is known as man's best friend?",cat:"Science & Nature",a:"Dog",alts:["dog","a dog"]},
 {q:"What color do you get when you mix blue and yellow?",cat:"General Knowledge",a:"Green",alts:["green"]},
 {q:"How many sides does a triangle have?",cat:"General Knowledge",a:"3",alts:["3","three"]},
 {q:"What is frozen water called?",cat:"Science & Nature",a:"Ice",alts:["ice"]},
 {q:"What is the opposite of north?",cat:"Geography",a:"South",alts:["south"]},
 {q:"What fruit is traditionally used to make guacamole?",cat:"Food & Drink",a:"Avocado",alts:["avocado"]},
 {q:"Which month comes after June?",cat:"General Knowledge",a:"July",alts:["july"]},
 {q:"What is 5 times 5?",cat:"General Knowledge",a:"25",alts:["25","twenty five"]},
 {q:"Which animal says moo?",cat:"Science & Nature",a:"Cow",alts:["cow","a cow"]},
 {q:"What do bees make?",cat:"Science & Nature",a:"Honey",alts:["honey"]},
 {q:"What is the first letter of the alphabet?",cat:"Word Play",a:"A",alts:["a","letter a"]},
 {q:"What shape has four equal sides?",cat:"General Knowledge",a:"Square",alts:["square"]},
 {q:"What star is closest to Earth?",cat:"Science & Nature",a:"The Sun",alts:["sun","the sun"]},
 {q:"What instrument has black and white keys?",cat:"Music",a:"Piano",alts:["piano"]},
 {q:"Which season comes after summer?",cat:"General Knowledge",a:"Fall",alts:["fall","autumn"]}
];
let state={
 screen:"home",mode:"friends",players:[],selectedIds:[],duration:15,questionSeconds:15,
 quick:false,voiceOn:localStorage.getItem(STORAGE.voice)!=="false",
 volume:Number(localStorage.getItem(STORAGE.volume)||.65),categories:[],industry:"",difficulty:"medium",answerLanguage:"en",game:null
};
let recognition=null,voiceContext="",questionTimer=null,flowTimer=null,audioCtx=null,musicTimer=null,pausedRemaining=null,pausedFrom=null;
let voiceWatchdogTimer=null;
function armVoiceWatchdog(r){
 clearTimeout(voiceWatchdogTimer);
 voiceWatchdogTimer=setTimeout(()=>{
  if(recognition!==r)return;
  try{r.onend=null;r.abort()}catch{}
  recognition=null;
  if(state.voiceOn)startVoice(voiceContext||state.screen)
 },12000)
}
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=s=>String(s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
const save=()=>localStorage.setItem(STORAGE.voice,String(state.voiceOn));
function spokenNumber(s){
 const map={one:1,two:2,to:2,too:2,three:3,four:4,for:4,five:5,six:6,seven:7,eight:8,ate:8,nine:9,ten:10};
 const n=Number(s);return Number.isFinite(n)&&n>0?n:(map[norm(s)]||0)
}
function nameKey(s){return norm(s).replace(/\b(player|please|the)\b/g,"").replace(/\s+/g," ").trim()}

function ensureAudio(){if(!audioCtx)try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch{};if(audioCtx?.state==="suspended")audioCtx.resume()}
function tone(freq=440,d=.05,gain=.06,type="sine",delay=0){
 ensureAudio();if(!audioCtx)return;const now=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain*state.volume),now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+d);
 o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+d+.02)
}
function handoffTick(){tone(520,.045,.045,"square")}
function tickSound(rem){
 if(rem<=0)return;
 if(rem>=6){tone(500,.045,.05,"square");return}
 // Pressure zone: same tick character, rapid cadence from 5 through 1.
 [0,200,400,600,800].forEach(ms=>setTimeout(()=>tone(620,.032,.058,"square"),ms))
}
function buzzer(){tone(175,.22,.12,"square");tone(150,.24,.11,"square",.17)}
function good(){tone(620,.08,.07,"triangle");tone(820,.12,.07,"triangle",.08)}
function bad(){tone(220,.13,.09,"square")}
function sting(){tone(360,.09,.06,"triangle");tone(520,.12,.07,"triangle",.1);tone(680,.15,.06,"triangle",.2)}
function startMusic(){stopMusic();ensureAudio();let step=0;musicTimer=setInterval(()=>{if(["question","handoff","result","paused","transition"].includes(state.screen))return;const seq=[220,277,330,440];tone(seq[step++%seq.length],.12,.018,"triangle")},700)}
function stopMusic(){clearInterval(musicTimer);musicTimer=null}
function clearRuntime(){clearInterval(questionTimer);questionTimer=null;clearTimeout(flowTimer);flowTimer=null;stopVoice()}
function isSetupScreen(){return ["mode","industry","difficulty","fun","players","time","ready"].includes(state.screen)}
function exitSetup(){if(state.game)return;stopVoice();state.game=null;state.screen="home";home()}
function bindSetupExit(){const b=document.getElementById("setupExit");if(b)b.onclick=exitSetup}
function shell(title,content,footer=""){return `<section class="screen"><div class="shell"><header class="topbar"><div></div><div class="topbar-title">${title||""}</div><div></div></header><div class="content">${content}</div><footer class="footer">${footer}</footer></div></section>${isSetupScreen()?`<button id="setupExit" class="setup-exit" data-voice="EXIT" data-voice-aliases="exit game|leave game|cancel game|quit setup|go home|back to home">EXIT</button>`:""}${state.voiceOn?`<div id="voiceDiagnostic" class="voice-diagnostic">MIC LISTENING</div>`:""}`}
function remembered(){try{return JSON.parse(localStorage.getItem(STORAGE.names)||"[]")}catch{return[]}}
function rememberNames(){const ns=state.players.map(p=>p.name.trim()).filter(Boolean);localStorage.setItem(STORAGE.names,JSON.stringify([...new Set([...remembered(),...ns])].slice(-50)))}
function ensurePlayers(){
 if(!state.players.length)state.players=[{id:uid(),name:"Vicente"},{id:uid(),name:"Todd"},{id:uid(),name:"Maria"}];
 if(state.mode==="solo")state.players=state.players.slice(0,1);
 state.selectedIds=state.players.filter(p=>p.name.trim()).map(p=>p.id)
}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function stopVoice(){
 clearTimeout(voiceCore?.restart);
 clearTimeout(voiceWatchdogTimer);
 voiceContext="";
 try{if(recognition){recognition.onend=null;recognition.abort()}}catch{}
 recognition=null
}

let voiceRestartTimer=null,voiceGeneration=0,lastVoiceAction={key:"",at:0};

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
function clickVoiceTarget(h){
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
     if(n===k)score=100;
     else if(n===`click ${k}`||n===`choose ${k}`||n===`select ${k}`||n===`pick ${k}`||n===`press ${k}`)score=95;
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
function activeGameVoiceCommand(h){
 const n=norm(h);
 if(!state.game)return false;

 // Save-and-leave commands: game remains resumable.
 if(/^(exit game|exit the game|leave game|leave the game|save and leave|save game and leave)$/.test(n)){
   voiceFeedback("✓ EXIT GAME","action");
   leaveGame();
   return true
 }

 // Destructive commands: always require confirmation.
 if(/^(end game|end the game|quit game|quit the game|stop game|stop the game)$/.test(n)){
   voiceFeedback("✓ END GAME","action");
   confirmEnd();
   return true
 }
 return false
}
function universalVoiceCommand(h){
 const n=norm(h);
 if(activeGameVoiceCommand(h))return true;
 if(/^(back|go back|previous|previous screen|take me back)$/.test(n)){voiceFeedback("✓ BACK","action");back();return true}
 if(/^(volume up|turn it up|louder)$/.test(n)){setVolume(state.volume+.1);voiceFeedback("✓ VOLUME UP","action");return true}
 if(/^(volume down|turn it down|quieter)$/.test(n)){setVolume(state.volume-.1);voiceFeedback("✓ VOLUME DOWN","action");return true}
 if(/^(mute|mute it)$/.test(n)){setVolume(0);voiceFeedback("✓ MUTED","action");return true}
 if(/^(unmute|sound on)$/.test(n)){setVolume(.65);voiceFeedback("✓ SOUND ON","action");return true}
 const vm=n.match(/^volume\s+(\d{1,3})$/);if(vm){setVolume(Math.min(100,Number(vm[1]))/100);voiceFeedback("✓ VOLUME "+vm[1],"action");return true}
 return clickVoiceTarget(h)
}

let voiceCore={ctx:null,restart:null,lastKey:"",lastAt:0,lastHeard:""};

function voiceStatus(text,kind="listening"){
 voiceCore.lastHeard=text||"";
 const el=document.getElementById("voiceDiagnostic");
 if(!el)return;
 el.dataset.kind=kind;
 el.textContent=text || (kind==="error"?"MIC ISSUE":"MIC LISTENING")
}
function voiceOnce(key,fn,windowMs=600){
 const now=Date.now(),k=commandKey(key);
 if(voiceCore.lastKey===k&&now-voiceCore.lastAt<windowMs)return true;
 voiceCore.lastKey=k;voiceCore.lastAt=now;fn();return true
}
let voiceTargetCache={screen:"",items:[]};
function refreshVoiceTargetCache(){
 voiceTargetCache={screen:state.screen,items:visibleVoiceTargets().map(t=>({el:t.el,label:t.label,phrases:t.phrases.map(commandKey).filter(Boolean)}))}
}
function cachedExactVoiceTarget(h){
 const n=commandKey(h);if(!n)return false;
 if(voiceTargetCache.screen!==state.screen||!voiceTargetCache.items.length)refreshVoiceTargetCache();
 const t=voiceTargetCache.items.find(x=>x.phrases.includes(n));if(!t)return false;
 return voiceOnce("cached:"+t.label,()=>{voiceFeedback("✓ "+t.label,"action");t.el.click()})
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
function centralNavIntent(h){
 const n=norm(h);
 if(/^(continue|next|done|go ahead|go on|move on|lets go|let s go|im ready|i m ready|ready|start|begin|lets begin|let s begin)$/.test(n)){
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
  return voiceOnce("back:"+state.screen,()=>back())
 }
 return false
}
function centralSetupIntent(h){
 const n=norm(h);
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
function centralGameIntent(h){
 const n=norm(h);if(!state.game)return false;

 if(/^(exit game|exit the game|leave game|leave the game|save and leave|save game and leave|go home and save)$/.test(n)){
  return voiceOnce("exit-game",()=>{voiceFeedback("✓ EXIT GAME","action");leaveGame()})
 }
 if(/^(end game|end the game|quit game|quit the game|stop game|stop the game)$/.test(n)){
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
 if(state.screen!=="question"||!state.game?.current)return false;
 const n=norm(h);
 if(/^(skip|skip it|skip this one|skip question|next question)$/.test(n)){
  return voiceOnce("skip",()=>{state.game.lastOutcomeDetail="skip";voiceFeedback("✓ SKIP","action");finish("pass")})
 }
 if(/^(pass|i pass|ill pass|i ll pass|im passing|i m passing)$/.test(n)){
  return voiceOnce("pass",()=>{state.game.lastOutcomeDetail="pass";voiceFeedback("✓ PASS","action");finish("pass")})
 }
 if(accepted(h,state.game.current)){
  const canonical=norm(state.game.current.a||"");
  const strong=n===canonical||editSimilarity(n,canonical)>=.92||editSimilarity(phoneticKey(h),phoneticKey(canonical))>=.92;
  if(isFinal||strong||confidence>=.88)return voiceOnce("answer:"+canonical,()=>{voiceFeedback("✓ ANSWER","action");finish("correct")})
 }
 if(isFinal&&n&&n.split(" ").length<=10)return voiceOnce("wrong:"+n,()=>finish("wrong"));
 return false
}
function routeVoiceCentral(h,{isFinal=false,confidence=0}={}){
 h=(h||"").trim();if(!h)return false;
 voiceStatus(isFinal?`HEARD: ${h}`:`… ${h}`,isFinal?"heard":"listening");

 // Highest priority commands first.
 if(centralExitIntent(h))return true;
 if(centralGameIntent(h))return true;

 // Setup navigation and fixed setup choices should feel immediate.
 if(centralSetupIntent(h))return true;
 if(centralNavIntent(h))return true;

 // Player edits contain names/data: wait for the complete final phrase.
 if(state.screen==="players" && isFinal && playersVoiceController(h))return true;

 // Keep the working question answer path unchanged in behavior.
 if(centralQuestionIntent(h,isFinal,confidence))return true;

 // Exact visible controls can fire quickly everywhere except player Add/Edit controls on interim speech.
 if((state.screen!=="players" || isFinal) && cachedExactVoiceTarget(h))return true;
 if((state.screen!=="players" || isFinal) && exactVisibleTarget(h))return true;

 // Fuzzy control matching remains final-only.
 if(isFinal&&clickVoiceTarget(h))return true;
 return false
}
function startVoice(ctx){
 const previousCtx=voiceCore.ctx;
 voiceContext=ctx;voiceCore.ctx=ctx;
 if(!state.voiceOn||!speechSupported()){stopVoice();return}

 // If the screen changed, do not keep an old recognizer session alive.
 // Restart immediately with the new screen's command context.
 if(recognition){
  if(previousCtx!==ctx){
   try{recognition.onend=null;recognition.abort()}catch{}
   recognition=null;
   clearTimeout(voiceCore.restart);
   voiceCore.restart=setTimeout(()=>startVoice(ctx),30)
  }
  return
 }

 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 try{
  const r=new SR();recognition=r;
  r.lang="en-US";
  r.interimResults=true;
  try{r.continuous=true}catch{}
  try{r.maxAlternatives=5}catch{}

  r.onstart=()=>{voiceStatus("MIC LISTENING","listening");armVoiceWatchdog(r)};

  r.onresult=e=>{
   armVoiceWatchdog(r);
   for(let i=e.resultIndex;i<e.results.length;i++){
    const res=e.results[i];
    let handled=false;

    for(let a=0;a<Math.min(res.length,5);a++){
     const alt=res[a],text=(alt?.transcript||"").trim();
     if(!text)continue;
     const confidence=Number.isFinite(alt.confidence)?alt.confidence:0;

     if(!res.isFinal){
      const n=norm(text);
      const fastControl=/^(continue|next|done|go ahead|go on|move on|lets go|let s go|im ready|i m ready|start|begin|back|go back|exit|exit game|leave game|cancel game|quit setup|go home|pause|resume|quit|quit game|end game|stop game|pass|skip|select all|clear all|kids|easy|medium|hard|savage)$/;
      const setupFast=["home","mode","industry","difficulty","fun","players","time","ready","paused"].includes(state.screen);
      if(state.screen!=="players"&&cachedExactVoiceTarget(text)){handled=true;break}
      if(fastControl.test(n)||setupFast||state.screen==="question"){
       if(routeVoiceCentral(text,{isFinal:false,confidence})){handled=true;break}
      }
     }else{
      if(routeVoiceCentral(text,{isFinal:true,confidence})){handled=true;break}
     }
    }
    if(handled)break
   }
  };

  r.onerror=e=>{
   const err=e?.error||"";
   if(err==="not-allowed"||err==="service-not-allowed")voiceStatus("MIC PERMISSION NEEDED","error");
   else if(err!=="aborted"&&err!=="no-speech")voiceStatus("MIC LISTENING","listening")
  };

  r.onend=()=>{
   if(recognition===r)recognition=null;
   if(!state.voiceOn)return;
   clearTimeout(voiceCore.restart);
   const nextCtx=voiceContext||state.screen;
   voiceCore.restart=setTimeout(()=>startVoice(nextCtx),20)
  };

  r.start()
 }catch{
  recognition=null;
  clearTimeout(voiceCore.restart);
  voiceCore.restart=setTimeout(()=>{
   if(state.voiceOn)startVoice(voiceContext||state.screen)
  },55)
 }
}
function ensureQuestionVoice(){
 if(state.voiceOn&&state.screen==="question"&&!recognition)startVoice("question")
}
function globalCmd(h){
 const n=norm(h);
 if(/^(back|go back|previous|previous screen|take me back)$/.test(n))return"back";
 if(/^(continue|start|lets start|let s start|lets begin|let s begin|begin|go|go ahead|next|move on|im ready|i m ready|were ready|we re ready|lets go|let s go|start the game|continue on)$/.test(n))return"continue";
 if(/^(pause|pause game|hold on|stop for a second)$/.test(n))return"pause";
 if(/^(resume|resume game|continue game|keep going)$/.test(n))return"resume";
 if(/^(leave game|exit game|leave)$/.test(n))return"leave";
 if(/^(end game|end the game|quit the game)$/.test(n))return"end";
 if(/^(volume up|turn it up|louder)$/.test(n))return"volup";
 if(/^(volume down|turn it down|quieter)$/.test(n))return"voldown";
 if(/^(mute|mute it)$/.test(n))return"mute";
 if(/^(unmute|sound on)$/.test(n))return"unmute";
 const m=n.match(/^volume\s+(\d{1,3})$/);if(m)return"vol:"+Math.min(100,Number(m[1]));
 if(/^(what did you hear|repeat what you heard|what was heard)$/.test(n))return"heard";
 return""
}
function heard(ctx,h){
 const c=globalCmd(h), n=norm(h);
 if(c==="volup"){setVolume(state.volume+.1);return}
 if(c==="voldown"){setVolume(state.volume-.1);return}
 if(c==="mute"){setVolume(0);return}
 if(c==="unmute"){setVolume(.65);return}
 if(c.startsWith("vol:")){setVolume(Number(c.slice(4))/100);return}

 if(ctx==="question"){
   state.game.speechLog.push(h);
   if(c==="pause"){pauseGame();return}
   if(/^(skip|skip it|skip this one|skip question|next question)$/.test(n)){state.game.lastOutcomeDetail="skip";finish("pass");return}
   if(/^(pass|i pass|ill pass|i ll pass|im passing|i m passing)$/.test(n)){state.game.lastOutcomeDetail="pass";finish("pass");return}
   if(accepted(h,state.game.current)){finish("correct");return}
   return
 }
 if(ctx==="paused"){
   if(activeGameVoiceCommand(h))return;
   if(c==="resume"||c==="continue"){resumeGame();return}
   if(c==="leave"){leaveGame();return}
   if(c==="end"){confirmEnd();return}
   return
 }

 if(c==="back"){back();return}

 if(ctx==="home"){
   if(/^(start game|start|lets play|let s play|play)$/.test(n)||c==="continue"){primaryAction();return}
 }

 if(ctx==="mode"){
   if(/^(quick|quick game|quit game|start a quick game|start quick game)$/.test(n)){state.quick=true;state.duration=3;state.mode="friends";go("difficulty");return}
   if(/^(work|work game)$/.test(n)){state.mode="work";state.quick=false;go("industry");return}
   if(/^(family|family game)$/.test(n)){state.mode="family";state.quick=false;go("difficulty");return}
   if(/^(friends|friend|friends game)$/.test(n)){state.mode="friends";state.quick=false;go("difficulty");return}
   if(/^(solo|solo game)$/.test(n)){state.mode="solo";state.quick=false;go("difficulty");return}
 }

 if(ctx==="industry"){
   const target=WORK_INDUSTRIES.find(x=>phraseMatch(h,x)||norm(x)===norm(h));
   if(target){state.industry=target;voiceFeedback("✓ "+target,"action");industry();return}
   if(c==="continue"&&state.industry){go("fun");return}
 }
 if(ctx==="difficulty"){
   const d=DIFFICULTIES.find(x=>norm(x.label)===n||n===`make it ${norm(x.label)}`||n===`${norm(x.label)} questions`);
   if(d){state.difficulty=d.id;voiceFeedback("✓ "+d.label,"action");difficulty();return}
   if(c==="continue"){go("fun");return}
 }
 if(ctx==="fun"){
   if(/^(continue|next|done|go ahead|lets go|let s go|im done|i m done|thats it|that s it|start|begin|im ready|i m ready)$/.test(n)){funContinue();return}
   if(/^(select all|all categories|choose all|give me everything)$/.test(n)){state.categories=[...EXTRA_CATEGORIES];voiceFeedback("✓ ALL CATEGORIES","action");fun();return}
   if(/^(clear all|clear categories|remove all categories)$/.test(n)){state.categories=[];voiceFeedback("✓ CLEAR ALL","action");fun();return}

   if(/^(skip|skip this|no thanks|none|no extra categories)$/.test(n)){state.categories=[];go("players");return}
   let m=h.match(/^(?:add|include|select|choose)\s+(.+)$/i);
   if(m){
     const target=norm(m[1]), cat=EXTRA_CATEGORIES.find(x=>norm(x)===target||norm(x).includes(target)||target.includes(norm(x)));
     if(cat){const set=new Set(state.categories||[]);set.add(cat);state.categories=[...set];fun();return}
   }
   m=h.match(/^(?:remove|delete|deselect)\s+(.+)$/i);
   if(m){
     const target=norm(m[1]), cat=EXTRA_CATEGORIES.find(x=>norm(x)===target||norm(x).includes(target)||target.includes(norm(x)));
     if(cat){state.categories=(state.categories||[]).filter(x=>x!==cat);fun();return}
   }
   if(c==="continue"){primaryAction();return}
 }

 if(ctx==="players"){
   if(handlePlayerVoice(h))return;
   if(c==="continue"){primaryAction();return}
 }

 if(ctx==="time"){
   let m=n.match(/^(\d+)\s*seconds?$/);
   if(m){state.questionSeconds=Math.max(5,Math.min(30,Number(m[1])));time();return}
   m=n.match(/^(\d+)\s*minutes?$/);
   if(m){state.duration=Number(m[1]);state.quick=false;time();return}
   if(/^(quick|quick game|quit game)$/.test(n)){state.quick=true;state.duration=3;time();return}
   if(c==="continue"){primaryAction();return}
 }

 if(ctx==="ready"&&c==="continue"){primaryAction();return}
}
function phoneticKey(s){
 return norm(s).replace(/[^a-z0-9 ]/g,"").split(/\s+/).map(w=>w
  .replace(/^kn/,"n").replace(/^wr/,"r").replace(/^ph/,"f")
  .replace(/tion/g,"shun").replace(/ght/g,"t").replace(/ck/g,"k")
  .replace(/[aeiouy]+/g,"a").replace(/(.)\1+/g,"$1")).join(" ")
}
function editSimilarity(a,b){
 a=norm(a);b=norm(b);if(a===b)return 1;if(!a||!b)return 0;
 const dp=Array.from({length:b.length+1},(_,j)=>j);
 for(let i=1;i<=a.length;i++){let prev=dp[0];dp[0]=i;for(let j=1;j<=b.length;j++){const old=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}
 return 1-dp[b.length]/Math.max(a.length,b.length)
}
function accepted(h,q){
 if(!q)return false;
 const heard=norm(h);
 const answers=[q.a,...(q.accept||[]),...(q.aliases||[])].filter(Boolean);
 for(const ans of answers){
  const target=norm(ans);
  if(heard===target||heard.includes(target)||target.includes(heard))return true;
  if(target.length>=5&&editSimilarity(heard,target)>=.82)return true;
  const hp=phoneticKey(heard),tp=phoneticKey(target);
  if(tp.length>=4&&(hp===tp||editSimilarity(hp,tp)>=.80))return true;
 }
 // Optional Spanish equivalents can be supplied per question as q.es.
 if(state.answerLanguage==="es"){
   for(const ans of (q.es||[])){const t=norm(ans);if(heard===t||editSimilarity(heard,t)>=.82)return true}
 }
 return false
}
function spokenLetters(s){
 const map={ay:"a",bee:"b",see:"c",sea:"c",dee:"d",eff:"f",gee:"g",aitch:"h",eye:"i",jay:"j",kay:"k",el:"l",em:"m",en:"n",oh:"o",pee:"p",cue:"q",are:"r",ess:"s",tee:"t",you:"u",vee:"v",doubleyou:"w",ex:"x",why:"y",zee:"z",zed:"z"};
 const p=norm(s).split(" ");let out="";for(const x of p){if(x.length===1)out+=x;else if(map[x])out+=map[x];else return""}return out
}
function handlePlayerVoice(h){
 const n=norm(h);if(!n)return false;
 if(/^(player|players|player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+))$/.test(n))return false;

 if(renamePending){
  const p=state.players.find(x=>x.id===renamePending.id);if(!p){renamePending=null;return false}
  if(/^(cancel|never mind|nevermind)$/.test(n)){renamePending=null;return true}
  if(/^(spell|spell it|spell the name|change the spelling)$/.test(n)){renamePending.spell=true;return true}
  if(renamePending.spell){
   const s=spokenLetters(h);
   if(s){p.name=s[0].toUpperCase()+s.slice(1);renamePending=null;players();return true}
   return true
  }
  const candidate=h.replace(/^(the name is|name is|make it|change it to|to)\s+/i,"").trim();
  if(candidate){p.name=candidate;renamePending=null;players();return true}
  return true
 }

 let m;
 // Delete / Remove
 m=h.match(/^(?:please\s+)?(?:delete|remove|get rid of|take out)\s+(?:player\s+)?(.+?)(?:\s+please)?$/i);
 if(m){
  const raw=m[1].trim(), num=spokenNumber(raw);
  if(num){
   const i=num-1;
   if(i>=0&&i<state.players.length){state.players.splice(i,1);players();return true}
  }
  const target=nameKey(raw);
  let i=state.players.findIndex(p=>nameKey(p.name)===target);
  if(i<0)i=state.players.findIndex(p=>nameKey(p.name).startsWith(target)||target.startsWith(nameKey(p.name)));
  if(i>=0){state.players.splice(i,1);players();return true}
  return false
 }

 // Rename / Change
 m=h.match(/^(?:change|rename|make|set)\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:to|as|is)\s+(.+)$/i);
 if(m){
  const i=spokenNumber(m[1])-1;
  if(i>=0){while(state.players.length<=i)state.players.push({id:uid(),name:""});state.players[i].name=m[2].trim();players();return true}
 }
 m=h.match(/^(?:i want|put|make)\s+(.+?)\s+(?:as|for)\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)$/i);
 if(m){
  const i=spokenNumber(m[2])-1;
  if(i>=0){while(state.players.length<=i)state.players.push({id:uid(),name:""});state.players[i].name=m[1].trim();players();return true}
 }
 m=h.match(/^(?:change|rename)\s+(.+?)\s+to\s+(.+)$/i);
 if(m){
  const p=state.players.find(x=>nameKey(x.name)===nameKey(m[1]));
  if(p){p.name=m[2].trim();players();return true}
 }

 // Spell
 m=n.match(/^spell\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)$/);
 if(m){
  const p=state.players[spokenNumber(m[1])-1];
  if(p){renamePending={id:p.id,spell:true};return true}
 }
 m=n.match(/^(?:change|rename)\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)$/);
 if(m){
  const p=state.players[spokenNumber(m[1])-1];
  if(p){renamePending={id:p.id,spell:false};return true}
 }

 // Multi-assign
 const chunks=h.split(/\s*(?:,| and )\s*/i);let changed=false;
 for(const chunk of chunks){
  const bm=chunk.match(/^player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:(?:is|to|should be|can be|will be)\s+)?(.+)$/i);
  if(bm){
   const i=spokenNumber(bm[1])-1;
   if(i>=0){while(state.players.length<=i)state.players.push({id:uid(),name:""});state.players[i].name=bm[2].trim();changed=true}
  }
 }
 if(changed){players();return true}

 // Natural rename shorthand: "make player two Todd" / "set player two Todd"
 m=h.match(/^(?:make|set)\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(.+)$/i);
 if(m){
  const i=spokenNumber(m[1])-1;
  if(i>=0){
   while(state.players.length<=i)state.players.push({id:uid(),name:""});
   state.players[i].name=m[2].trim();players();return true
  }
 }

 // Add only on explicit add intent.
 m=h.match(/^(?:please\s+)?add\s+(?:a\s+|another\s+)?player(?:\s+(?:named|called))?(?:\s+(.+))?$/i);
 if(m){
  const name=(m[1]||"").trim();
  state.players.push({id:uid(),name});
  players();return true
 }
 return false
}
function setVolume(v){state.volume=Math.max(0,Math.min(1,v));localStorage.setItem(STORAGE.volume,String(state.volume));const e=document.getElementById("vol");if(e)e.value=state.volume;const p=document.getElementById("volPct");if(p)p.textContent=Math.round(state.volume*100)+"%"}
function decorateVoiceTargets(){
 const aliasMap={
  "CONTINUE":"start|begin|next|go ahead|lets go|let's go|im ready|i'm ready|move on",
  "START":"begin|lets begin|let's begin|lets go|let's go|im ready|i'm ready",
  "SKIP":"no thanks|none|no extra categories",
  "BACK":"go back|previous",
  "PAUSE":"hold on|stop for a second",
  "RESUME":"keep going|continue game",
  "PASS":"skip question|skip this one|i pass|ill pass|i'll pass",
  "VOICE ON":"microphone on|turn voice on",
  "VOICE OFF":"microphone off|turn voice off"
 };
 visibleVoiceTargets().forEach(({el,label})=>{
   const key=label.replace(/\s+/g," ").trim().toUpperCase();
   if(aliasMap[key]&&!el.dataset.voiceAliases)el.dataset.voiceAliases=aliasMap[key]
 })
}
function saveActiveGame(){
 if(!state.game){localStorage.removeItem(STORAGE.activeGame);return}
 try{
  const payload={
   version:1,
   savedAt:Date.now(),
   mode:state.mode,quick:state.quick,duration:state.duration,
   questionSeconds:state.questionSeconds,categories:state.categories||[],
   industry:state.industry||"",difficulty:state.difficulty||"medium",answerLanguage:state.answerLanguage||"en",players:state.players,game:state.game
  };
  localStorage.setItem(STORAGE.activeGame,JSON.stringify(payload))
 }catch{}
}
function loadActiveGame(){
 try{return JSON.parse(localStorage.getItem(STORAGE.activeGame)||"null")}catch{return null}
}
function hasActiveGame(){const x=loadActiveGame();return !!(x&&x.game&&Array.isArray(x.game.players)&&x.game.players.length)}
function clearActiveGame(){localStorage.removeItem(STORAGE.activeGame)}
function resumeSavedGame(){
 const x=loadActiveGame();if(!x||!x.game){clearActiveGame();home();return}
 state.mode=x.mode||"friends";state.quick=!!x.quick;state.duration=x.duration||10;
 state.questionSeconds=x.questionSeconds||15;state.categories=x.categories||[];
 state.industry=x.industry||"";state.difficulty=x.difficulty||"medium";state.answerLanguage=x.answerLanguage||"en";state.players=x.players||[];
 state.game=x.game;
 // Resume cleanly at the beginning of the saved player's turn.
 const alive=state.game.players.filter(p=>!p.eliminated);
 if(!alive.length){clearActiveGame();home();return}
 state.screen="handoff";handoff()
}
function primaryAction(){
 switch(state.screen){
  case "home": chooseGame(); return true;
  case "mode": return false;
  case "industry": if(state.industry){go("difficulty");return true} return false;
  case "difficulty": go("fun"); return true;
  case "fun": funContinue(); return true;
  case "players":
   state.players=state.players.filter(p=>(p.name||"").trim());
   if(state.players.length<(state.mode==="solo"?1:2)){players();return true}
   rememberNames();go("time");return true;
  case "time": go("ready"); return true;
  case "ready": startGame(); return true;
  case "paused": resumeGame(); return true;
  default:return false;
 }
}
let navLock=false;
function go(s){
 if(navLock)return;
 navLock=true;clearRuntime();state.screen=s;render();
 setTimeout(()=>{navLock=false},220)
}
function back(){const m={mode:"home",industry:"mode",difficulty:state.mode==="work"?"industry":"mode",fun:"difficulty",players:"fun",time:"players",ready:"time"};go(m[state.screen]||"home")}
function home(){
 state.screen="home";app.innerHTML=shell("",`<div class="hero"><div class="logo">LAST ONE<br>STANDING</div><div class="tagline">THINK FAST. STAY IN THE GAME.<br><strong>3 STRIKES AND YOU’RE OUT.</strong></div><div class="build-badge">BUILD 6.0.5</div></div><div class="actions">${hasActiveGame()?`<button id="resumeSaved" class="btn primary large">RESUME GAME</button>`:""}<button id="start" class="btn ${hasActiveGame()?"":"primary"} large">START GAME</button></div>`);
 document.getElementById("start").onclick=chooseGame;const rs=document.getElementById("resumeSaved");if(rs)rs.onclick=resumeSavedGame;startMusic();startVoice("home")
}
function chooseGame(){ensureAudio();go("mode")}
function mode(){
 app.innerHTML=shell("CHOOSE YOUR GAME",`<div class="grid"><button class="btn option" data-mode="work">WORK</button><button class="btn option" data-mode="family">FAMILY</button><button class="btn option" data-mode="friends">FRIENDS</button><button class="btn option" data-mode="solo">SOLO</button><button class="btn option primary" data-mode="quick">QUICK GAME</button></div><div class="subtle center">Say “Work,” “Family,” “Friends,” “Solo,” or “Quick Game.” If speech recognition hears “Quit Game” on this screen, it will be treated as Quick Game.</div>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{const x=b.dataset.mode;if(x==="quick"){state.quick=true;state.duration=3;state.mode="friends";go("fun")}else{state.quick=false;state.mode=x;go(x==="work"?"industry":"difficulty")}});startVoice("mode")
}
function industry(){
 const selected=state.industry||"";
 const cards=WORK_INDUSTRIES.map(name=>`<button class="btn industry-choice ${selected===name?"selected":""}" data-industry="${esc(name)}">${esc(name)}</button>`).join("");
 app.innerHTML=shell("CHOOSE YOUR INDUSTRY",
   `<div class="category-intro">WORK MODE</div>
    <div class="industry-grid">${cards}</div>
    <div class="subtle center">Tap an industry or just say its name.</div>`,
   `<button id="back" class="btn">BACK</button><button id="cont" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-industry]").forEach(b=>b.onclick=()=>{state.industry=b.dataset.industry;industry()});
 document.getElementById("back").onclick=()=>go("mode");
 document.getElementById("cont").onclick=()=>{if(!state.industry)return;go("difficulty")};
 startVoice("industry");
}
function difficulty(){
 const cards=DIFFICULTIES.map(d=>`<button class="btn difficulty-choice ${state.difficulty===d.id?"selected":""}" data-difficulty="${d.id}">${d.label}</button>`).join("");
 app.innerHTML=shell("CHOOSE YOUR LEVEL",
  `<div class="category-intro">HOW HARD DO YOU WANT IT?</div>
   <div class="difficulty-grid">${cards}</div>
   <div class="subtle center">Medium is the default. Say Kids, Easy, Medium, Hard, or Savage.</div>`,
  `<button id="back" class="btn">BACK</button><button id="cont" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-difficulty]").forEach(b=>b.onclick=()=>{state.difficulty=b.dataset.difficulty;difficulty()});
 document.getElementById("back").onclick=()=>go(state.mode==="work"?"industry":"mode");
 document.getElementById("cont").onclick=()=>go("fun");
 startVoice("difficulty")
}
function funContinue(){
 voiceFeedback("✓ CONTINUE","action");
 go("players");
}
function fun(){
 const selected=new Set(state.categories||[]);
 const cards=EXTRA_CATEGORIES.map(name=>`<button class="btn category-choice ${selected.has(name)?"selected":""}" data-cat="${esc(name)}">${esc(name)}</button>`).join("");
 app.innerHTML=shell("ADD MORE CATEGORIES",
   `<div class="category-intro">MIX IN EXTRA TRIVIA</div>
    <div class="category-master"><button id="selectAllCats" class="btn primary" data-voice="${selected.size===EXTRA_CATEGORIES.length?"CLEAR ALL":"SELECT ALL"}" data-voice-aliases="${selected.size===EXTRA_CATEGORIES.length?"clear categories|remove all categories":"all categories|choose all|give me everything"}">${selected.size===EXTRA_CATEGORIES.length?"CLEAR ALL":"SELECT ALL"}</button></div>
    <div class="category-grid">${cards}</div>
    <div class="subtle center">Pick as many as you want, or say “Skip.” You can also say “Add Music,” “Add Sports,” or “Remove Geography.”</div>`,
   `<button id="skip" class="btn">SKIP</button><button id="cont" class="btn primary" data-voice="CONTINUE" data-voice-aliases="next|done|go ahead|lets go|im done|thats it|start|begin|im ready">CONTINUE</button>`);
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{
   const name=b.dataset.cat, set=new Set(state.categories||[]);
   if(set.has(name))set.delete(name);else set.add(name);
   state.categories=[...set];fun()
 });
 const allBtn=document.getElementById("selectAllCats");
 allBtn.onclick=()=>{state.categories=state.categories.length===EXTRA_CATEGORIES.length?[]:[...EXTRA_CATEGORIES];fun()};

 document.getElementById("skip").onclick=()=>{state.categories=[];go("players")};
 document.getElementById("cont").onclick=funContinue;
 startVoice("fun")
}
function players(){
 ensurePlayers();const list=state.players.map((p,i)=>`<div class="player-row"><div class="player-num">PLAYER ${i+1}</div><input data-p="${p.id}" value="${esc(p.name)}" placeholder="Name"><button class="btn" data-remove="${p.id}">×</button></div>`).join("");
 app.innerHTML=shell("WHO’S IN?",`<div class="roster-sub">ENTER THE CONTENDERS</div><div class="players-list">${list}</div><div id="rosterError" class="roster-error"></div><button id="add" class="btn">ADD PLAYER</button><div class="subtle center">Try: “Player 1 Joe,” “Change player 2 to Tom,” “Spell player 2,” or “Add player Maria.”</div>`,`<button id="back" class="btn">BACK</button><button id="continue" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-p]").forEach(e=>e.oninput=()=>{const p=state.players.find(x=>x.id===e.dataset.p);p.name=e.value});
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.players=state.players.filter(p=>p.id!==b.dataset.remove);players()});
 document.getElementById("add").onclick=()=>{state.players.push({id:uid(),name:""});players()};document.getElementById("back").onclick=back;
 document.getElementById("continue").onclick=()=>{state.players=state.players.filter(p=>(p.name||"").trim());if(state.players.length<(state.mode==="solo"?1:2)){const msg=document.getElementById("rosterError");if(msg)msg.textContent=state.mode==="solo"?"ADD A PLAYER NAME TO CONTINUE":"ADD AT LEAST TWO NAMED PLAYERS TO CONTINUE";return}rememberNames();go("time")};startVoice("players")
}
function time(){
 app.innerHTML=shell("GAME SETTINGS",`<div class="grid game-time-grid"><div class="card center game-time-card"><div class="game-time-label">QUESTION TIMER</div><div class="actions" style="margin-top:10px">${[10,15,20,30].map(s=>`<button class="btn ${state.questionSeconds===s?"selected":""}" data-sec="${s}">${s} SEC</button>`).join("")}</div></div><div class="card center game-time-card"><div class="game-time-label">GAME LENGTH</div><div class="actions" style="margin-top:10px">${[5,10,15,20].map(m=>`<button class="btn ${!state.quick&&state.duration===m?"selected":""}" data-min="${m}">${m} MIN</button>`).join("")}<button class="btn ${state.quick?"selected":""}" id="quick">QUICK GAME</button></div></div><div class="card center game-time-card"><div class="game-time-label">VOLUME</div><div class="volume-wrap" style="justify-content:center;margin-top:12px"><input id="vol" type="range" min="0" max="1" step=".05" value="${state.volume}"><strong id="volPct">${Math.round(state.volume*100)}%</strong></div></div><div class="card center game-time-card"><div class="game-time-label">VOICE RECOGNITION</div><div class="actions" style="margin-top:10px"><button id="voiceOn" class="btn ${state.voiceOn?"selected":""}">ON</button><button id="voiceOff" class="btn ${!state.voiceOn?"selected":""}">OFF</button></div></div></div>`,`<button id="back" class="btn">BACK</button><button id="continue" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{state.questionSeconds=Number(b.dataset.sec);time()});document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>{state.quick=false;state.duration=Number(b.dataset.min);time()});
 document.getElementById("quick").onclick=()=>{state.quick=true;state.duration=3;time()};document.getElementById("vol").oninput=e=>setVolume(Number(e.target.value));document.getElementById("voiceOn").onclick=()=>{state.voiceOn=true;save();time()};document.getElementById("voiceOff").onclick=()=>{state.voiceOn=false;save();time()};document.getElementById("back").onclick=back;document.getElementById("continue").onclick=()=>go("ready");startVoice("time")
}
function ready(){
 app.innerHTML=shell("READY TO PLAY?",`<div class="card center"><div style="font-size:1.5rem;font-weight:1000">${state.players.map(p=>esc(p.name)).join(" · ")}</div><div class="subtle" style="margin-top:10px">${state.quick?"QUICK GAME":state.duration+" MIN"} · ${state.questionSeconds} SEC QUESTIONS · ${state.voiceOn?"VOICE ON":"VOICE OFF"}${state.mode==="work"&&state.industry?` · ${esc(state.industry)}`:""}${state.difficulty?` · ${state.difficulty.toUpperCase()}`:""}${state.categories?.length?` · EXTRAS: ${state.categories.map(esc).join(", ")}`:""}</div><div style="margin-top:14px;font-weight:1000;color:var(--gold)">3 STRIKES AND YOU’RE OUT.</div></div>`,`<button id="back" class="btn">BACK</button><button id="play" class="btn primary large">START GAME</button>`);
 document.getElementById("back").onclick=back;document.getElementById("play").onclick=startGame;startVoice("ready")
}
function selectedPlayers(){return state.mode==="solo"?state.players.slice(0,1):state.players}
function startGame(){
 rememberNames();stopMusic();const ps=selectedPlayers();state.game={players:ps.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),startingCount:ps.length,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false,lastOutcomeDetail:""};saveActiveGame();handoff()
}
function activePlayers(){return state.game.players.filter(p=>!p.eliminated)}
function nextActive(from){const g=state.game;for(let i=1;i<=g.players.length;i++){const x=(from+i)%g.players.length;if(!g.players[x].eliminated)return x}return from}
function gamebar(showName=true){
 const p=state.game.players[state.game.idx];return `<header class="game-topbar"><div class="controls"><button id="pause" class="btn">PAUSE</button></div>${showName?`<div class="game-player">${esc(p.name)}</div>`:""}<div class="topbar-spacer"></div></header>`
}
function bindGamebar(){document.getElementById("pause").onclick=pauseGame}
function handoff(){
 clearRuntime();state.screen="handoff";saveActiveGame();const g=state.game;if(g.players[g.idx].eliminated)g.idx=nextActive(g.idx);const p=g.players[g.idx];
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(false)}<div class="handoff"><div class="handoff-player-name">${esc(p.name)}</div><div class="handoff-hype">YOU’RE UP!</div><div class="handoff-sub">${g.showdown?"FINAL SHOWDOWN":""}</div><div id="handoffCount" class="handoff-count urgent">3</div></div></div></section>`;
 bindGamebar();startVoice("handoff");let n=3;handoffTick();questionTimer=setInterval(()=>{n--;if(n>0){const e=document.getElementById("handoffCount");if(e)e.textContent=n;handoffTick()}else{clearInterval(questionTimer);questionTimer=null;transition("question",()=>question())}},700)
}
function transition(kind,done){
 clearRuntime();state.screen="transition";const map={question:["LOCK IN","QUESTION INCOMING"],next:["NEXT TURN","GET READY"],elimination:["PLAYER ELIMINATED","THE GAME CONTINUES"],showdown:["FINAL SHOWDOWN","PLAYOFF MODE"]};const [a,b]=map[kind]||map.next;
 app.innerHTML=`<section class="screen transition-screen"><div class="transition-stage"><div class="transition-glow"></div><div class="transition-copy"><div class="transition-big">${a}</div><div class="transition-small">${b}</div></div></div></section>`;sting();flowTimer=setTimeout(done,kind==="elimination"?2200:1800)
}
function pickQuestion(){
 const g=state.game;
 if(g.used.length>=QUESTIONS.length)g.used=[];
 const selected=new Set(state.categories||[]);
 let pool=QUESTIONS.map((q,i)=>({q,i})).filter(x=>!g.used.includes(x.i));
 if(selected.size){
   const preferred=pool.filter(x=>selected.has(x.q.cat));
   // Keep extras as a mix, not an exclusive filter.
   if(preferred.length && Math.random()<.55)pool=preferred;
 }
 if(!pool.length){g.used=[];pool=QUESTIONS.map((q,i)=>({q,i}))}
 const item=pool[Math.floor(Math.random()*pool.length)];
 g.used.push(item.i);return item.q
}
function question(){
 clearRuntime();state.screen="question";saveActiveGame();const g=state.game;
 const regularSeconds=Number(state.questionSeconds)||15;
 const remStart=g.showdown?Math.max(5,regularSeconds-5):regularSeconds;
 g.current=pickQuestion();g.answered=false;g.speechLog=[];
 let rem=remStart;
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(true)}<div class="question-area"><div class="question-text">${esc(g.current.q)}</div>
     ${!state.voiceOn?`<div class="keyboard-answer"><input id="typedAnswer" autocomplete="off" autocapitalize="sentences" enterkeyhint="done" placeholder="TYPE YOUR ANSWER"><button id="lockAnswer" class="btn primary">LOCK IN</button></div>`:""}<div id="timer" class="timer ${rem<=5?"urgent":""}">${rem}</div></div></div></section>`;
 bindGamebar();startVoice("question");
 tickSound(rem);
 questionTimer=setInterval(()=>{
   ensureQuestionVoice();
   rem--;
   const t=document.getElementById("timer");
   if(t){t.textContent=Math.max(0,rem);t.classList.toggle("urgent",rem<=5)}
   if(rem>0)tickSound(rem);
   if(rem<=0){clearInterval(questionTimer);questionTimer=null;finish("timeout")}
 },1000)

 if(!state.voiceOn){
   const input=document.getElementById("typedAnswer"),lock=document.getElementById("lockAnswer");
   const submitTyped=()=>{const v=input?.value?.trim();if(!v)return;if(accepted(v,g.current))finish("correct");else finish("wrong")};
   if(lock)lock.onclick=submitTyped;
   if(input){input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submitTyped()}});setTimeout(()=>input.focus(),80)}
 }
}
function finish(outcome){
 const g=state.game;if(!g||g.answered)return;g.answered=true;clearRuntime();const p=g.players[g.idx];g.lastSpeechLog=[...g.speechLog];saveActiveGame();
 if(outcome==="correct"){p.correct++;good()}else{if(outcome==="timeout"){p.timeout++;buzzer()}else{p.wrong++;bad()}p.strikes++;if(p.strikes>=3)p.eliminated=true}
 result(outcome)
}
function marks(p){
 return [0,1,2].map(i=>i<Math.min(3,p.strikes)
  ?`<span class="strike-hit">✕</span>`
  :`<span class="strike-empty">—</span>`).join(" ")
}
function standings(){return `<div class="standings">${[...state.game.players].sort((a,b)=>(a.eliminated-b.eliminated)||(a.strikes-b.strikes)||(b.correct-a.correct)).map(p=>`<div class="standing-row ${p.eliminated?"out":""}"><strong>${esc(p.name)}</strong><span>✓ ${p.correct}</span><span class="standing-strikes">${marks(p)}</span><span>${p.eliminated?"OUT":"IN"}</span></div>`).join("")}</div>`}
function result(outcome){
 state.screen="result";saveActiveGame();const g=state.game,p=g.players[g.idx],q=g.current;
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
   ${strike?`<div class="strike-box"><div>${eliminated?"THIRD STRIKE — ELIMINATED":"STRIKE"}</div><div class="strike-marks">${marks(p)}</div><div>${eliminated?esc(p.name)+" IS OUT":p.strikes+" OF 3 STRIKES"}</div></div>`:""}
   <div class="phase-heading">${phase}</div>
   ${standings()}
 </div></div></section>`;
 bindGamebar();startVoice("result");
 const delay=g.showdown?(eliminated?5200:3900):eliminated?5200:strike?4200:3200;
 flowTimer=setTimeout(advance,delay)
}
function advance(){
 clearRuntime();const g=state.game;g.lastOutcomeDetail="";g.qnum++;
 if(g.showdown){
  const out=g.players.find(p=>p.eliminated);
  if(out){const champ=g.players.find(p=>p.id!==out.id);champion(champ);return}
  g.idx=(g.idx+1)%g.players.length;transition("next",handoff);return
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
 g.idx=nextActive(g.idx);transition("next",handoff)
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
 state.screen="showdown";saveActiveGame();
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
 sting();flowTimer=setTimeout(handoff,3600)
}
function applause(){
 ensureAudio();if(!audioCtx)return;
 const now=audioCtx.currentTime;
 // Dense short noise-like claps.
 for(let burst=0;burst<12;burst++){
   const when=now+burst*.28;
   for(let i=0;i<24;i++){
     const o=audioCtx.createOscillator(),g=audioCtx.createGain();
     o.type=(i%2)?"square":"sawtooth";
     o.frequency.setValueAtTime(700+Math.random()*2500,when+Math.random()*.18);
     g.gain.setValueAtTime(.0001,when);
     g.gain.exponentialRampToValueAtTime((.004+Math.random()*.010)*state.volume,when+.006);
     g.gain.exponentialRampToValueAtTime(.0001,when+.045+Math.random()*.08);
     o.connect(g);g.connect(audioCtx.destination);o.start(when);o.stop(when+.16);
   }
 }
 // Cheer / victory rise layered over applause.
 [330,392,494,587,659,784].forEach((f,i)=>tone(f,.34,.045,"triangle",.10+i*.09));
 setTimeout(()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.42,.04,"triangle",i*.07))},900);
}
function champion(p){
 clearRuntime();stopMusic();clearActiveGame();state.screen="complete";
 app.innerHTML=`<section class="screen complete-screen"><div class="confetti" id="confetti"></div><div class="complete-stage">
   <div class="complete-kicker champion-los">LAST ONE<br>STANDING</div>
   <div class="champion-box">
     <div class="champion-name">${esc(p.name)}</div>
     <div class="champion-label">CHAMPION</div>
   </div>
   <button id="home" class="btn primary large">BACK TO HOME</button>
 </div></section>`;
 document.getElementById("home").onclick=()=>{state.game=null;home()};
 victory();applause();confetti();
}
function victory(){[220,330,440,660].forEach((f,i)=>tone(f,.28,.08,"triangle",i*.12))}
function confetti(){
 const box=document.getElementById("confetti");if(!box)return;
 const spawn=()=>{
   if(state.screen!=="complete")return;
   for(let i=0;i<22;i++){
     const x=document.createElement("i");x.style.left=Math.random()*100+"%";x.style.animationDuration=(2.1+Math.random()*2)+"s";x.style.animationDelay=Math.random()*.25+"s";x.style.transform=`rotate(${Math.random()*180}deg)`;box.appendChild(x);
     setTimeout(()=>x.remove(),4500)
   }
 };
 spawn();const id=setInterval(()=>{if(state.screen!=="complete"){clearInterval(id);return}spawn()},700)
}
function pauseGame(){
 if(!state.game)return;pausedFrom=state.screen;clearRuntime();state.screen="paused";const o=document.createElement("div");o.className="overlay";o.id="pauseOverlay";o.innerHTML=`<div class="pause-card card"><div class="pause-title">GAME PAUSED</div><div class="pause-volume"><span>VOLUME</span><input id="pauseVol" type="range" min="0" max="1" step=".05" value="${state.volume}"><strong id="pauseVolPct">${Math.round(state.volume*100)}%</strong></div><button id="resume" class="btn primary large">RESUME</button><button id="leave" class="btn">LEAVE GAME</button><button id="end" class="btn danger">QUIT</button></div>`;document.body.appendChild(o);document.getElementById("resume").onclick=resumeGame;document.getElementById("leave").onclick=leaveGame;document.getElementById("end").onclick=confirmEnd;document.getElementById("pauseVol").oninput=e=>{setVolume(Number(e.target.value));document.getElementById("pauseVolPct").textContent=Math.round(state.volume*100)+"%"};startVoice("paused")
}
function resumeGame(){document.getElementById("pauseOverlay")?.remove();if(pausedFrom==="question")question();else handoff()}
function leaveGame(){document.getElementById("pauseOverlay")?.remove();saveActiveGame();state.game=null;home()}
function confirmEnd(){const c=document.querySelector(".pause-card");if(!c)return;c.innerHTML=`<div class="pause-title">END THIS GAME?</div><button id="yes" class="btn danger large">YES, END GAME</button><button id="no" class="btn">CANCEL</button>`;document.getElementById("yes").onclick=()=>{document.getElementById("pauseOverlay")?.remove();clearActiveGame();state.game=null;home()};document.getElementById("no").onclick=()=>{document.getElementById("pauseOverlay")?.remove();pauseGame()}}
function render(){clearRuntime();({home,mode,industry,difficulty,fun,players,time,ready,handoff,question,result}[state.screen]||home)()}
function viewport(){document.documentElement.style.setProperty("--app-h",(window.visualViewport?.height||window.innerHeight)+"px")}
window.addEventListener("resize",viewport,{passive:true});window.visualViewport?.addEventListener("resize",viewport,{passive:true});
window.addEventListener("pointerdown",()=>{ensureAudio();if(["home","mode","industry","difficulty","fun","players","time","ready"].includes(state.screen))startMusic()},{passive:true});
document.documentElement.dataset.build="6.0.5";
try{viewport();home()}
catch(err){
 console.error("LOS startup error",err);
 app.innerHTML=`<section class="screen"><div class="shell"><div class="content"><div class="card"><h1>LAST ONE STANDING</h1><p>Build 6.0.5 could not start.</p><p class="subtle">${esc(err?.message||"Unknown startup error")}</p></div></div></div></section>`
}
})();
