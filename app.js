
(function(){
"use strict";

const app=document.getElementById("app");

const QUESTIONS=[
  {q:"What is the capital of France?", answers:["Paris"], accepted:["paris"], category:"General"},
  {q:"Which ocean is the largest on Earth?", answers:["Pacific Ocean"], accepted:["pacific ocean","the pacific ocean","pacific","océano pacífico","oceano pacifico"], category:"General"},
  {q:"How many sides does a hexagon have?", answers:["Six"], accepted:["six","6"], category:"General"},
  {q:"What planet is known as the Red Planet?", answers:["Mars"], accepted:["mars"], category:"Science"},
  {q:"What gas do humans need to breathe to survive?", answers:["Oxygen"], accepted:["oxygen","oxígeno","oxigeno"], category:"Science"},
  {q:"What is 12 times 12?", answers:["144"], accepted:["144","one hundred forty four","one hundred and forty four"], category:"Math"},
  {q:"What is the freezing point of water in Celsius?", answers:["Zero degrees Celsius"], accepted:["zero","0","zero degrees","0 degrees","zero degrees celsius"], category:"Science"},
  {q:"Which animal is known as the king of the jungle?", answers:["Lion"], accepted:["lion","a lion","the lion"], category:"General"},
  {q:"What color do you get when you mix blue and yellow?", answers:["Green"], accepted:["green"], category:"General"},
  {q:"What is the name of the toy cowboy in Toy Story?", answers:["Woody"], accepted:["woody"], category:"Movies"},
  {q:"What sport uses the terms love, deuce, and ace?", answers:["Tennis"], accepted:["tennis"], category:"Sports"},
  {q:"Which country is famous for the pyramids of Giza?", answers:["Egypt"], accepted:["egypt"], category:"History"},
  {q:"What is the largest mammal in the world?", answers:["Blue whale"], accepted:["blue whale","a blue whale","the blue whale"], category:"General"},
  {q:"What is five squared?", answers:["Twenty-five"], accepted:["25","twenty five"], category:"Math"},
  {q:"What instrument has black and white keys and is commonly played with both hands?", answers:["Piano"], accepted:["piano","a piano","the piano"], category:"Music"},
  {q:"What is the opposite of north on a compass?", answers:["South"], accepted:["south"], category:"General"},
  {q:"Which month has an extra day during a leap year?", answers:["February"], accepted:["february"], category:"General"},
  {q:"What is the chemical symbol for gold?", answers:["Au"], accepted:["au","a u"], category:"Science"},
  {q:"What do bees make?", answers:["Honey"], accepted:["honey"], category:"General"},
  {q:"How many minutes are in one hour?", answers:["Sixty"], accepted:["60","sixty"], category:"General"}
];

const WORK_TYPES=[
  ["transit","Transit"],
  ["healthcare","Healthcare"],
  ["first-responders","First Responders"],
  ["restaurant","Restaurant / Fast Food"],
  ["retail","Retail"],
  ["customer-service","Customer Service"],
  ["office","Office / Corporate"],
  ["warehouse","Warehouse / Logistics"],
  ["other","Other"]
];
const FUN_PACKS=["Music","Things That Make You Say Hmm","Real or Made Up?","Math","I Should Have Known That","Movies","Sports","Food","Science","History","Random Facts"];

const defaultState=()=>({
  screen:"home",
  mode:null,
  industry:null,
  packs:[],
  players:[],
  selectedPlayerIds:[],
  durationMinutes:15,
  questionSeconds:15,
  voiceOn:true,
  game:null
});

let state=defaultState();
let activeRecognition=null;
let activeTimer=null;
let handoffTimer=null;

function uid(){return Math.random().toString(36).slice(2,10)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function normalize(text){
  return String(text??"")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\b(i think|i guess|maybe|the answer is|answer is|it is|its|it's|como se dice|creo que|la respuesta es)\b/g," ")
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function stripArticle(s){return s.replace(/^(the|a|an)\s+/,"").trim()}
function levenshtein(a,b){
  const m=a.length,n=b.length;
  let prev=Array.from({length:n+1},(_,i)=>i);
  for(let i=1;i<=m;i++){
    const cur=[i];
    for(let j=1;j<=n;j++){
      cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    }
    prev=cur;
  }
  return prev[n];
}
function closeEnough(a,b){
  a=stripArticle(normalize(a)); b=stripArticle(normalize(b));
  if(!a||!b)return false;
  if(a===b)return true;
  if(a.length>3&&a.endsWith("s")&&a.slice(0,-1)===b)return true;
  if(b.length>3&&b.endsWith("s")&&b.slice(0,-1)===a)return true;

  const shortest=Math.min(a.length,b.length);
  const longest=Math.max(a.length,b.length);
  if(shortest<4)return false;

  const d=levenshtein(a,b);
  if(longest<=8)return d<=1;
  return d<=2 && d/longest<=0.15;
}
function acceptedAnswer(heard,q){
  const allowed=[...(q.accepted||[]),...(q.answers||[])];
  return allowed.some(a=>closeEnough(heard,a));
}
function clearRuntime(){
  if(activeTimer){clearInterval(activeTimer);activeTimer=null}
  if(handoffTimer){clearInterval(handoffTimer);handoffTimer=null}
  if(activeRecognition){
    try{activeRecognition.onend=null;activeRecognition.abort()}catch{}
    activeRecognition=null;
  }
}
function go(name){clearRuntime();state.screen=name;render()}
function screenShell({title="",back=null,content="",footer="",klass=""}){
  return `<section class="screen ${klass}">
    <header class="header">
      ${back?`<button class="back" id="backBtn" aria-label="Back">←</button>`:""}
      ${title?`<div class="title">${title}</div>`:""}
    </header>
    <div class="content">${content}</div>
    <footer class="footer">${footer}</footer>
  </section>`;
}
function playerName(p){return p?.name||"Player"}
function selectedPlayers(){
  if(state.mode==="solo") return state.players.slice(0,1);
  return state.players.filter(p=>state.selectedPlayerIds.includes(p.id));
}
function setupBack(target){
  const b=document.getElementById("backBtn");
  if(b)b.onclick=()=>go(target);
}

function home(){
  app.innerHTML=`<section class="screen no-footer"><div class="home">
    <div class="brand">LAST ONE<br>STANDING</div>
    <div class="home-tag">The Ultimate Voice-Powered Trivia Challenge</div>
    <div class="stack">
      <button id="start" class="btn primary large">START NEW GAME</button>
    </div>
  </div></section>`;
  document.getElementById("start").onclick=()=>{
    state=defaultState();
    go("mode");
  };
}
function mode(){
  app.innerHTML=screenShell({
    title:"Choose Your Game",
    back:"home",
    content:`<div class="stack">
      <button class="btn primary large" data-mode="work">💼 WORK</button>
      <button class="btn primary large" data-mode="family">🏠 FAMILY</button>
      <button class="btn primary large" data-mode="friends">🎉 FRIENDS</button>
      <button class="btn primary large" data-mode="solo">👤 SOLO</button>
    </div>`
  });
  setupBack("home");
  document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{
    state.mode=b.dataset.mode;
    state.industry=null;
    state.packs=[];
    go(state.mode==="work"?"industry":"packs");
  });
}
function industry(){
  app.innerHTML=screenShell({
    title:"What type of business do you work for?",
    back:"mode",
    content:`<div class="grid2">
      ${WORK_TYPES.map(([id,label])=>`<button class="btn ${state.industry===id?"selected":""}" data-industry="${id}">${label}</button>`).join("")}
    </div>`
  });
  setupBack("mode");
  document.querySelectorAll("[data-industry]").forEach(b=>b.onclick=()=>{
    state.industry=b.dataset.industry;
    go("packs");
  });
}
function packs(){
  app.innerHTML=screenShell({
    title:"Add Some Fun?",
    back:state.mode==="work"?"industry":"mode",
    content:`<div class="subtle" style="margin-bottom:10px">Optional — pick extras, or skip.</div>
      <div class="grid2">${FUN_PACKS.map(p=>`<button class="btn ${state.packs.includes(p)?"selected":""}" data-pack="${esc(p)}">${esc(p)}</button>`).join("")}</div>`,
    footer:`<div class="grid2">
      <button id="skip" class="btn">SKIP</button>
      <button id="continue" class="btn primary">CONTINUE ▶</button>
    </div>`
  });
  setupBack(state.mode==="work"?"industry":"mode");
  document.querySelectorAll("[data-pack]").forEach(b=>b.onclick=()=>{
    const p=b.dataset.pack;
    state.packs=state.packs.includes(p)?state.packs.filter(x=>x!==p):[...state.packs,p];
    b.classList.toggle("selected",state.packs.includes(p));
  });
  document.getElementById("skip").onclick=()=>go("players");
  document.getElementById("continue").onclick=()=>go("players");
}
function players(){
  if(state.players.length===0){
    state.players=[
      {id:uid(),name:state.mode==="solo"?"Player":"Player 1"},
      ...(state.mode==="solo"?[]:[{id:uid(),name:"Player 2"}])
    ];
    state.selectedPlayerIds=state.players.map(p=>p.id);
  }
  const maxPlayers=state.mode==="solo"?1:8;
  app.innerHTML=screenShell({
    title:state.mode==="solo"?"Your Player":"Who's Playing?",
    back:"packs",
    content:`<div class="card">
      ${state.players.map((p,i)=>`<div class="player-row">
        <input class="input" data-name="${p.id}" value="${esc(p.name)}" maxlength="24" aria-label="Player name">
        ${state.mode==="solo"?"":`<label><input type="checkbox" data-select="${p.id}" ${state.selectedPlayerIds.includes(p.id)?"checked":""}> Play</label>`}
      </div>`).join("")}
      ${state.players.length<maxPlayers?`<button id="addPlayer" class="btn" style="width:100%;margin-top:10px">+ ADD PLAYER</button>`:""}
    </div>`,
    footer:`<button id="playersContinue" class="btn primary">CONTINUE ▶</button>`
  });
  setupBack("packs");
  document.querySelectorAll("[data-name]").forEach(inp=>inp.oninput=()=>{
    const p=state.players.find(x=>x.id===inp.dataset.name);
    if(p)p.name=inp.value.trim()||"Player";
  });
  document.querySelectorAll("[data-select]").forEach(inp=>inp.onchange=()=>{
    const id=inp.dataset.select;
    if(inp.checked){
      if(!state.selectedPlayerIds.includes(id))state.selectedPlayerIds.push(id);
    }else state.selectedPlayerIds=state.selectedPlayerIds.filter(x=>x!==id);
  });
  const add=document.getElementById("addPlayer");
  if(add)add.onclick=()=>{
    const p={id:uid(),name:`Player ${state.players.length+1}`};
    state.players.push(p);state.selectedPlayerIds.push(p.id);players();
  };
  document.getElementById("playersContinue").onclick=()=>{
    const active=selectedPlayers();
    if(!active.length){alert("Select at least one player.");return}
    go("time");
  };
}
function time(){
  const choice=(value,current,attr)=>`<button class="btn ${value===current?"selected":""}" data-${attr}="${value}">${value}${attr==="duration"?" MIN":" SEC"}</button>`;
  app.innerHTML=screenShell({
    title:"Game Time",
    back:"players",
    klass:"time-screen",
    content:`<div class="time-grid">
      <div class="card time-card">
        <div class="option-title">How long do you want to play?</div>
        <div class="grid4">${[15,30,45,60].map(v=>choice(v,state.durationMinutes,"duration")).join("")}</div>
      </div>
      <div class="card time-card">
        <div class="option-title">Time per question</div>
        <div class="grid4">${[10,15,20,30].map(v=>choice(v,state.questionSeconds,"seconds")).join("")}</div>
      </div>
      <div class="card time-card">
        <div class="option-title">Voice Recognition</div>
        <div class="voice-row">
          <button class="btn ${!state.voiceOn?"selected":""}" id="voiceOff">OFF</button>
          <button class="btn ${state.voiceOn?"selected":""}" id="voiceOn">ON</button>
        </div>
      </div>
    </div>`,
    footer:`<button id="timeContinue" class="btn primary">CONTINUE ▶</button>`
  });
  setupBack("players");
  document.querySelectorAll("[data-duration]").forEach(b=>b.onclick=()=>{state.durationMinutes=Number(b.dataset.duration);time()});
  document.querySelectorAll("[data-seconds]").forEach(b=>b.onclick=()=>{state.questionSeconds=Number(b.dataset.seconds);time()});
  document.getElementById("voiceOff").onclick=()=>{state.voiceOn=false;time()};
  document.getElementById("voiceOn").onclick=()=>{state.voiceOn=true;time()};
  document.getElementById("timeContinue").onclick=()=>go("ready");
}
function ready(){
  const players=selectedPlayers();
  app.innerHTML=screenShell({
    title:"",
    back:"time",
    content:`<div class="ready-wrap"><div class="card ready-card">
      <div class="title">Ready to Play?</div>
      <div class="summary">
        <div class="summary-line"><span>Game</span><strong>${esc(state.mode?.toUpperCase())}</strong></div>
        <div class="summary-line"><span>Players</span><strong>${players.length}</strong></div>
        <div class="summary-line"><span>Game Length</span><strong>${state.durationMinutes} min</strong></div>
        <div class="summary-line"><span>Question Time</span><strong>${state.questionSeconds} sec</strong></div>
        <div class="summary-line"><span>Voice Recognition</span><strong>${state.voiceOn?"ON":"OFF"}</strong></div>
      </div>
    </div></div>`,
    footer:`<button id="play" class="btn primary large">PLAY ▶</button>`
  });
  setupBack("time");
  document.getElementById("play").onclick=startGame;
}
function startGame(){
  const players=selectedPlayers().map(p=>({...p,correct:0,wrong:0,timeout:0}));
  state.game={
    players,
    playerIndex:0,
    questionIndex:0,
    used:[],
    current:null,
    answered:false,
    startedAt:Date.now()
  };
  go("handoff");
}
function handoff(){
  const g=state.game;
  const p=g.players[g.playerIndex];
  app.innerHTML=`<section class="screen no-footer">
    <div class="handoff">
      <div class="handoff-label">NEXT PLAYER</div>
      <div class="handoff-name">${esc(playerName(p))}</div>
      <div class="handoff-hype">YOU'RE UP!</div>
      <div class="handoff-sub">GET READY</div>
      <div class="countdown" id="countdown">3</div>
    </div>
  </section>`;
  let n=3;
  handoffTimer=setInterval(()=>{
    n--;
    const el=document.getElementById("countdown");
    if(n>0){if(el)el.textContent=String(n)}
    else{
      clearInterval(handoffTimer);handoffTimer=null;
      showQuestion();
    }
  },650);
}
function nextQuestion(){
  const g=state.game;
  const available=QUESTIONS.map((_,i)=>i).filter(i=>!g.used.includes(i));
  if(!available.length)g.used=[];
  const pool=QUESTIONS.map((_,i)=>i).filter(i=>!g.used.includes(i));
  const idx=pool[Math.floor(Math.random()*pool.length)];
  g.used.push(idx);
  g.current=QUESTIONS[idx];
  return g.current;
}
function showQuestion(){
  clearRuntime();
  const g=state.game;
  const p=g.players[g.playerIndex];
  const q=nextQuestion();
  g.answered=false;
  let seconds=state.questionSeconds;

  app.innerHTML=`<section class="screen question-screen">
    <div class="gamebar">
      <div class="player">${esc(playerName(p))}</div>
      <div class="timer" id="timer">${seconds}</div>
      <div class="qnum">Question ${g.questionIndex+1}</div>
    </div>
    <div class="question-center">
      <div class="question-text">${esc(q.q)}</div>
      <div class="heard" id="heard">${state.voiceOn?"Listening…":"Type your answer below"}</div>
      ${state.voiceOn?"":`
        <div class="typed-answer-wrap">
          <input
            id="typedAnswer"
            class="input typed-answer-input"
            type="text"
            inputmode="text"
            autocomplete="off"
            autocapitalize="sentences"
            spellcheck="true"
            placeholder="Type your answer…"
            aria-label="Type your answer">
          <button id="submitTyped" class="btn primary typed-submit">SUBMIT</button>
        </div>`}
    </div>
    <div class="manual-controls">
      <button class="btn success" id="manualCorrect">✓ CORRECT</button>
      <button class="btn danger" id="manualWrong">✕ WRONG</button>
      <button class="btn" id="manualTimeout">⏱ TIME OUT</button>
    </div>
  </section>`;

  document.getElementById("manualCorrect").onclick=()=>finishQuestion("correct","Manual");
  document.getElementById("manualWrong").onclick=()=>finishQuestion("wrong","Manual");
  document.getElementById("manualTimeout").onclick=()=>finishQuestion("timeout","Manual");

  if(!state.voiceOn){
    const typed=document.getElementById("typedAnswer");
    const submit=document.getElementById("submitTyped");

    const submitTypedAnswer=()=>{
      if(!typed||g.answered)return;
      const heard=typed.value.trim();
      if(!heard)return;

      const heardEl=document.getElementById("heard");
      if(heardEl)heardEl.textContent=`Entered: “${heard}”`;

      if(acceptedAnswer(heard,q)){
        finishQuestion("correct",heard);
      }else{
        typed.value="";
        typed.focus();
        if(heardEl)heardEl.textContent="Not quite — keep trying while the timer runs.";
      }
    };

    submit.onclick=submitTypedAnswer;
    typed.addEventListener("keydown",e=>{
      if(e.key==="Enter"){
        e.preventDefault();
        submitTypedAnswer();
      }
    });

    // Let the screen render before focusing, so mobile keyboards open reliably
    // when the player taps the field rather than being forced open.
  }

  activeTimer=setInterval(()=>{
    seconds--;
    const el=document.getElementById("timer");
    if(el)el.textContent=String(Math.max(seconds,0));
    if(seconds<=0)finishQuestion("timeout","");
  },1000);

  if(state.voiceOn)startRecognition(q);
}
function startRecognition(q){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const heardEl=document.getElementById("heard");
  if(!SR){
    if(heardEl)heardEl.textContent="Voice recognition unavailable — use the buttons below.";
    return;
  }
  const begin=()=>{
    if(state.screen!=="question"||state.game?.answered)return;
    try{
      const rec=new SR();
      activeRecognition=rec;
      rec.lang="en-US";
      rec.interimResults=true;
      rec.continuous=false;
      rec.maxAlternatives=5;
      rec.onresult=e=>{
        for(let r=e.resultIndex;r<e.results.length;r++){
          const result=e.results[r];
          for(let i=0;i<result.length;i++){
            const heard=result[i].transcript.trim();
            if(!heard)continue;
            if(heardEl)heardEl.textContent=`Heard: “${heard}”`;
            if(acceptedAnswer(heard,q)){
              finishQuestion("correct",heard);
              return;
            }
          }
        }
      };
      rec.onend=()=>{
        if(state.screen==="question"&&!state.game?.answered)setTimeout(begin,90);
      };
      rec.onerror=()=>{};
      rec.start();
    }catch{
      setTimeout(begin,150);
    }
  };
  begin();
}
function finishQuestion(outcome,heard){
  const g=state.game;
  if(!g||g.answered)return;
  g.answered=true;
  clearRuntime();

  const p=g.players[g.playerIndex];
  if(outcome==="correct")p.correct++;
  else if(outcome==="wrong")p.wrong++;
  else p.timeout++;

  showResult(outcome);
}
function scoreboard(){
  return `<div class="scoreboard">${state.game.players.map((p,i)=>`
    <div class="score-ribbon">
      <div class="score-name">${i+1}. ${esc(playerName(p))}</div>
      <div class="score-stat correct">✓ <span>Correct</span> ${p.correct}</div>
      <div class="score-stat wrong">✕ <span>Wrong</span> ${p.wrong}</div>
      <div class="score-stat timeout">⏱ <span>Timed Out</span> ${p.timeout}</div>
    </div>`).join("")}</div>`;
}
function showResult(outcome){
  const g=state.game;
  const q=g.current;
  const label=outcome==="correct"?"CORRECT!":outcome==="wrong"?"NOT QUITE":"TIME'S UP";
  app.innerHTML=screenShell({
    title:"",
    content:`<div class="result-center">
      <div class="result-word ${outcome}">${label}</div>
      <div class="answer-label">CORRECT ANSWER</div>
      <div class="answer-big">${esc(q.answers[0])}</div>
      <div class="standings-title">CURRENT STANDINGS</div>
      ${scoreboard()}
    </div>`,
    footer:`<button id="nextTurn" class="btn primary">NEXT ▶</button>`
  });
  document.getElementById("nextTurn").onclick=advance;
}
function advance(){
  const g=state.game;
  g.questionIndex++;
  const elapsed=(Date.now()-g.startedAt)/60000;
  const reachedTime=elapsed>=state.durationMinutes;

  if(reachedTime||g.questionIndex>=20){
    endGame();
    return;
  }
  g.playerIndex=(g.playerIndex+1)%g.players.length;
  go("handoff");
}
function endGame(){
  clearRuntime();
  const ranked=[...state.game.players].sort((a,b)=>
    (b.correct-a.correct)||(a.wrong-b.wrong)||(a.timeout-b.timeout)
  );
  const winner=ranked[0];
  app.innerHTML=screenShell({
    title:state.mode==="solo"?"Final Challenge Complete":"Game Complete",
    content:`<div class="final-box card">
      <div class="title">${state.mode==="solo"?"Nice run!":`${esc(playerName(winner))} wins!`}</div>
      <div class="subtle" style="margin:10px 0 14px">Core game loop complete.</div>
      ${scoreboard()}
    </div>`,
    footer:`<button id="homeAgain" class="btn primary">BACK TO HOME</button>`
  });
  document.getElementById("homeAgain").onclick=()=>{state=defaultState();go("home")};
}

function render(){
  clearRuntime();
  switch(state.screen){
    case "home": return home();
    case "mode": return mode();
    case "industry": return industry();
    case "packs": return packs();
    case "players": return players();
    case "time": return time();
    case "ready": return ready();
    case "handoff": return handoff();
    default:return home();
  }
}

window.addEventListener("error",e=>{
  console.error("Last One Standing runtime error:",e.error||e.message);
});
render();
})();
