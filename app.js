
(()=>{
"use strict";
const BUILD="Clean Foundation 5.0";
const app=document.getElementById("app");
const STORAGE={names:"los5_names",voice:"los5_voice",volume:"los5_volume"};
const QUESTIONS=[
 {q:"What gas do humans need to breathe to survive?",a:"oxygen",alts:["oxygen"]},
 {q:"What planet is known as the Red Planet?",a:"Mars",alts:["mars"]},
 {q:"What is the largest ocean on Earth?",a:"Pacific Ocean",alts:["pacific","pacific ocean"]},
 {q:"How many days are in a leap year?",a:"366",alts:["366","three hundred sixty six","three hundred and sixty six"]},
 {q:"What is the capital of California?",a:"Sacramento",alts:["sacramento"]},
 {q:"What animal is known as man's best friend?",a:"Dog",alts:["dog","a dog"]},
 {q:"What color do you get when you mix blue and yellow?",a:"Green",alts:["green"]},
 {q:"How many sides does a triangle have?",a:"3",alts:["3","three"]},
 {q:"What is frozen water called?",a:"Ice",alts:["ice"]},
 {q:"What is the opposite of north?",a:"South",alts:["south"]},
 {q:"What fruit is traditionally used to make guacamole?",a:"Avocado",alts:["avocado"]},
 {q:"Which month comes after June?",a:"July",alts:["july"]},
 {q:"What is 5 times 5?",a:"25",alts:["25","twenty five"]},
 {q:"Which animal says moo?",a:"Cow",alts:["cow","a cow"]},
 {q:"What do bees make?",a:"Honey",alts:["honey"]},
 {q:"What is the first letter of the alphabet?",a:"A",alts:["a","letter a"]},
 {q:"What shape has four equal sides?",a:"Square",alts:["square"]},
 {q:"What star is closest to Earth?",a:"The Sun",alts:["sun","the sun"]},
 {q:"What instrument has black and white keys?",a:"Piano",alts:["piano"]},
 {q:"Which season comes after summer?",a:"Fall",alts:["fall","autumn"]}
];
let state={
 screen:"home",mode:"friends",players:[],selectedIds:[],duration:15,questionSeconds:15,
 quick:false,voiceOn:localStorage.getItem(STORAGE.voice)!=="false",
 volume:Number(localStorage.getItem(STORAGE.volume)||.65),game:null
};
let recognition=null,voiceContext="",questionTimer=null,flowTimer=null,audioCtx=null,musicTimer=null,pausedRemaining=null,pausedFrom=null;
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=s=>String(s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
const save=()=>localStorage.setItem(STORAGE.voice,String(state.voiceOn));
function ensureAudio(){if(!audioCtx)try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch{};if(audioCtx?.state==="suspended")audioCtx.resume()}
function tone(freq=440,d=.05,gain=.06,type="sine",delay=0){
 ensureAudio();if(!audioCtx)return;const now=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain*state.volume),now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+d);
 o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+d+.02)
}
function tickSound(rem){if(rem>5)tone(470,.035,.045,"square");else if(rem>0){tone(760,.035,.075,"square");setTimeout(()=>tone(830,.03,.06,"square"),280);if(rem<=3)setTimeout(()=>tone(900,.026,.055,"square"),540)}}
function buzzer(){tone(175,.22,.12,"square");tone(150,.24,.11,"square",.17)}
function good(){tone(620,.08,.07,"triangle");tone(820,.12,.07,"triangle",.08)}
function bad(){tone(220,.13,.09,"square")}
function sting(){tone(360,.09,.06,"triangle");tone(520,.12,.07,"triangle",.1);tone(680,.15,.06,"triangle",.2)}
function startMusic(){stopMusic();ensureAudio();let step=0;musicTimer=setInterval(()=>{if(["question","handoff","result","paused","transition"].includes(state.screen))return;const seq=[220,277,330,440];tone(seq[step++%seq.length],.12,.018,"triangle")},700)}
function stopMusic(){clearInterval(musicTimer);musicTimer=null}
function clearRuntime(){clearInterval(questionTimer);questionTimer=null;clearTimeout(flowTimer);flowTimer=null;stopVoice()}
function shell(title,content,footer=""){return `<section class="screen"><div class="shell"><header class="topbar"><div></div><div class="topbar-title">${title||""}</div><div></div></header><div class="content">${content}</div><footer class="footer">${footer}</footer></div></section>`}
function remembered(){try{return JSON.parse(localStorage.getItem(STORAGE.names)||"[]")}catch{return[]}}
function rememberNames(){const ns=state.players.map(p=>p.name.trim()).filter(Boolean);localStorage.setItem(STORAGE.names,JSON.stringify([...new Set([...remembered(),...ns])].slice(-50)))}
function ensurePlayers(){
 if(!state.players.length)state.players=[{id:uid(),name:"Vicente"},{id:uid(),name:"Todd"},{id:uid(),name:"Maria"}];
 if(state.mode==="solo")state.players=state.players.slice(0,1);
 state.selectedIds=state.players.filter(p=>p.name.trim()).map(p=>p.id)
}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function stopVoice(){try{recognition?.abort()}catch{}recognition=null;voiceContext=""}
function startVoice(ctx){
 stopVoice();if(!state.voiceOn||!speechSupported())return;voiceContext=ctx;
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 const run=()=>{if(!state.voiceOn||voiceContext!==ctx)return;try{
   const r=new SR();recognition=r;r.lang="en-US";r.interimResults=true;r.continuous=false;r.maxAlternatives=5;
   r.onresult=e=>{for(let x=e.resultIndex;x<e.results.length;x++)for(let i=0;i<e.results[x].length;i++){const h=e.results[x][i].transcript.trim();if(h)heard(ctx,h);if(voiceContext!==ctx)return}};
   r.onend=()=>{recognition=null;if(state.voiceOn&&voiceContext===ctx)setTimeout(run,120)};r.onerror=()=>{};r.start()
 }catch{setTimeout(run,220)}};run()
}
function globalCmd(h){
 const n=norm(h);
 if(/^(back|go back|previous)$/.test(n))return"back";
 if(/^(continue|start|lets start|let s start|go|next)$/.test(n))return"continue";
 if(/^(pause|pause game)$/.test(n))return"pause";
 if(/^(resume|resume game|continue game)$/.test(n))return"resume";
 if(/^(leave game|exit game)$/.test(n))return"leave";
 if(/^(end game)$/.test(n))return"end";
 if(/^(volume up|turn it up|louder)$/.test(n))return"volup";
 if(/^(volume down|turn it down|quieter)$/.test(n))return"voldown";
 if(/^(mute)$/.test(n))return"mute";
 if(/^(unmute)$/.test(n))return"unmute";
 const m=n.match(/^volume\s+(\d{1,3})$/);if(m)return"vol:"+Math.min(100,Number(m[1]));
 if(/^(what did you hear|repeat what you heard|what was heard)$/.test(n))return"heard";
 return""
}
function heard(ctx,h){
 const c=globalCmd(h);
 if(c==="volup"){setVolume(state.volume+.1);return} if(c==="voldown"){setVolume(state.volume-.1);return}
 if(c==="mute"){setVolume(0);return} if(c==="unmute"){setVolume(.65);return} if(c.startsWith("vol:")){setVolume(Number(c.slice(4))/100);return}
 if(ctx==="question"){
   state.game.speechLog.push(h);
   if(c==="pause"){pauseGame();return}
   if(/^(pass|i pass|skip|skip it|skip this one|skip question|next question)$/.test(norm(h))){finish("pass");return}
   if(accepted(h,state.game.current)){finish("correct");return}
   return
 }
 if(ctx==="paused"){if(c==="resume")resumeGame();else if(c==="leave")leaveGame();else if(c==="end")confirmEnd();return}
 if(c==="back"){back();return}
 if(ctx==="home"&&(/^(start game|start|lets play|let s play|play)$/.test(norm(h))||c==="continue")){chooseGame();return}
 if(ctx==="mode"){
   const n=norm(h);
   if(/^(quick|quick game|quit game|start a quick game|start quick game)$/.test(n)){state.quick=true;state.duration=3;go("players");return}
   if(/^(work|work game)$/.test(n)){state.mode="work";go("players");return}
   if(/^(family|family game)$/.test(n)){state.mode="family";go("players");return}
   if(/^(friends|friend|friends game)$/.test(n)){state.mode="friends";go("players");return}
   if(/^(solo|solo game)$/.test(n)){state.mode="solo";go("players");return}
 }
 if(ctx==="fun"){if(/^(skip|skip this|no thanks)$/.test(norm(h))||c==="continue"){go("players");return}}
 if(ctx==="players"){if(handlePlayerVoice(h))return;if(c==="continue"){go("time");return}}
 if(ctx==="time"){
   const n=norm(h);let m=n.match(/^(\d+)\s*seconds?$/);if(m){state.questionSeconds=Math.max(5,Math.min(30,Number(m[1])));time();return}
   m=n.match(/^(\d+)\s*minutes?$/);if(m){state.duration=Number(m[1]);state.quick=false;time();return}
   if(/^(quick|quick game|quit game)$/.test(n)){state.quick=true;state.duration=3;time();return}
   if(c==="continue"){go("ready");return}
 }
 if(ctx==="ready"&&c==="continue"){startGame();return}
}
function accepted(spoken,q){const n=norm(spoken);return q.alts.some(a=>{const x=norm(a);return n===x||n.includes(x)})}
let renamePending=null;
function spokenLetters(s){
 const map={ay:"a",bee:"b",see:"c",sea:"c",dee:"d",eff:"f",gee:"g",aitch:"h",eye:"i",jay:"j",kay:"k",el:"l",em:"m",en:"n",oh:"o",pee:"p",cue:"q",are:"r",ess:"s",tee:"t",you:"u",vee:"v",doubleyou:"w",ex:"x",why:"y",zee:"z",zed:"z"};
 const p=norm(s).split(" ");let out="";for(const x of p){if(x.length===1)out+=x;else if(map[x])out+=map[x];else return""}return out
}
function handlePlayerVoice(h){
 const n=norm(h);
 if(renamePending){
  const p=state.players.find(x=>x.id===renamePending.id);if(!p){renamePending=null;return false}
  if(/^(cancel|never mind|nevermind)$/.test(n)){renamePending=null;return true}
  if(/^(spell|spell it|spell the name)$/.test(n)){renamePending.spell=true;return true}
  if(renamePending.spell){const s=spokenLetters(h);if(s){p.name=s[0].toUpperCase()+s.slice(1);renamePending=null;players();return true}return true}
  p.name=h.trim();renamePending=null;players();return true
 }
 let m=h.match(/player\s*(\d+)\s+(?:is|to|should be|can be)?\s*(.+)$/i);
 if(m){const i=Number(m[1])-1;if(i>=0){while(state.players.length<=i)state.players.push({id:uid(),name:""});state.players[i].name=m[2].trim();players();return true}}
 m=h.match(/(?:change|rename)\s+player\s*(\d+)\s+to\s+(.+)$/i);
 if(m){const p=state.players[Number(m[1])-1];if(p){p.name=m[2].trim();players();return true}}
 m=h.match(/(?:change|rename)\s+(.+?)\s+to\s+(.+)$/i);
 if(m){const p=state.players.find(x=>norm(x.name)===norm(m[1]));if(p){p.name=m[2].trim();players();return true}}
 m=n.match(/^(?:change|rename)\s+player\s*(\d+)$/);if(m){const p=state.players[Number(m[1])-1];if(p){renamePending={id:p.id,spell:false};return true}}
 m=n.match(/^spell\s+player\s*(\d+)$/);if(m){const p=state.players[Number(m[1])-1];if(p){renamePending={id:p.id,spell:true};return true}}
 m=h.match(/^add player(?:\s+(.+))?$/i);if(m){state.players.push({id:uid(),name:(m[1]||"").trim()});players();return true}
 return false
}
function setVolume(v){state.volume=Math.max(0,Math.min(1,v));localStorage.setItem(STORAGE.volume,String(state.volume));const e=document.getElementById("vol");if(e)e.value=state.volume;const p=document.getElementById("volPct");if(p)p.textContent=Math.round(state.volume*100)+"%"}
function go(s){clearRuntime();state.screen=s;render()}
function back(){const m={mode:"home",fun:"mode",players:"fun",time:"players",ready:"time"};go(m[state.screen]||"home")}
function home(){
 state.screen="home";app.innerHTML=shell("",`<div class="hero"><div class="logo">LAST ONE<br>STANDING</div><div class="tagline">THINK FAST. STAY IN THE GAME.<br><strong>3 STRIKES AND YOU’RE OUT.</strong></div></div><div class="actions"><button id="start" class="btn primary large">START GAME</button></div>`);
 document.getElementById("start").onclick=chooseGame;startMusic();startVoice("home")
}
function chooseGame(){ensureAudio();go("mode")}
function mode(){
 app.innerHTML=shell("CHOOSE YOUR GAME",`<div class="grid"><button class="btn option" data-mode="work">WORK</button><button class="btn option" data-mode="family">FAMILY</button><button class="btn option" data-mode="friends">FRIENDS</button><button class="btn option" data-mode="solo">SOLO</button><button class="btn option primary" data-mode="quick">QUICK GAME</button></div><div class="subtle center">Say “Work,” “Family,” “Friends,” “Solo,” or “Quick Game.” If speech recognition hears “Quit Game” on this screen, it will be treated as Quick Game.</div>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{const x=b.dataset.mode;if(x==="quick"){state.quick=true;state.duration=3;state.mode="friends"}else{state.quick=false;state.mode=x}go("fun")});startVoice("mode")
}
function fun(){
 app.innerHTML=shell("ADD SOME FUN",`<div class="card center"><div style="font-size:1.5rem;font-weight:1000">Optional extras can live here.</div><div class="subtle" style="margin-top:8px">Choose anything you want — or just say “Skip.”</div></div>`,`<button id="skip" class="btn">SKIP</button><button id="cont" class="btn primary">CONTINUE</button>`);
 document.getElementById("skip").onclick=()=>go("players");document.getElementById("cont").onclick=()=>go("players");startVoice("fun")
}
function players(){
 ensurePlayers();const list=state.players.map((p,i)=>`<div class="player-row"><div class="player-num">PLAYER ${i+1}</div><input data-p="${p.id}" value="${esc(p.name)}" placeholder="Name"><button class="btn" data-remove="${p.id}">×</button></div>`).join("");
 app.innerHTML=shell("YOUR PLAYERS",`<div class="players-list">${list}</div><button id="add" class="btn">ADD PLAYER</button><div class="subtle center">Try: “Player 1 Joe,” “Change player 2 to Tom,” “Spell player 2,” or “Add player Maria.”</div>`,`<button id="back" class="btn">BACK</button><button id="continue" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-p]").forEach(e=>e.oninput=()=>{const p=state.players.find(x=>x.id===e.dataset.p);p.name=e.value});
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.players=state.players.filter(p=>p.id!==b.dataset.remove);players()});
 document.getElementById("add").onclick=()=>{state.players.push({id:uid(),name:""});players()};document.getElementById("back").onclick=back;
 document.getElementById("continue").onclick=()=>{state.players=state.players.filter(p=>p.name.trim());if(state.players.length<(state.mode==="solo"?1:2))return;rememberNames();go("time")};startVoice("players")
}
function time(){
 app.innerHTML=shell("GAME TIME",`<div class="grid"><div class="card center"><div style="font-weight:1000">QUESTION TIMER</div><div class="actions" style="margin-top:10px">${[10,15,20,30].map(s=>`<button class="btn ${state.questionSeconds===s?"selected":""}" data-sec="${s}">${s} SEC</button>`).join("")}</div></div><div class="card center"><div style="font-weight:1000">GAME LENGTH</div><div class="actions" style="margin-top:10px">${[5,10,15,20].map(m=>`<button class="btn ${!state.quick&&state.duration===m?"selected":""}" data-min="${m}">${m} MIN</button>`).join("")}<button class="btn ${state.quick?"selected":""}" id="quick">QUICK GAME</button></div></div><div class="card center"><div style="font-weight:1000">VOLUME</div><div class="volume-wrap" style="justify-content:center;margin-top:12px"><input id="vol" type="range" min="0" max="1" step=".05" value="${state.volume}"><strong id="volPct">${Math.round(state.volume*100)}%</strong></div></div><div class="card center"><div style="font-weight:1000">VOICE RECOGNITION</div><div class="actions" style="margin-top:10px"><button id="voiceOn" class="btn ${state.voiceOn?"selected":""}">ON</button><button id="voiceOff" class="btn ${!state.voiceOn?"selected":""}">OFF</button></div></div></div>`,`<button id="back" class="btn">BACK</button><button id="continue" class="btn primary">CONTINUE</button>`);
 document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{state.questionSeconds=Number(b.dataset.sec);time()});document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>{state.quick=false;state.duration=Number(b.dataset.min);time()});
 document.getElementById("quick").onclick=()=>{state.quick=true;state.duration=3;time()};document.getElementById("vol").oninput=e=>setVolume(Number(e.target.value));document.getElementById("voiceOn").onclick=()=>{state.voiceOn=true;save();time()};document.getElementById("voiceOff").onclick=()=>{state.voiceOn=false;save();time()};document.getElementById("back").onclick=back;document.getElementById("continue").onclick=()=>go("ready");startVoice("time")
}
function ready(){
 app.innerHTML=shell("READY TO PLAY?",`<div class="card center"><div style="font-size:1.5rem;font-weight:1000">${state.players.map(p=>esc(p.name)).join(" · ")}</div><div class="subtle" style="margin-top:10px">${state.quick?"QUICK GAME":state.duration+" MIN"} · ${state.questionSeconds} SEC QUESTIONS · ${state.voiceOn?"VOICE ON":"VOICE OFF"}</div><div style="margin-top:14px;font-weight:1000;color:var(--gold)">3 STRIKES AND YOU’RE OUT.</div></div>`,`<button id="back" class="btn">BACK</button><button id="play" class="btn primary large">START GAME</button>`);
 document.getElementById("back").onclick=back;document.getElementById("play").onclick=startGame;startVoice("ready")
}
function selectedPlayers(){return state.mode==="solo"?state.players.slice(0,1):state.players}
function startGame(){
 rememberNames();stopMusic();const ps=selectedPlayers();state.game={players:ps.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),startingCount:ps.length,idx:0,qnum:0,used:[],current:null,answered:false,started:Date.now(),speechLog:[],lastSpeechLog:[],showdown:false};handoff()
}
function activePlayers(){return state.game.players.filter(p=>!p.eliminated)}
function nextActive(from){const g=state.game;for(let i=1;i<=g.players.length;i++){const x=(from+i)%g.players.length;if(!g.players[x].eliminated)return x}return from}
function gamebar(showName=true){
 const p=state.game.players[state.game.idx];return `<header class="game-topbar"><div class="controls"><button id="pause" class="btn">PAUSE</button></div>${showName?`<div class="game-player">${esc(p.name)}</div>`:""}<div class="volume-wrap"><input id="vol" type="range" min="0" max="1" step=".05" value="${state.volume}"></div></header>`
}
function bindGamebar(){document.getElementById("pause").onclick=pauseGame;const v=document.getElementById("vol");if(v)v.oninput=e=>setVolume(Number(e.target.value))}
function handoff(){
 clearRuntime();state.screen="handoff";const g=state.game;if(g.players[g.idx].eliminated)g.idx=nextActive(g.idx);const p=g.players[g.idx];
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(false)}<div class="handoff"><div class="handoff-player-name">${esc(p.name)}</div><div class="handoff-hype">YOU’RE UP!</div><div class="handoff-sub">${g.showdown?"FINAL SHOWDOWN":"IT’S YOUR TURN"}</div><div id="handoffCount" class="handoff-count urgent">3</div></div></div></section>`;
 bindGamebar();startVoice("handoff");let n=3;tickSound(n);questionTimer=setInterval(()=>{n--;if(n>0){const e=document.getElementById("handoffCount");if(e)e.textContent=n;tickSound(n)}else{clearInterval(questionTimer);questionTimer=null;transition("question",()=>question())}},700)
}
function transition(kind,done){
 clearRuntime();state.screen="transition";const map={question:["LOCK IN","QUESTION INCOMING"],next:["NEXT TURN","GET READY"],elimination:["PLAYER ELIMINATED","THE GAME CONTINUES"],showdown:["FINAL SHOWDOWN","PLAYOFF MODE"]};const [a,b]=map[kind]||map.next;
 app.innerHTML=`<section class="screen transition-screen"><div class="transition-stage"><div class="transition-glow"></div><div class="transition-copy"><div class="transition-big">${a}</div><div class="transition-small">${b}</div></div></div></section>`;sting();flowTimer=setTimeout(done,kind==="elimination"?2200:1800)
}
function pickQuestion(){const g=state.game;if(g.used.length>=QUESTIONS.length)g.used=[];let i;do{i=Math.floor(Math.random()*QUESTIONS.length)}while(g.used.includes(i));g.used.push(i);return QUESTIONS[i]}
function question(){
 clearRuntime();state.screen="question";const g=state.game,p=g.players[g.idx];g.current=pickQuestion();g.answered=false;g.speechLog=[];let rem=g.showdown?Math.max(5,state.questionSeconds-5):state.questionSeconds;
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(true)}<div class="question-area"><div class="question-text">${esc(g.current.q)}</div><div id="timer" class="timer ${rem<=5?"urgent":""}">${rem}</div></div></div></section>`;bindGamebar();startVoice("question");tickSound(rem);
 questionTimer=setInterval(()=>{rem--;const t=document.getElementById("timer");if(t){t.textContent=Math.max(0,rem);t.classList.toggle("urgent",rem<=5)}if(rem>0)tickSound(rem);if(rem<=0){clearInterval(questionTimer);questionTimer=null;finish("timeout")}},1000)
}
function finish(outcome){
 const g=state.game;if(!g||g.answered)return;g.answered=true;clearRuntime();const p=g.players[g.idx];g.lastSpeechLog=[...g.speechLog];
 if(outcome==="correct"){p.correct++;good()}else{if(outcome==="timeout"){p.timeout++;buzzer()}else{p.wrong++;bad()}p.strikes++;if(p.strikes>=3)p.eliminated=true}
 result(outcome)
}
function marks(p){return "✕".repeat(Math.min(3,p.strikes))+"○".repeat(Math.max(0,3-p.strikes))}
function standings(){return `<div class="standings">${[...state.game.players].sort((a,b)=>(a.eliminated-b.eliminated)||(a.strikes-b.strikes)||(b.correct-a.correct)).map(p=>`<div class="standing-row ${p.eliminated?"out":""}"><strong>${esc(p.name)}</strong><span>✓ ${p.correct}</span><span style="color:var(--red)">${marks(p)}</span><span>${p.eliminated?"OUT":"IN"}</span></div>`).join("")}</div>`}
function result(outcome){
 state.screen="result";const g=state.game,p=g.players[g.idx],q=g.current;const label=outcome==="correct"?"CORRECT!":outcome==="pass"?"PASSED":outcome==="timeout"?"TIME’S UP":"NOT QUITE";const strike=outcome!=="correct";const eliminated=strike&&p.eliminated;
 app.innerHTML=`<section class="screen"><div class="game-shell">${gamebar(true)}<div class="result-body"><div class="result-word">${label}</div><div class="answer-label">CORRECT ANSWER</div><div class="answer-big">${esc(q.answer)}</div>${strike?`<div class="strike-box"><div>${eliminated?"THIRD STRIKE":"STRIKE"}</div><div class="strike-marks">${marks(p)}</div><div>${eliminated?esc(p.name)+" HAS BEEN ELIMINATED":p.strikes+" OF 3 STRIKES"}</div></div>`:""}<div class="subtle">${g.showdown?"FINAL SHOWDOWN — 3 STRIKES AND YOU’RE OUT":"CURRENT STANDINGS"}</div>${standings()}</div></div></section>`;bindGamebar();startVoice("result");
 const delay=g.showdown?(eliminated?5200:3800):eliminated?5200:strike?4000:3000;flowTimer=setTimeout(advance,delay)
}
function advance(){
 clearRuntime();const g=state.game;g.qnum++;
 if(g.showdown){const out=g.players.find(p=>p.eliminated);if(out){const champ=g.players.find(p=>p.id!==out.id);champion(champ);return}g.idx=(g.idx+1)%g.players.length;transition("next",handoff);return}
 if(g.startingCount>2&&activePlayers().length<=2){transition("elimination",showdownIntro);return}
 const expired=!state.quick&&(Date.now()-g.started)/60000>=state.duration;
 if(expired||g.qnum>=(state.quick?6:40)){transition("showdown",showdownIntro);return}
 g.idx=nextActive(g.idx);transition("next",handoff)
}
function showdownIntro(){
 const g=state.game;const survivors=activePlayers();const finalists=(survivors.length===2?survivors:[...g.players].sort((a,b)=>(a.strikes-b.strikes)||(b.correct-a.correct)).slice(0,2));
 g.players=finalists.map(p=>({...p,strikes:0,eliminated:false}));g.idx=0;g.showdown=true;g.qnum=0;g.used=[];
 state.screen="showdown";const secs=Math.max(5,state.questionSeconds-5);
 app.innerHTML=shell("FINAL SHOWDOWN",`<div class="showdown-card card"><div class="subtle">THE PLAYOFF BEGINS</div><div class="showdown-title">FINAL SHOWDOWN</div><div class="showdown-vs"><div class="showdown-name">${esc(g.players[0].name)}</div><div class="vs">VS</div><div class="showdown-name">${esc(g.players[1].name)}</div></div><div style="font-weight:1000">3 STRIKES AND YOU’RE OUT.</div><div class="subtle">${secs}-second playoff questions</div></div>`);sting();flowTimer=setTimeout(handoff,3200)
}
function champion(p){
 clearRuntime();stopMusic();state.screen="complete";app.innerHTML=shell("GAME COMPLETE",`<div class="confetti" id="confetti"></div><div class="card center"><div class="subtle">LAST ONE STANDING</div><div class="champion">${esc(p.name)}</div><div style="font-size:1.4rem;font-weight:1000">CHAMPION</div></div>`,`<button id="home" class="btn primary">BACK TO HOME</button>`);document.getElementById("home").onclick=()=>{state.game=null;home()};victory();confetti()
}
function victory(){[220,330,440,660].forEach((f,i)=>tone(f,.25,.08,"triangle",i*.12))}
function confetti(){const box=document.getElementById("confetti");if(!box)return;for(let i=0;i<70;i++){const x=document.createElement("i");x.style.left=Math.random()*100+"%";x.style.animationDelay=Math.random()*.7+"s";x.style.transform=`rotate(${Math.random()*180}deg)`;box.appendChild(x)}}
function pauseGame(){
 if(!state.game)return;pausedFrom=state.screen;clearRuntime();state.screen="paused";const o=document.createElement("div");o.className="overlay";o.id="pauseOverlay";o.innerHTML=`<div class="pause-card card"><div class="pause-title">GAME PAUSED</div><button id="resume" class="btn primary large">RESUME</button><button id="leave" class="btn">LEAVE GAME</button><button id="end" class="btn danger">END GAME</button></div>`;document.body.appendChild(o);document.getElementById("resume").onclick=resumeGame;document.getElementById("leave").onclick=leaveGame;document.getElementById("end").onclick=confirmEnd;startVoice("paused")
}
function resumeGame(){document.getElementById("pauseOverlay")?.remove();if(pausedFrom==="question")question();else handoff()}
function leaveGame(){document.getElementById("pauseOverlay")?.remove();state.game=null;home()}
function confirmEnd(){const c=document.querySelector(".pause-card");if(!c)return;c.innerHTML=`<div class="pause-title">END THIS GAME?</div><button id="yes" class="btn danger large">YES, END GAME</button><button id="no" class="btn">CANCEL</button>`;document.getElementById("yes").onclick=()=>{document.getElementById("pauseOverlay")?.remove();state.game=null;home()};document.getElementById("no").onclick=()=>{document.getElementById("pauseOverlay")?.remove();pauseGame()}}
function render(){clearRuntime();({home,mode,fun,players,time,ready,handoff,question,result}[state.screen]||home)()}
function viewport(){document.documentElement.style.setProperty("--app-h",(window.visualViewport?.height||window.innerHeight)+"px")}
window.addEventListener("resize",viewport,{passive:true});window.visualViewport?.addEventListener("resize",viewport,{passive:true});
window.addEventListener("pointerdown",()=>{ensureAudio();if(["home","mode","fun","players","time","ready"].includes(state.screen))startMusic()},{passive:true});
viewport();home();
})();
