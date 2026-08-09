(function(){
"use strict";

const app=document.getElementById("app");
const BUILD="Clean Build 3.9 Host Voices";
const STORAGE={
  names:"los_b3_names",
  volume:"los_b3_volume",
  voice:"los_b3_voice",
  session:"los_b3_session",
  hostStyle:"los_b3_host_style"
};

const QUESTIONS=[
{q:"What is the capital of France?",answer:"Paris",accepted:["paris"]},
{q:"Which ocean is the largest on Earth?",answer:"Pacific Ocean",accepted:["pacific ocean","the pacific ocean","pacific","oceano pacifico","océano pacífico"]},
{q:"How many sides does a hexagon have?",answer:"Six",accepted:["six","6"]},
{q:"What planet is known as the Red Planet?",answer:"Mars",accepted:["mars"]},
{q:"What gas do humans need to breathe to survive?",answer:"Oxygen",accepted:["oxygen","oxigeno","oxígeno"]},
{q:"What is twelve times twelve?",answer:"144",accepted:["144","one hundred forty four","one hundred and forty four"]},
{q:"What is the freezing point of water in Celsius?",answer:"Zero degrees Celsius",accepted:["zero","0","zero degrees","0 degrees","zero degrees celsius"]},
{q:"Which animal is commonly called the king of the jungle?",answer:"Lion",accepted:["lion","a lion","the lion"]},
{q:"What color do you get when you mix blue and yellow?",answer:"Green",accepted:["green"]},
{q:"What is the name of the toy cowboy in Toy Story?",answer:"Woody",accepted:["woody"]},
{q:"What sport uses the terms love, deuce, and ace?",answer:"Tennis",accepted:["tennis"]},
{q:"Which country is famous for the pyramids of Giza?",answer:"Egypt",accepted:["egypt"]},
{q:"What is the largest mammal in the world?",answer:"Blue whale",accepted:["blue whale","a blue whale","the blue whale"]},
{q:"What is five squared?",answer:"Twenty-five",accepted:["25","twenty five"]},
{q:"What instrument has black and white keys and is commonly played with both hands?",answer:"Piano",accepted:["piano","a piano","the piano"]},
{q:"What is the opposite of north on a compass?",answer:"South",accepted:["south"]},
{q:"Which month has an extra day during a leap year?",answer:"February",accepted:["february"]},
{q:"What is the chemical symbol for gold?",answer:"Au",accepted:["au","a u"]},
{q:"What do bees make?",answer:"Honey",accepted:["honey"]},
{q:"How many minutes are in one hour?",answer:"Sixty",accepted:["60","sixty"]},
{q:"Which planet is closest to the Sun?",answer:"Mercury",accepted:["mercury"]},
{q:"What is the largest continent?",answer:"Asia",accepted:["asia"]},
{q:"What is the square root of eighty-one?",answer:"Nine",accepted:["9","nine"]},
{q:"What is the main language spoken in Brazil?",answer:"Portuguese",accepted:["portuguese"]},
{q:"How many days are in a standard year?",answer:"365",accepted:["365","three hundred sixty five","three hundred and sixty five"]}
];

const WORK_TYPES=[
  ["transit","Transit"],["healthcare","Healthcare"],["first-responders","First Responders"],
  ["restaurant","Restaurant / Fast Food"],["retail","Retail"],["customer-service","Customer Service"],
  ["office","Office / Corporate"],["warehouse","Warehouse / Logistics"],["other","Other"]
];
const FUN_PACKS=["Music","Things That Make You Say Hmm","Real or Made Up?","Math","I Should Have Known That","Movies","Sports","Food","Science","History","Random Facts"];

function loadJSON(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function loadNum(k,f){const n=Number(localStorage.getItem(k));return Number.isFinite(n)?n:f}
function loadBool(k,f){const v=localStorage.getItem(k);return v===null?f:v==="true"}
function uid(){return Math.random().toString(36).slice(2,10)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function def(){return{
  screen:"home",mode:null,industry:null,packs:[],players:[],selectedPlayerIds:[],
  durationMinutes:15,quickGame:false,questionSeconds:15,
  voiceOn:loadBool(STORAGE.voice,true),volume:loadNum(STORAGE.volume,.65),
  hostStyle:localStorage.getItem(STORAGE.hostStyle)||"classic",game:null
}}

let state=def();
let countdownTimer=null,questionTimer=null,resultTimer=null;
let recognition=null,voiceContext=null,voiceRestartTimer=null;
let audioCtx=null,musicTimer=null,musicStep=0,musicActive=false;
let pausedAt=null,pausedRemaining=null;
let lastViewport={w:window.innerWidth,h:window.innerHeight};

function clearTimers(){
  if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null}
  if(questionTimer){clearInterval(questionTimer);questionTimer=null}
  if(resultTimer){clearTimeout(resultTimer);resultTimer=null}
}
function stopVoice(){
  if(voiceRestartTimer){clearTimeout(voiceRestartTimer);voiceRestartTimer=null}
  if(recognition){try{recognition.onend=null;recognition.abort()}catch{}}
  recognition=null;voiceContext=null;
}
function clearRuntime(){clearTimers();stopVoice()}
function selectedPlayers(){return state.mode==="solo"?state.players.slice(0,1):state.players.filter(p=>state.selectedPlayerIds.includes(p.id))}
function activePlayers(){return state.game?.players?.filter(p=>!p.eliminated)||[]}
function activeCount(){return activePlayers().length}
function nextActiveIndex(from){
  const g=state.game;if(!g?.players?.length)return 0;
  for(let step=1;step<=g.players.length;step++){
    const idx=(from+step)%g.players.length;
    if(!g.players[idx].eliminated)return idx;
  }
  return from;
}
function regularRanking(players=state.game?.players||[]){
  return [...players].sort((a,b)=>
    (Number(a.eliminated)-Number(b.eliminated))||
    ((a.strikes||0)-(b.strikes||0))||
    ((b.correct||0)-(a.correct||0))||
    ((a.wrong||0)-(b.wrong||0))||
    ((a.timeout||0)-(b.timeout||0))
  );
}
function remembered(){return loadJSON(STORAGE.names,[]).filter(x=>typeof x==="string"&&x.trim())}
function rememberNames(){
  const a=[...remembered()];
  for(const p of state.players){const n=(p.name||"").trim();if(n&&!a.some(x=>x.toLowerCase()===n.toLowerCase()))a.push(n)}
  saveJSON(STORAGE.names,a.slice(-50));
}
function go(screen){clearRuntime();state.screen=screen;render()}
function bindBack(screen){const b=document.getElementById("backBtn");if(b)b.onclick=()=>go(screen)}

function shell({title="",back=null,content="",footer="",klass=""}){
  return `<section class="screen ${klass}"><header class="header">${back?`<button class="icon-btn back" id="backBtn" aria-label="Back">←</button>`:""}${title?`<div class="header-title">${title}</div>`:""}</header><div class="content">${content}</div><footer class="footer">${footer}</footer></section>`;
}

// ---------- AUDIO ----------
function ensureAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    if(!audioCtx)audioCtx=new C();
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    return audioCtx;
  }catch{return null}
}
function tone(f=500,d=.05,g=.08,t="sine",delay=0){
  if(state.volume<=0)return;
  const c=ensureAudio();if(!c)return;
  try{
    const o=c.createOscillator(),a=c.createGain();
    o.type=t;o.frequency.value=f;
    const st=c.currentTime+delay;
    a.gain.setValueAtTime(.0001,st);
    a.gain.exponentialRampToValueAtTime(Math.max(.0001,g*state.volume),st+.008);
    a.gain.exponentialRampToValueAtTime(.0001,st+d);
    o.connect(a);a.connect(c.destination);o.start(st);o.stop(st+d+.03);
  }catch{}
}

function timeoutBuzzer(){
  ensureAudio();
  if(!audioCtx)return;
  const now=audioCtx.currentTime;
  [0,0.16].forEach((delay,i)=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type="square";o.frequency.setValueAtTime(i?150:175,now+delay);
    g.gain.setValueAtTime(.0001,now+delay);
    g.gain.exponentialRampToValueAtTime(.12,now+delay+.012);
    g.gain.exponentialRampToValueAtTime(.0001,now+delay+.22);
    o.connect(g);g.connect(audioCtx.destination);o.start(now+delay);o.stop(now+delay+.24);
  });
}

function tick(n){tone(n<=5?760:520,n<=5?.06:.035,n<=5?.12:.055,n<=5?"square":"sine")}
function correctSound(){tone(660,.08,.12);tone(880,.1,.11,"sine",.075)}
function wrongSound(){tone(220,.13,.1,"triangle");tone(170,.16,.08,"triangle",.095)}
function musicNote(freq,d=.18,g=.028,delay=0){tone(freq,d,g,"triangle",delay)}
function musicBeat(){
  if(!musicActive||state.volume<=0)return;
  const seq=[261.63,329.63,392,523.25,392,329.63,293.66,369.99,440,587.33,440,369.99];
  const bass=[130.81,130.81,146.83,146.83];
  const f=seq[musicStep%seq.length],b=bass[Math.floor(musicStep/3)%bass.length];
  musicNote(f,.16,.022);musicNote(b,.12,.012,.01);
  if(musicStep%6===5)musicNote(f*2,.08,.014,.10);
  musicStep++;
}
function startMusic(){
  musicActive=true;ensureAudio();
  if(musicTimer)return;
  musicBeat();musicTimer=setInterval(musicBeat,230);
}
function stopMusic(){musicActive=false;if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function setMusicForScreen(){
  const should=["home","mode","industry","packs","players","time","ready","handoff","result"].includes(state.screen) && !document.getElementById("pauseOverlay");
  if(should)startMusic(); else stopMusic();
}

// ---------- ANSWER MATCHING ----------
function normalize(t){
  let s=String(t??"").toLowerCase().trim();
  try{s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,"")}catch{}
  return s
    .replace(/\b(i think|i guess|maybe|the answer is|answer is|it is|its|it's|my answer is|i say)\b/g," ")
    .replace(/\b(como se dice|creo que|la respuesta es)\b/g," ")
    .replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
}
function stripArticle(s){return s.replace(/^(the|a|an)\s+/,"").trim()}
function lev(a,b){
  if(!a)return b.length;if(!b)return a.length;
  let p=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const c=[i];
    for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
    p=c;
  }
  return p[b.length];
}
function variants(t){const b=stripArticle(normalize(t)),s=new Set([b]);if(b.endsWith("s")&&b.length>4)s.add(b.slice(0,-1));else if(b.length>3)s.add(b+"s");return [...s].filter(Boolean)}
function close(a,b){if(a===b)return true;const L=Math.max(a.length,b.length),S=Math.min(a.length,b.length);if(S<4)return false;const d=lev(a,b);if(L<=8)return d<=1;if(L<=14)return d<=2&&d/L<=.16;return d<=2&&d/L<=.12}
function accepted(h,q){const hv=variants(h),av=[q.answer,...(q.accepted||[])];return av.some(x=>variants(x).some(v=>hv.some(hh=>close(hh,v))))}

// ---------- VOICE ----------
function globalCommand(t){
  const n=normalize(t);
  if(/\b(start game|start|new game|play game)\b/.test(n))return"start";
  if(/\b(resume game|resume saved game)\b/.test(n))return"resumeSaved";
  if(/\b(work)\b/.test(n))return"work";
  if(/\b(family)\b/.test(n))return"family";
  if(/\b(friends|friend)\b/.test(n))return"friends";
  if(/\b(solo|single player|one player)\b/.test(n))return"solo";
  if(/\b(pause|pause game|hold on)\b/.test(n))return"pause";
  if(/\b(resume|continue game|keep going)\b/.test(n))return"resume";
  if(/\b(exit game|leave game|quit game|pause and leave)\b/.test(n))return"leave";
  if(/\b(end game|finish game|stop game)\b/.test(n))return"end";
  if(/\b(back|go back|previous)\b/.test(n))return"back";
  if(/\b(skip|skip this|no extras|none)\b/.test(n))return"skip";
  if(/\b(continue|next)\b/.test(n))return"continue";
  if(/\b(play|begin)\b/.test(n))return"play";
  if(/\b(voice on|turn voice on)\b/.test(n))return"voiceOn";
  if(/\b(voice off|turn voice off)\b/.test(n))return"voiceOff";
  if(/\b(mute|sound off)\b/.test(n))return"vol:0";
  if(/\b(unmute|sound on)\b/.test(n))return"vol:60";
  if(/\b(volume up|turn it up|louder)\b/.test(n))return"volUp";
  if(/\b(volume down|turn it down|quieter|lower the volume)\b/.test(n))return"volDown";
  const vol=n.match(/\b(?:volume|sound)(?: to| at)? (\d{1,3})\b/);if(vol)return`vol:${Math.max(0,Math.min(100,Number(vol[1])))}`;
  if(/\b(what did you hear|repeat what you heard|what was heard|i said that)\b/.test(n))return"heardBack";
  if(/\b(quick game|demo game|short game)\b/.test(n))return"quick";
  const sec=n.match(/\b(10|ten|15|fifteen|20|twenty|30|thirty)\s*(seconds|second|sec)?\b/);
  if(sec){const map={ten:10,fifteen:15,twenty:20,thirty:30};return`sec:${map[sec[1]]||Number(sec[1])}`}
  const mins=n.match(/\b(5|five|10|ten|15|fifteen|20|twenty|30|thirty)\s*(minutes|minute|min)?\b/);
  if(mins){const map={five:5,ten:10,fifteen:15,twenty:20,thirty:30};return`min:${map[mins[1]]||Number(mins[1])}`}
  for(const [id,label] of WORK_TYPES){if(n.includes(normalize(label))||n===normalize(label.split(" /")[0]))return`industry:${id}`}
  for(const pack of FUN_PACKS){if(n.includes(normalize(pack)))return`pack:${pack}`}
  return"";
}
function spokenNumber(v){
  const map={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  const n=Number(v);return Number.isFinite(n)&&n>0?n:(map[String(v).toLowerCase()]||0);
}
function cleanSpokenName(raw){
  let n=String(raw||"").trim().replace(/^[,:;\-\s]+|[,:;\-\s]+$/g,"");
  n=n.replace(/^(is|named|name is)\s+/i,"").trim();
  if(!n)return"";
  return n.split(/\s+/).map(w=>w? w[0].toUpperCase()+w.slice(1).toLowerCase():w).join(" ");
}
function setPlayerNameByVoice(index,name){
  if(index<0||!name)return false;
  while(state.players.length<=index)state.players.push({id:uid(),name:""});
  state.players[index].name=name;
  players();
  return true;
}
function addPlayerByVoice(name=""){
  if(state.mode==="solo"){
    if(name){ensurePlayerRows();state.players[0].name=name;players();return true}
    return false;
  }
  if(name){
    const empty=state.players.findIndex(p=>!(p.name||"").trim());
    if(empty>=0)return setPlayerNameByVoice(empty,name);
    state.players.push({id:uid(),name});players();return true;
  }
  const hasEmpty=state.players.some(p=>!(p.name||"").trim());
  if(!hasEmpty){state.players.push({id:uid(),name:""});players();return true}
  const e=document.getElementById("setupVoiceStatus");
  if(e)e.textContent="🎤 Say ‘Player 1 Vicente’ or ‘Add Player Maria’";
  return true;
}

let pendingPlayerRename=null;
function spokenLettersToName(text){
  const map={"a":"A","ay":"A","b":"B","bee":"B","c":"C","see":"C","sea":"C","d":"D","dee":"D","e":"E","f":"F","eff":"F","g":"G","gee":"G","h":"H","aitch":"H","i":"I","eye":"I","j":"J","jay":"J","k":"K","kay":"K","l":"L","el":"L","m":"M","em":"M","n":"N","en":"N","o":"O","oh":"O","p":"P","pee":"P","q":"Q","cue":"Q","r":"R","are":"R","s":"S","ess":"S","t":"T","tee":"T","u":"U","you":"U","v":"V","vee":"V","w":"W","doubleyou":"W","x":"X","ex":"X","y":"Y","why":"Y","z":"Z","zee":"Z","zed":"Z"};
  const parts=(text||"").toLowerCase().replace(/[^a-z\s-]/g," ").replace(/\s+/g," ").trim().split(/[\s-]+/).filter(Boolean);
  if(!parts.length)return "";
  const out=[];
  for(const p of parts){if(p.length===1)out.push(p.toUpperCase());else if(map[p])out.push(map[p]);else return ""}
  return out.join("");
}
function voicePlayerRef(ref){
  const n=Number(ref);
  if(Number.isFinite(n)&&n>=1&&n<=state.players.length)return state.players[n-1];
  const r=normalize(ref);
  return state.players.find(p=>normalize(p.name)===r)||null;
}
function commitVoiceName(p,name){
  name=(name||"").trim(); if(!p||!name)return false;
  p.name=name.charAt(0).toUpperCase()+name.slice(1);
  state.selectedPlayerIds=state.players.filter(x=>(x.name||"").trim()).map(x=>x.id);
  rememberNames(); render(); setTimeout(()=>startVoice("players"),150); return true;
}
function advancedPlayerNameVoice(raw){
  const text=(raw||"").trim(), norm=normalize(text); if(!text)return false;
  if(pendingPlayerRename){
    const p=state.players.find(x=>x.id===pendingPlayerRename.playerId);
    if(!p){pendingPlayerRename=null;return false}
    if(/\b(cancel|never mind|nevermind)\b/.test(norm)){pendingPlayerRename=null;return true}
    if(/\b(spell|spell it|spell the name|spelling)\b/.test(norm)&&!pendingPlayerRename.spelling){pendingPlayerRename.spelling=true;return true}
    if(pendingPlayerRename.spelling){
      const spelled=spokenLettersToName(text.replace(/^(spell|spelling)\s+/i,""));
      if(spelled){pendingPlayerRename=null;return commitVoiceName(p,spelled.charAt(0)+spelled.slice(1).toLowerCase())}
      return true;
    }
    const candidate=text.replace(/^(the name is|name is|make it|change it to|to)\s+/i,"").trim();
    if(candidate&&candidate.split(/\s+/).length<=3){pendingPlayerRename=null;return commitVoiceName(p,candidate)}
    return true;
  }
  let x=text.match(/^\s*(?:change|rename|make)\s+player\s+(\d+)\s+(?:to|as)\s+(.+?)\s*$/i);
  if(x){const p=voicePlayerRef(x[1]);if(p)return commitVoiceName(p,x[2])}
  x=text.match(/^\s*(?:change|rename)\s+(.+?)\s+to\s+(.+?)\s*$/i);
  if(x){const p=voicePlayerRef(x[1]);if(p)return commitVoiceName(p,x[2])}
  x=text.match(/^\s*player\s+(\d+)\s+(?:is|should be|can be|will be)\s+(.+?)\s*$/i);
  if(x){const p=voicePlayerRef(x[1]);if(p)return commitVoiceName(p,x[2])}
  x=norm.match(/^(?:change|rename|make)\s+player\s+(\d+)$/);
  if(x){const p=voicePlayerRef(x[1]);if(p){pendingPlayerRename={playerId:p.id,spelling:false};return true}}
  x=norm.match(/^(?:spell|spell the name for|change the spelling for)\s+player\s+(\d+)$/);
  if(x){const p=voicePlayerRef(x[1]);if(p){pendingPlayerRename={playerId:p.id,spelling:true};return true}}
  x=norm.match(/^(?:spell|change the spelling for)\s+(.+)$/);
  if(x){const p=voicePlayerRef(x[1]);if(p){pendingPlayerRename={playerId:p.id,spelling:true};return true}}
  return false;
}

function handlePlayerVoice(h){
  if(advancedPlayerNameVoice(h))return;
  const raw=String(h||"").trim();
  // Pull every "player N [is/can be/make ...] Name" phrase from casual speech.
  const re=/player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:is\s+|can\s+be\s+|will\s+be\s+|named\s+|name\s+is\s+|(?:should\s+be\s+)?|)([a-z][a-z'’-]*(?:\s+[a-z][a-z'’-]*)?)(?=\s*(?:,|and\s+player|player\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)|$))/ig;
  let m,changed=false;
  while((m=re.exec(raw))){const idx=spokenNumber(m[1])-1,name=cleanSpokenName(m[2]);if(idx>=0&&name){while(state.players.length<=idx)state.players.push({id:uid(),name:""});state.players[idx].name=name;changed=true}}
  if(changed){players();return true}
  m=raw.match(/(?:add|make|put)\s+(?:a\s+)?player(?:\s+(?:named|name\s+is|is))?\s+(.+)/i);
  if(m)return addPlayerByVoice(cleanSpokenName(m[1]));
  if(/\b(add|select)\s+(?:a\s+)?player\b/i.test(raw))return addPlayerByVoice("");
  m=raw.match(/remove\s+player\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)/i);
  if(m&&state.mode!=="solo"){const idx=spokenNumber(m[1])-1;if(idx>=0&&idx<state.players.length){state.players.splice(idx,1);ensurePlayerRows();players();return true}}
  return false;
}
function backFromContext(ctx){
  const target={mode:"home",industry:"mode",players:"packs",time:"players",ready:"time"}[ctx];
  if(ctx==="packs")return go(state.mode==="work"?"industry":"mode"),true;
  if(target){go(target);return true}
  return false;
}

const HOST_STYLES=[
  ["off","OFF"],["classic","CLASSIC"],["cowboy","COWBOY"],["newyork","NEW YORK"],
  ["wiseguy","WISEGUY"],["preacher","PREACHER"],["norteno","NORTEÑO"],
  ["bilingual","BILINGUAL"],["cholo","CHOLO"]
];
function availableVoices(){try{return speechSynthesis.getVoices()||[]}catch{return[]}}
function chooseHostVoice(style){
  const vs=availableVoices();if(!vs.length)return null;
  const spanish=["norteno","bilingual","cholo"].includes(style);
  const lang=spanish?"es":"en";
  const preferred=vs.filter(v=>(v.lang||"").toLowerCase().startsWith(lang));
  const natural=(preferred.length?preferred:vs).find(v=>/natural|neural|premium|enhanced|siri|google|microsoft/i.test(v.name));
  return natural||(preferred[0]||vs[0]);
}
function hostLine(kind,p){
  const n=p?.name||"player",s=state.hostStyle||"classic";
  const lines={
    classic:{turn:`${n}, you're up.`,correct:"Correct!",wrong:"That's a strike.",pass:"Pass. That's a strike.",timeout:"Time's up. That's a strike.",showdown:"Final Showdown. Three strikes and you're out.",champion:`${n} is the Last One Standing!`},
    cowboy:{turn:`Alright ${n}, saddle up. You're up.`,correct:"That's right, partner!",wrong:"That's a strike, partner.",pass:"Pass. That's a strike.",timeout:"Time's up, partner. That's a strike.",showdown:"Final Showdown. Three strikes and you're out.",champion:`${n}, you're the Last One Standing!`},
    newyork:{turn:`Alright ${n}, you're up. Let's go!`,correct:"That's right!",wrong:"Ah, that's a strike.",pass:"Pass. That's a strike.",timeout:"Time's up. That's a strike.",showdown:"Final Showdown. Three strikes and you're out. Let's go!",champion:`${n} takes it! Last One Standing!`},
    wiseguy:{turn:`Alright ${n}, your turn. Make it count.`,correct:"Beautiful. That's correct.",wrong:"Oof. That's a strike.",pass:"You pass? That's a strike.",timeout:"Clock got you. That's a strike.",showdown:"Final Showdown. Three strikes and you're out.",champion:`${n}, look at you. Last One Standing.`},
    preacher:{turn:`${n}, it's your turn. Bring it!`,correct:"Yes! That answer is correct!",wrong:"That's one strike. Stay in the game!",pass:"A pass is a strike. Stay in the game!",timeout:"Time is up. That's a strike!",showdown:"Final Showdown! Three strikes and you are out!",champion:`${n} is your champion! Last One Standing!`},
    norteno:{turn:`Órale, ${n}. Te toca.`,correct:"¡Eso! Correcto.",wrong:"Una falla. Es strike.",pass:"Pasas. Es strike.",timeout:"Se acabó el tiempo. Es strike.",showdown:"Final Showdown. Tres strikes y quedas fuera.",champion:`¡${n} es el campeón! Last One Standing!`},
    bilingual:{turn:`${n}, you're up. ¡Vámonos!`,correct:"Correct! ¡Eso es!",wrong:"That's a strike. Ponte listo.",pass:"Pass. That's a strike.",timeout:"Time's up. Se acabó. That's a strike.",showdown:"Final Showdown. Tres strikes and you're out.",champion:`${n} is the champion. ¡El Last One Standing!`},
    cholo:{turn:`Órale, ${n}. You're up, homie. Lock in.`,correct:"Órale. That's right.",wrong:"Ay, that's a strike, homie.",pass:"You pass? That's a strike.",timeout:"Time's up, homie. That's a strike.",showdown:"Final Showdown, homies. Three strikes and you're out.",champion:`Órale, ${n}. You're the Last One Standing!`}
  };
  return (lines[s]||lines.classic)[kind]||"";
}
function hostSpeak(kind,p,after){
  if((state.hostStyle||"classic")==="off"){after&&after();return}
  const text=hostLine(kind,p);if(!text){after&&after();return}
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text),v=chooseHostVoice(state.hostStyle);
    if(v){u.voice=v;u.lang=v.lang}
    u.volume=Math.max(.35,state.volume);
    u.rate=state.hostStyle==="preacher"?1.02:state.hostStyle==="newyork"?1.06:.96;
    u.pitch=state.hostStyle==="cowboy"?.86:state.hostStyle==="wiseguy"?.84:state.hostStyle==="cholo"?.9:1;
    if(after){u.onend=after;u.onerror=after}
    speechSynthesis.speak(u);
  }catch{after&&after()}
}
function saveHostStyle(){localStorage.setItem(STORAGE.hostStyle,state.hostStyle)}

function startVoice(ctx){
  stopVoice();if(!state.voiceOn||!speechSupported())return;
  voiceContext=ctx;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const begin=()=>{
    if(!state.voiceOn||voiceContext!==ctx)return;
    try{
      const r=new SR();recognition=r;r.lang="en-US";r.interimResults=true;r.continuous=false;r.maxAlternatives=5;
      r.onresult=e=>{
        for(let x=e.resultIndex;x<e.results.length;x++){
          const res=e.results[x];
          for(let i=0;i<res.length;i++){
            const h=res[i].transcript.trim();if(h)handleHeard(ctx,h);
            if(voiceContext!==ctx)return;
          }
        }
      };
      r.onerror=()=>{};
      r.onend=()=>{recognition=null;if(state.voiceOn&&voiceContext===ctx)voiceRestartTimer=setTimeout(begin,90)};
      r.start();
    }catch{voiceRestartTimer=setTimeout(begin,180)}
  };
  begin();
}
function showHeard(text){
  const ids=["heard","pauseVoiceStatus","setupVoiceStatus","homeVoiceStatus"];
  for(const id of ids){const e=document.getElementById(id);if(e)e.textContent=`Heard: “${text}”`}
}
function setVolume(v){state.volume=Math.max(0,Math.min(1,v));localStorage.setItem(STORAGE.volume,String(state.volume));const vp=document.getElementById("vp");if(vp)vp.textContent=`${Math.round(state.volume*100)}%`;for(const id of ["vol","gameVol"]){const e=document.getElementById(id);if(e)e.value=state.volume}}
function speakHeardBack(){const text=(state.game?.lastSpeechLog||[]).join(" ").trim();const msg=text?`The game heard: ${text}`:"The game did not capture any clear speech during that question.";const box=document.getElementById("heardBack");if(box)box.textContent=msg;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(msg);u.volume=Math.max(.25,state.volume);speechSynthesis.speak(u)}catch{}}
function handleHeard(ctx,h){
  const c=globalCommand(h);
  if(c==="volUp"){setVolume(state.volume+.1);return}
  if(c==="volDown"){setVolume(state.volume-.1);return}
  if(c.startsWith("vol:")){setVolume(Number(c.slice(4))/100);return}
  if(c==="heardBack"){speakHeardBack();return}
  if(ctx==="question"&&state.game){state.game.speechLog=state.game.speechLog||[];if(!state.game.speechLog.includes(h))state.game.speechLog.push(h)}
  if(!["question","result"].includes(ctx))showHeard(h);

  if(["mode","industry","packs","players","time","ready"].includes(ctx)&&c==="back"){backFromContext(ctx);return}

  if(ctx==="question"){
    if(c==="pause"){pauseGame();return}
    if(c==="leave"){pauseGame("leave");return}
    if(c==="end"){pauseGame("end");return}
    if(/^(pass|i pass|skip|skip it|skip this one|skip question|next question)$/.test(normalize(h))){finishQuestion("pass");return}
    if(state.game?.current&&accepted(h,state.game.current)){finishQuestion("correct");return}
    return;
  }
  if(ctx==="paused"){
    if(c==="resume"){resumePause();return}
    if(c==="leave"){pauseLeave();return}
    if(c==="end"){confirmEnd();return}
    return;
  }
  if(ctx==="handoff"){
    if(c==="pause"){pauseGame();return}
    if(c==="leave"){pauseGame("leave");return}
    if(c==="end"){pauseGame("end");return}
    return;
  }
  if(ctx==="home"){
    if(c==="start"){ensureAudio();startMusic();go("mode");return}
    if(c==="resumeSaved"&&loadJSON(STORAGE.session,null)){resumeSaved();return}
  }
  if(ctx==="mode"&&["work","family","friends","solo"].includes(c)){chooseMode(c);return}
  if(ctx==="industry"&&c.startsWith("industry:")){state.industry=c.split(":")[1];go("packs");return}
  if(ctx==="packs"){
    if(c==="skip"||c==="continue"){go("players");return}
    if(c.startsWith("pack:")){togglePack(c.slice(5));packs();return}
  }
  if(ctx==="players"){
    if(handlePlayerVoice(h))return;
    if(c==="continue"){continueFromPlayers();return}
  }
  if(ctx==="time"){
    if(c==="quick"){state.quickGame=true;state.durationMinutes=3;time();return}
    if(c.startsWith("sec:")){state.questionSeconds=Number(c.slice(4));time();return}
    if(c.startsWith("min:")){state.quickGame=false;state.durationMinutes=Number(c.slice(4));time();return}
    if(c==="voiceOn"){state.voiceOn=true;saveVoice();time();return}
    if(c==="voiceOff"){state.voiceOn=false;saveVoice();time();return}
    if(c==="continue"){go("ready");return}
  }
  if(ctx==="ready"&&(c==="play"||c==="start")){ensureAudio();startGame();return}
}
function saveVoice(){localStorage.setItem(STORAGE.voice,String(state.voiceOn))}
function bindVoiceHelp(ctx){if(state.voiceOn)startVoice(ctx)}

// ---------- HOME / SETUP ----------
function home(){
  clearRuntime();state.screen="home";
  const hasSave=!!loadJSON(STORAGE.session,null);
  app.innerHTML=`<section class="screen home-screen"><div class="home-inner"><div class="brand-wrap"><div class="brand">LAST ONE<br>STANDING</div><div class="tagline">THINK FAST. SPEAK UP. STAY IN THE GAME.</div></div><div class="home-actions"><button id="startBtn" class="btn primary hero-btn">START GAME</button>${hasSave?`<button id="resumeBtn" class="btn">RESUME GAME</button>`:""}<div class="voice-home" id="homeVoiceStatus">${state.voiceOn&&speechSupported()?"🎤 Voice ready — say “Start Game” • 🔊 Music on Page 1":"Tap Start Game"}</div></div><div class="build-stamp">${BUILD}</div></div></section>`;
  document.getElementById("startBtn").onclick=()=>{ensureAudio();startMusic();go("mode")};
  const rb=document.getElementById("resumeBtn");if(rb)rb.onclick=()=>{ensureAudio();resumeSaved()};
  setMusicForScreen();bindVoiceHelp("home");
}
function chooseMode(m){
  state.mode=m;
  if(m==="work")go("industry");else go("packs");
}
function mode(){
  app.innerHTML=shell({title:"Choose Your Game",back:"home",klass:"mode-screen",content:`<div class="choice-grid mode-grid">${[["work","WORK"],["family","FAMILY"],["friends","FRIENDS"],["solo","SOLO"]].map(([id,label])=>`<button class="choice-card" data-mode="${id}"><span>${label}</span></button>`).join("")}</div><div class="setup-voice" id="setupVoiceStatus">${state.voiceOn?"🎤 Say Work, Family, Friends, Solo, or Back":""}</div>`});
  bindBack("home");document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>chooseMode(b.dataset.mode));setMusicForScreen();bindVoiceHelp("mode");
}
function industry(){
  app.innerHTML=shell({title:"Choose Your Work Type",back:"mode",content:`<div class="choice-grid industry-grid">${WORK_TYPES.map(([id,label])=>`<button class="choice-card ${state.industry===id?"selected":""}" data-ind="${id}">${label}</button>`).join("")}</div><div class="setup-voice" id="setupVoiceStatus">${state.voiceOn?"🎤 Say a work type, or say Back":""}</div>`});
  bindBack("mode");document.querySelectorAll("[data-ind]").forEach(b=>b.onclick=()=>{state.industry=b.dataset.ind;go("packs")});setMusicForScreen();bindVoiceHelp("industry");
}
function togglePack(pack){const i=state.packs.indexOf(pack);if(i>=0)state.packs.splice(i,1);else state.packs.push(pack)}
function packs(){
  app.innerHTML=shell({title:"Add Some Fun?",back:state.mode==="work"?"industry":"mode",content:`<div class="instruction">Pick any extra categories you want in your game. Choose as many as you like — or skip this step.</div><div class="pack-grid">${FUN_PACKS.map(p=>`<button class="pack ${state.packs.includes(p)?"selected":""}" data-pack="${esc(p)}">${esc(p)}</button>`).join("")}</div><div class="setup-voice" id="setupVoiceStatus">${state.voiceOn?"🎤 Say a category, “Skip,” “Continue,” or “Back”":""}</div>`,footer:`<button id="packsSkip" class="btn">SKIP</button><button id="packsNext" class="btn primary">CONTINUE ▶</button>`});
  bindBack(state.mode==="work"?"industry":"mode");document.querySelectorAll("[data-pack]").forEach(b=>b.onclick=()=>{togglePack(b.dataset.pack);packs()});document.getElementById("packsNext").onclick=()=>go("players");document.getElementById("packsSkip").onclick=()=>go("players");setMusicForScreen();bindVoiceHelp("packs");
}
function ensurePlayerRows(){
  if(state.mode==="solo"){
    if(!state.players.length)state.players=[{id:uid(),name:"Vicente"}];
    state.players=state.players.slice(0,1);
    state.selectedPlayerIds=state.players.length?[state.players[0].id]:[];
    return;
  }
  if(!state.players.length){
    state.players=[
      {id:uid(),name:"Vicente"},
      {id:uid(),name:"Todd"},
      {id:uid(),name:"Maria"}
    ];
  }
  while(state.players.length<2)state.players.push({id:uid(),name:""});
  state.selectedPlayerIds=state.players.filter(p=>(p.name||"").trim()).map(p=>p.id);
}
function namedPlayers(){return state.players.filter(p=>(p.name||"").trim())}
function canContinuePlayers(){return state.mode==="solo"?!!((state.players[0]?.name||"").trim()):namedPlayers().length>=2}
function continueFromPlayers(){
  if(!canContinuePlayers())return;
  state.players=state.mode==="solo"?state.players.slice(0,1):namedPlayers();
  state.selectedPlayerIds=state.players.map(p=>p.id);
  rememberNames();go("time");
}
function players(){
  ensurePlayerRows();const names=remembered();
  app.innerHTML=shell({title:state.mode==="solo"?"Your Player":"Your Players",back:"packs",klass:"players-screen",content:`<div class="players-wrap"><div class="player-card card"><div class="player-card-title">${state.mode==="solo"?"PLAYER NAME":"PLAYER NAMES"}</div><div id="playerRows">${state.players.map((p,i)=>`<div class="player-row"><span class="player-number">${i+1}</span><div class="name-field"><input class="input player-input" data-id="${p.id}" value="${esc(p.name)}" placeholder="Enter name" autocomplete="off" list="rememberedNames"></div>${state.mode!=="solo"&&state.players.length>2?`<button class="icon-btn remove-player" data-rm="${p.id}" aria-label="Remove player">×</button>`:""}</div>`).join("")}</div><datalist id="rememberedNames">${names.map(n=>`<option value="${esc(n)}"></option>`).join("")}</datalist>${state.mode!=="solo"?`<button id="addPlayer" class="btn compact">+ ADD PLAYER</button>`:""}</div><div class="setup-voice" id="setupVoiceStatus">${state.voiceOn?"🎤 Say “Player 1 Vicente,” “Player 2 Todd,” “Add Player Maria,” “Back,” or “Continue”":""}</div></div>`,footer:`<button id="playersNext" class="btn primary">CONTINUE ▶</button>`});
  bindBack("packs");
  document.querySelectorAll(".player-input").forEach(inp=>inp.oninput=()=>{const p=state.players.find(x=>x.id===inp.dataset.id);if(p)p.name=inp.value;updatePlayerNext()});
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{state.players=state.players.filter(p=>p.id!==b.dataset.rm);players()});
  const ap=document.getElementById("addPlayer");if(ap)ap.onclick=()=>{state.players.push({id:uid(),name:""});players()};
  document.getElementById("playersNext").onclick=continueFromPlayers;
  updatePlayerNext();setMusicForScreen();bindVoiceHelp("players");
}
function updatePlayerNext(){const b=document.getElementById("playersNext");if(b)b.disabled=!canContinuePlayers()}
function choiceBtn(value,selected,attr,label){return `<button class="btn select-btn ${selected?"selected":""}" data-${attr}="${value}">${label}</button>`}
function time(){
  app.innerHTML=shell({title:"Game Time",back:"players",klass:"time-screen",content:`<div class="time-grid"><div class="time-card card"><div class="time-label">Game Length</div><div class="duration-grid"><button class="btn select-btn quick ${state.quickGame?"selected":""}" data-quick="1"><strong>QUICK GAME</strong><small>2–3 min • full ending</small></button>${[5,10,15,20].map(v=>choiceBtn(v,!state.quickGame&&state.durationMinutes===v,"dur",`${v} MIN`)).join("")}</div></div><div class="time-card card"><div class="time-label">Time per Question</div><div class="four-grid">${[10,15,20,30].map(v=>choiceBtn(v,state.questionSeconds===v,"sec",`${v} SEC`)).join("")}</div></div><div class="time-card card"><div class="time-label">Voice Recognition</div><div class="two-grid"><button id="voff" class="btn ${!state.voiceOn?"selected":""}">OFF</button><button id="von" class="btn ${state.voiceOn?"selected":""}">ON</button></div><div class="subtle center">${state.voiceOn?(speechSupported()?"Voice-first setup and gameplay enabled.":"Voice recognition is not supported in this browser."):"Silent play: answers will be typed."}</div></div><div class="time-card card host-card"><div class="time-label">Host Voice</div><div class="host-grid">${HOST_STYLES.map(([id,label])=>`<button class="btn host-choice ${state.hostStyle===id?"selected":""}" data-host="${id}">${label}</button>`).join("")}</div><div class="subtle center">Choose the host personality. Device voice quality varies; the game prefers enhanced/natural voices when available.</div></div><div class="time-card card"><div class="time-label">Game Volume</div><div class="volume-row"><span>🔈</span><input id="vol" type="range" min="0" max="1" step=".05" value="${state.volume}"><strong id="vp">${Math.round(state.volume*100)}%</strong></div></div></div><div class="setup-voice" id="setupVoiceStatus">${state.voiceOn?"🎤 Try “Quick Game,” “20 seconds,” “Continue,” or “Back”":""}</div>`,footer:`<button id="timeNext" class="btn primary">CONTINUE ▶</button>`});
  bindBack("players");
  document.querySelector("[data-quick]").onclick=()=>{state.quickGame=true;state.durationMinutes=3;time()};
  document.querySelectorAll("[data-dur]").forEach(b=>b.onclick=()=>{state.quickGame=false;state.durationMinutes=Number(b.dataset.dur);time()});
  document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{state.questionSeconds=Number(b.dataset.sec);time()});
  document.getElementById("voff").onclick=()=>{state.voiceOn=false;saveVoice();time()};
  document.getElementById("von").onclick=()=>{state.voiceOn=true;saveVoice();time()};
  document.querySelectorAll("[data-host]").forEach(b=>b.onclick=()=>{state.hostStyle=b.dataset.host;saveHostStyle();hostSpeak("turn",{name:"Player"});setTimeout(time,650)});
  const v=document.getElementById("vol");v.oninput=()=>{state.volume=Number(v.value);localStorage.setItem(STORAGE.volume,String(state.volume));document.getElementById("vp").textContent=`${Math.round(state.volume*100)}%`};v.onchange=()=>tone();
  document.getElementById("timeNext").onclick=()=>go("ready");setMusicForScreen();bindVoiceHelp("time");
}
function ready(){
  const a=selectedPlayers();
  app.innerHTML=shell({title:"Ready to Play?",back:"time",content:`<div class="ready-wrap"><div class="ready-card card"><div class="summary"><div class="summary-line"><span>Game</span><strong>${esc((state.mode||"").toUpperCase())}</strong></div><div class="summary-line"><span>Players</span><strong>${a.length}</strong></div><div class="summary-line"><span>Game Length</span><strong>${state.quickGame?"QUICK GAME":`${state.durationMinutes} min`}</strong></div><div class="summary-line"><span>Question Time</span><strong>${state.questionSeconds} sec</strong></div><div class="summary-line"><span>Voice Recognition</span><strong>${state.voiceOn?"ON":"OFF"}</strong></div><div class="summary-line"><span>Host Voice</span><strong>${esc((HOST_STYLES.find(x=>x[0]===state.hostStyle)?.[1]||"CLASSIC"))}</strong></div></div><div class="setup-voice" id="setupVoiceStatus">${state.voiceOn?"🎤 Say “Play,” “Start Game,” or “Back”":""}</div></div></div>`,footer:`<button id="play" class="btn primary large">PLAY ▶</button>`});
  bindBack("time");document.getElementById("play").onclick=()=>{ensureAudio();startGame()};setMusicForScreen();bindVoiceHelp("ready");
}

// ---------- GAMEPLAY ----------
function gamebar(){
  const p=state.game?.players?.[state.game.playerIndex];
  return `<div class="game-topbar"><button id="pauseBtn" class="btn compact">Ⅱ PAUSE</button><div class="game-player">${p?esc(p.name):""}</div><div class="mini-volume"><span>🔈</span><input id="gameVol" type="range" min="0" max="1" step=".05" value="${state.volume}" aria-label="Game volume"></div></div>`;
}
function bindGamebar(){
  const p=document.getElementById("pauseBtn");if(p)p.onclick=()=>pauseGame();
  const v=document.getElementById("gameVol");if(v)v.oninput=()=>{state.volume=Number(v.value);localStorage.setItem(STORAGE.volume,String(state.volume))};
}
function startGame(){
  rememberNames();
  const starting=selectedPlayers();
  state.game={
    players:starting.map(p=>({...p,correct:0,wrong:0,timeout:0,strikes:0,eliminated:false})),
    startingPlayerCount:starting.length,
    playerIndex:0,questionNumber:0,used:[],current:null,answered:false,
    startedAt:Date.now(),questionRemaining:state.questionSeconds,maxQuestions:state.quickGame?6:40
  };
  handoff();
}

function transitionSting(kind="next"){
  ensureAudio();
  if(!audioCtx)return;
  const base = kind==="question" ? 520 : kind==="elimination" ? 180 : 360;
  const now=audioCtx.currentTime;
  [0,.10,.20].forEach((delay,i)=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=i===2?"triangle":"sine";
    o.frequency.setValueAtTime(base*(1+i*.28),now+delay);
    g.gain.setValueAtTime(.0001,now+delay);
    g.gain.exponentialRampToValueAtTime(.08,now+delay+.012);
    g.gain.exponentialRampToValueAtTime(.0001,now+delay+.22);
    o.connect(g);g.connect(audioCtx.destination);
    o.start(now+delay);o.stop(now+delay+.25);
  });
}
function showGameTransition(kind,onDone){
  clearRuntime();
  const labels={
    question:["LOCK IN","QUESTION INCOMING"],
    next:["NEXT TURN","GET READY"],
    elimination:["PLAYER ELIMINATED","THE GAME CONTINUES"],
    showdown:["FINAL SHOWDOWN","PLAYOFF MODE"]
  };
  const [big,small]=labels[kind]||labels.next;
  state.screen="transition";
  app.innerHTML=`<section class="screen gameplay-screen transition-screen">
    <div class="transition-stage">
      
      <div class="transition-glow"></div>
      <div class="transition-copy">
        <div class="transition-big">${big}</div>
        <div class="transition-small">${small}</div>
      </div>
    </div>
  </section>`;
  transitionSting(kind);
  const duration=kind==="elimination"?2200:1800;
  resultTimer=setTimeout(()=>{resultTimer=null;onDone&&onDone()},duration);
}

function handoff(){
  clearRuntime();state.screen="handoff";const g=state.game;
  if(!g.showdown && g.players[g.playerIndex]?.eliminated)g.playerIndex=nextActiveIndex(g.playerIndex);
  const p=g.players[g.playerIndex];
  app.innerHTML=`<section class="screen gameplay-screen"><div class="game-shell">${gamebar()}<div class="handoff"><div class="handoff-label">${g.showdown?"FINAL SHOWDOWN":"IT’S YOUR TURN"}</div><div class="handoff-name">${esc(p.name)}</div><div class="handoff-gap"></div><div class="handoff-hype">YOU'RE UP!</div><div class="handoff-sub">${g.showdown?"PLAYOFF PRESSURE":"GET READY"}</div><div class="countdown" id="handoffCount">3</div></div></div></section>`;
  bindGamebar();setMusicForScreen();hostSpeak("turn",p);if(state.voiceOn)setTimeout(()=>{if(state.screen==="handoff")startVoice("handoff")},900);
  let n=3;
  const handoffEl=document.getElementById("handoffCount");
  if(handoffEl){handoffEl.classList.add("urgent");}
  tick(n);
  countdownTimer=setInterval(()=>{
    n--;
    if(n>0){
      const c=document.getElementById("handoffCount");
      if(c){
        c.textContent=n;
        c.classList.toggle("urgent",n<=5);
      }
      tick(n);
    }else{
      clearInterval(countdownTimer);countdownTimer=null;
      showGameTransition("question",()=>renderQuestion(false));
    }
  },650);
}
function chooseQ(){const g=state.game;let pool=QUESTIONS.map((_,i)=>i).filter(i=>!g.used.includes(i));if(!pool.length){g.used=[];pool=QUESTIONS.map((_,i)=>i)}const i=pool[Math.floor(Math.random()*pool.length)];g.used.push(i);g.current=QUESTIONS[i];return g.current}
function renderQuestion(resume=false){
  clearRuntime();stopMusic();state.screen="question";const g=state.game,q=resume&&g.current?g.current:chooseQ();g.answered=false;
  const roundSeconds=g.showdown?Math.max(5,state.questionSeconds-5):state.questionSeconds;
  let rem=resume&&pausedRemaining!=null?pausedRemaining:roundSeconds;pausedRemaining=null;g.questionRemaining=rem;
  g.speechLog=[];
  app.innerHTML=`<section class="screen gameplay-screen"><div class="game-shell question-shell">${gamebar()}<div class="question-card"><div class="question-text">${esc(q.q)}</div>${state.voiceOn?``:`<div class="typed-answer-wrap keyboard-answer"><input id="typed" class="input" type="text" autocomplete="off" placeholder="Type your answer…"><button id="submit" class="btn primary">SUBMIT</button></div>`}<div class="timer ${rem<=5?"urgent":""}" id="timer">${rem}</div></div></div></section>`;
  bindGamebar();
  if(state.voiceOn)startVoice("question");else{
    const i=document.getElementById("typed"),s=document.getElementById("submit");
    const doit=()=>{const v=i.value.trim();if(!v)return;if(accepted(v,q))finishQuestion("correct");else{i.value="";i.focus()}};
    s.onclick=doit;i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();doit()}};
  }
  questionTimer=setInterval(()=>{
    rem--;
    g.questionRemaining=rem;
    const t=document.getElementById("timer");
    if(t){
      t.textContent=Math.max(rem,0);
      t.classList.toggle("urgent",rem<=5);
    }
    tick(rem);
    if(rem<=5 && rem>0){
      setTimeout(()=>{ if(state.screen==="question" && !g.answered) tone(860,.035,.08,"square"); },420);
    }
    if(rem<=0)finishQuestion("timeout");
  },1000);
}
function finishQuestion(outcome){
  const g=state.game;if(!g||g.answered)return;g.answered=true;clearRuntime();const p=g.players[g.playerIndex];
  g.lastSpeechLog=[...(g.speechLog||[])];

  if(g.showdown){
    if(outcome==="correct"){p.correct=(p.correct||0)+1;correctSound()}
    else{
      if(outcome==="timeout"){p.timeout=(p.timeout||0)+1;timeoutBuzzer()}
      else if(outcome==="pass"){p.wrong=(p.wrong||0)+1;wrongSound()}
      else{p.wrong=(p.wrong||0)+1;wrongSound()}
      p.strikes=(p.strikes||0)+1;
      if(p.strikes>=3)p.eliminated=true;
    }
    result(outcome);return;
  }

  if(outcome==="correct"){
    p.correct++;correctSound();
  }else{
    if(outcome==="wrong"){p.wrong++;wrongSound()}
    else if(outcome==="pass"){p.wrong++;wrongSound()}
    else{p.timeout++;timeoutBuzzer()}
    p.strikes=(p.strikes||0)+1;
    if(p.strikes>=3)p.eliminated=true;
  }
  result(outcome);
}
function strikeMarks(p){
  const n=Math.min(3,p.strikes||0);
  return `${"✕".repeat(n)}${"○".repeat(Math.max(0,3-n))}`;
}
function scoreboard(){
  const sorted=regularRanking();
  return `<div class="scoreboard compact-board">${sorted.map((p,i)=>`<div class="score-ribbon ${p.eliminated?"eliminated":""}"><div class="score-name">${i+1}. ${esc(p.name)}</div><div class="score-stat correct">✓ ${p.correct}</div><div class="score-stat strikes">${strikeMarks(p)}</div><div class="score-stat status">${p.eliminated?"OUT":"IN"}</div></div>`).join("")}</div>`;
}
function playoffBoard(){return `<div class="playoff-board">${state.game.players.map(p=>`<div class="playoff-player"><strong>${esc(p.name)}</strong><span>${p.playoff||0}</span></div>`).join("")}</div>`}
function result(outcome){
  state.screen="result";
  const g=state.game,q=g.current,p=g.players[g.playerIndex];
  const label=outcome==="correct"?"CORRECT!":outcome==="wrong"?"NOT QUITE":outcome==="pass"?"PASSED":"TIME'S UP";
  const strikeMoment=outcome!=="correct";
  const eliminated=strikeMoment&&p.eliminated;
  const consequence=strikeMoment
    ? `<div class="strike-moment ${eliminated?"elimination":""}">
         <div class="strike-label">${eliminated?"THIRD STRIKE":"STRIKE"}</div>
         <div class="strike-count">${strikeMarks(p)}</div>
         <div class="strike-copy">${eliminated?`${esc(p.name)} HAS BEEN ELIMINATED`:`${p.strikes} OF 3 STRIKES`}</div>
       </div>`
    : "";

  app.innerHTML=`<section class="screen gameplay-screen"><div class="game-shell result-shell">${gamebar()}<div class="result-body"><div class="result-word ${outcome}">${label}</div><div class="answer-label">CORRECT ANSWER</div><div class="answer-big">${esc(q.answer)}</div>${consequence}${g.showdown?`<div class="standings-title">FINAL SHOWDOWN — 3 STRIKES AND YOU’RE OUT</div>${scoreboard()}`:`<div class="standings-title">CURRENT STANDINGS</div>${scoreboard()}`}<div class="heard-back" id="heardBack"></div><div class="auto-next">${eliminated?"Elimination locked in…":g.showdown?"Showdown continues…":"Next player coming up…"}</div></div></div></section>`;
  bindGamebar();setMusicForScreen();hostSpeak(outcome==="correct"?"correct":outcome==="pass"?"pass":outcome==="timeout"?"timeout":"wrong",p);if(state.voiceOn)setTimeout(()=>{if(state.screen==="result")startVoice("result")},900);

  const delay=g.showdown?2600:eliminated?4800:strikeMoment?3500:2300;
  resultTimer=setTimeout(advance,delay);
}
function advance(){
  clearRuntime();const g=state.game;g.questionNumber++;

  if(g.showdown){
    const out=g.players.find(p=>p.eliminated);
    if(out){
      const champ=g.players.find(p=>p.id!==out.id);
      championCelebration(champ);return;
    }
    g.playerIndex=(g.playerIndex+1)%g.players.length;
    showGameTransition("next",()=>handoff());return;
  }

  // If a larger field has been reduced to two survivors, the playoff begins.
  if((g.startingPlayerCount||g.players.length)>2 && activeCount()<=2){
    showGameTransition("elimination",()=>startFinalShowdown());return;
  }

  // Game length remains the safety cap. If time/questions run out with more
  // than two players alive, the best two records advance to the playoff.
  const timeExpired=!state.quickGame&&(Date.now()-g.startedAt)/60000>=state.durationMinutes;
  if(timeExpired||g.questionNumber>=g.maxQuestions){
    showGameTransition("showdown",()=>endGame());return;
  }

  g.playerIndex=nextActiveIndex(g.playerIndex);
  showGameTransition("next",()=>handoff());
}

// ---------- PAUSE / SAVE ----------
function pauseGame(intent=""){
  if(!state.game)return;pausedAt=state.screen;if(state.screen==="question")pausedRemaining=state.game.questionRemaining;clearRuntime();stopMusic();
  const o=document.createElement("div");o.className="overlay";o.id="pauseOverlay";
  o.innerHTML=`<div class="pause-card card"><div class="pause-title">GAME PAUSED</div><button id="resumePause" class="btn primary large">RESUME</button><button id="leavePause" class="btn">LEAVE GAME</button><button id="endPause" class="btn danger">END GAME</button>${state.voiceOn?`<div class="pause-help">Say “Resume,” “Leave Game,” or “End Game.”</div><div class="pause-heard" id="pauseVoiceStatus">🎤 Listening…</div>`:""}</div>`;
  document.body.appendChild(o);document.getElementById("resumePause").onclick=resumePause;document.getElementById("leavePause").onclick=pauseLeave;document.getElementById("endPause").onclick=confirmEnd;
  if(state.voiceOn)startVoice("paused");
  if(intent==="leave")setTimeout(pauseLeave,120);if(intent==="end")setTimeout(confirmEnd,120);
}
function closePause(){stopVoice();document.getElementById("pauseOverlay")?.remove()}
function resumePause(){closePause();const s=pausedAt;pausedAt=null;if(s==="question")renderQuestion(true);else if(s==="result")result("timeout");else handoff()}
function pauseLeave(){saveJSON(STORAGE.session,{state:{...state,screen:pausedAt||state.screen},pausedRemaining});closePause();state=def();home()}
function resumeSaved(){
  const d=loadJSON(STORAGE.session,null);if(!d?.state)return;
  state={...def(),...d.state};pausedRemaining=d.pausedRemaining??null;localStorage.removeItem(STORAGE.session);
  if(state.screen==="question"&&state.game?.current)renderQuestion(true);else handoff();
}
function confirmEnd(){
  stopVoice();const c=document.querySelector(".pause-card");if(!c)return;
  c.innerHTML=`<div class="pause-title">END THIS GAME?</div><button id="yesEnd" class="btn danger large">YES, END GAME</button><button id="backPause" class="btn">GO BACK</button>`;
  document.getElementById("yesEnd").onclick=()=>{closePause();localStorage.removeItem(STORAGE.session);endGame()};
  document.getElementById("backPause").onclick=()=>{closePause();pauseGame()};
}
function victoryTrack(){
  ensureAudio();const notes=[523.25,659.25,783.99,1046.5,783.99,880,987.77,1046.5];notes.forEach((f,i)=>tone(f,.22,.09,i%2?"square":"triangle",i*.13));[130.81,164.81,196,261.63].forEach((f,i)=>tone(f,.32,.08,"sawtooth",i*.26));
}
function confetti(){const root=document.getElementById("confetti");if(!root)return;for(let i=0;i<70;i++){const x=document.createElement("i");x.style.left=`${Math.random()*100}%`;x.style.animationDelay=`${Math.random()*.7}s`;x.style.animationDuration=`${1.8+Math.random()*1.8}s`;x.style.transform=`rotate(${Math.random()*360}deg)`;root.appendChild(x)}}
function startFinalShowdown(){
  const survivors=activePlayers();
  const finalists=(survivors.length===2?survivors:regularRanking().slice(0,2));
  state.game.players=finalists.map(p=>({...p,playoff:0,strikes:0,eliminated:false}));
  state.game.playerIndex=0;state.game.showdown=true;state.game.questionNumber=0;state.game.maxQuestions=99;state.game.used=[];
  clearRuntime();stopMusic();state.screen="showdownIntro";
  const finalSeconds=Math.max(5,state.questionSeconds-5);
  app.innerHTML=shell({title:"Final Showdown",klass:"final-screen",content:`<div class="final-card card showdown-intro portrait-showdown"><div class="final-kicker">THE PLAYOFF BEGINS</div><div class="final-title">FINAL SHOWDOWN</div><div class="showdown-vs"><strong class="showdown-player showdown-player-a">${esc(state.game.players[0].name)}</strong><span class="showdown-vs-mark">VS</span><strong class="showdown-player showdown-player-b">${esc(state.game.players[1].name)}</strong></div><div class="final-note">3 strikes and you’re out.<br>Playoff questions: ${finalSeconds} seconds each.</div></div>`});
  tone(220,.25,.09,"sawtooth");tone(330,.25,.08,"sawtooth",.2);tone(440,.35,.08,"sawtooth",.4);hostSpeak("showdown",state.game.players[0]);setTimeout(handoff,3000);
}
function championCelebration(winner){
  clearRuntime();stopMusic();localStorage.removeItem(STORAGE.session);state.screen="complete";
  app.innerHTML=shell({title:"Game Complete",klass:"final-screen champion-screen",content:`<div id="confetti" class="confetti"></div><div class="final-card card champion-card"><div class="final-kicker">LAST ONE STANDING</div><div class="champion-crown">★</div><div class="final-title">${esc(winner.name)}</div><div class="champion-label">CHAMPION</div><div class="playoff-final">FINAL SHOWDOWN CHAMPION</div><div class="final-note">What a finish.</div></div>`,footer:`<button id="homeBtn" class="btn primary">BACK TO HOME</button>`});
  document.getElementById("homeBtn").onclick=()=>{state=def();home()};victoryTrack();confetti();setTimeout(()=>hostSpeak("champion",winner),500);
}
function endGame(){
  clearRuntime();stopMusic();localStorage.removeItem(STORAGE.session);
  if(state.mode!=="solo"&&state.game.players.length>1&&!state.game.showdown){startFinalShowdown();return}
  const winner=regularRanking()[0];championCelebration(winner);
}

// ---------- ORIENTATION / VIEWPORT ----------
function refreshViewport(){
  const vv=window.visualViewport;const w=Math.round(vv?.width||window.innerWidth),h=Math.round(vv?.height||window.innerHeight);
  document.documentElement.style.setProperty("--app-h",`${h}px`);
  document.documentElement.style.setProperty("--app-w",`${w}px`);
  const changed=Math.abs(w-lastViewport.w)>30||Math.abs(h-lastViewport.h)>30;lastViewport={w,h};
  if(changed){
    document.body.classList.add("reflowing");
    requestAnimationFrame(()=>requestAnimationFrame(()=>{void document.body.offsetHeight;document.body.classList.remove("reflowing")}));
  }
}
let resizeDebounce=null;
function scheduleViewportRefresh(){clearTimeout(resizeDebounce);refreshViewport();resizeDebounce=setTimeout(refreshViewport,160)}
window.addEventListener("resize",scheduleViewportRefresh,{passive:true});
window.addEventListener("orientationchange",()=>{refreshViewport();setTimeout(refreshViewport,80);setTimeout(refreshViewport,260)},{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener("resize",scheduleViewportRefresh,{passive:true});

function render(){
  clearRuntime();
  const map={home,mode,industry,packs,players,time,ready,handoff,question:()=>renderQuestion(true),result:()=>result("timeout")};
  (map[state.screen]||home)();refreshViewport();
}

function unlockPageOneAudio(){
  ensureAudio();
  if(["home","mode","industry","packs","players","time","ready"].includes(state.screen))startMusic();
  if(state.voiceOn&&!recognition&&["home","mode","industry","packs","players","time","ready"].includes(state.screen))startVoice(state.screen);
}
window.addEventListener("pointerdown",unlockPageOneAudio,{passive:true});
window.addEventListener("touchstart",unlockPageOneAudio,{passive:true});
window.addEventListener("keydown",unlockPageOneAudio,{passive:true});
window.addEventListener("error",e=>console.error("Build 3 error",e.error||e.message));
refreshViewport();home();
})();
