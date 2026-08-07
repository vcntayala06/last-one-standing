
import {app,qs,button,setupBack,titleCase} from "./ui.js";
import {loadQuestions} from "./questions.js";
import {VoiceEngine} from "./voice.js";
import {Game} from "./game.js";

const saved=JSON.parse(localStorage.getItem("los-master")||"{}");
const state={
  players:Array.isArray(saved.players)?saved.players:[],
  gameMode:null, industry:saved.industry||null, selectedIds:[],
  gameMinutes:30, questionSeconds:15, voiceMode:true, gamePaused:false,
  turnOrder:[], stats:{},scores:{},round:1,deck:[],questionIndex:0,currentIndex:0
};
const save=()=>localStorage.setItem("los-master",JSON.stringify({players:state.players,industry:state.industry}));

const voice=new VoiceEngine();
let questions=[];
let game;

function renderHome(){
  app.innerHTML=`<section class="screen">
    <div class="title">LAST ONE STANDING</div>
    <div class="subtitle">The Ultimate Voice-Powered Trivia Challenge</div>
    <button id="start" class="btn gold" style="min-width:300px">START</button>
  </section>`;
  qs("#start").onclick=renderMode;
}

function renderMode(){
  app.innerHTML=`<section class="screen">
    ${setupBack()}
    <div class="heading">Choose Your Game</div>
    <div class="row">
      <button class="btn gold mode-btn" data-mode="work">💼 WORK</button>
      <button class="btn gold mode-btn" data-mode="family">🏠 FAMILY</button>
      <button class="btn gold mode-btn" data-mode="friends">🎉 FRIENDS</button>
    </div>
  </section>`;
  qs("#backBtn").onclick=renderHome;
  document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{
    state.gameMode=b.dataset.mode;
    if(state.gameMode==="work")renderIndustry();
    else renderPlayers();
  });
}

function renderIndustry(){
  const opts=[
    ["transit","🚌 Transit"],["healthcare","🏥 Healthcare"],["first-responders","🚑 First Responders"],
    ["restaurant","🍔 Restaurant / Fast Food"],["retail","🛒 Retail"],["customer-service","📞 Customer Service"],
    ["office","🏢 Office / Corporate"],["warehouse","📦 Warehouse / Logistics"],["other","➕ Other"]
  ];
  app.innerHTML=`<section class="screen">
    ${setupBack()}
    <div class="heading">What type of business do you work for?</div>
    <div class="row">${opts.map(([v,l])=>`<button class="btn panel" data-industry="${v}">${l}</button>`).join("")}</div>
  </section>`;
  qs("#backBtn").onclick=renderMode;
  document.querySelectorAll("[data-industry]").forEach(b=>b.onclick=()=>{
    state.industry=b.dataset.industry;save();renderPlayers();
  });
}

function renderPlayers(){
  app.innerHTML=`<section class="screen">
    ${setupBack()}
    <div class="heading">Who's Playing?</div>
    <div class="player-list">
      ${state.players.length?state.players.map(p=>`
        <label class="player-row">
          <span>${titleCase((p.nickname||"").trim() || `${p.first} ${p.last}`)}</span>
          <input type="checkbox" data-player="${p.id}" ${state.selectedIds.includes(p.id)?"checked":""}>
        </label>`).join(""):`<div style="color:var(--muted)">No players yet.</div>`}
    </div>
    <div class="row">
      <button id="addPlayer" class="btn gold">+ ADD PLAYER</button>
      <button id="next" class="btn" ${state.selectedIds.length?"":"disabled"}>NEXT ▶</button>
    </div>
  </section>`;
  qs("#backBtn").onclick=()=>state.gameMode==="work"?renderIndustry():renderMode;
  document.querySelectorAll("[data-player]").forEach(c=>c.onchange=()=>{
    const id=c.dataset.player;
    if(c.checked&&!state.selectedIds.includes(id))state.selectedIds.push(id);
    if(!c.checked)state.selectedIds=state.selectedIds.filter(x=>x!==id);
    renderPlayers();
  });
  qs("#addPlayer").onclick=renderAddPlayer;
  qs("#next").onclick=renderTime;
}

function renderAddPlayer(){
  app.innerHTML=`<section class="screen">
    ${setupBack()}
    <div class="heading">Add New Player</div>
    <div class="stack">
      <label class="field">First name<input id="first"></label>
      <label class="field">Last name<input id="last"></label>
      <label class="field">Nickname<input id="nick"></label>
    </div>
    <div class="row" style="margin-top:16px"><button id="savePlayer" class="btn gold">SAVE</button></div>
  </section>`;
  qs("#backBtn").onclick=renderPlayers;
  qs("#savePlayer").onclick=()=>{
    const first=qs("#first").value.trim(),last=qs("#last").value.trim(),nickname=qs("#nick").value.trim();
    if(!first&&!nickname)return;
    const p={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),first,last,nickname};
    state.players.push(p);state.selectedIds.push(p.id);save();renderPlayers();
  };
}

function renderTime(){
  app.innerHTML=`<section class="screen">
    ${setupBack()}
    <div class="heading">How Much Time Do You Have?</div>
    <div class="row">
      ${[15,30,45,60].map(m=>`<button class="btn ${state.gameMinutes===m?"gold":"panel"}" data-min="${m}">${m} MIN</button>`).join("")}
    </div>
    <div class="card">
      <div class="heading" style="font-size:1.5rem">Question Timer</div>
      <div class="row">${[10,15,20,30].map(s=>`<button class="btn ${state.questionSeconds===s?"gold":"panel"}" data-sec="${s}">${s} SEC</button>`).join("")}</div>
    </div>
    <div class="card">
      <div class="heading" style="font-size:1.5rem">🎤 Voice Recognition</div>
      <div class="row">
        <button id="voiceOff" class="btn ${!state.voiceMode?"gold":"panel"}">OFF</button>
        <button id="voiceOn" class="btn ${state.voiceMode?"gold":"panel"}">ON</button>
      </div>
    </div>
    <button id="next" class="btn">NEXT ▶</button>
  </section>`;
  qs("#backBtn").onclick=renderPlayers;
  document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>{state.gameMinutes=Number(b.dataset.min);renderTime()});
  document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{state.questionSeconds=Number(b.dataset.sec);renderTime()});
  qs("#voiceOff").onclick=()=>{state.voiceMode=false;renderTime()};
  qs("#voiceOn").onclick=()=>{state.voiceMode=true;renderTime()};
  qs("#next").onclick=renderReady;
}

function renderReady(){
  app.innerHTML=`<section class="screen">
    ${setupBack()}
    <div class="heading">Ready to Play</div>
    <div class="card">
      <div><strong>Mode:</strong> ${titleCase(state.gameMode)}</div>
      ${state.gameMode==="work"?`<div><strong>Business:</strong> ${titleCase(state.industry||"other")}</div>`:""}
      <div><strong>Players:</strong> ${state.selectedIds.length}</div>
      <div><strong>Game:</strong> ${state.gameMinutes} minutes</div>
      <div><strong>Question timer:</strong> ${state.questionSeconds} seconds</div>
      <div><strong>Voice:</strong> ${state.voiceMode?"On":"Off"}</div>
    </div>
    <button id="play" class="btn gold" style="min-width:300px">PLAY</button>
  </section>`;
  qs("#backBtn").onclick=renderTime;
  qs("#play").onclick=()=>game.start();
}

async function init(){
  questions=await loadQuestions();
  game=new Game(state,questions,voice,renderHome);
  document.getElementById("pauseResume").onclick=()=>game.togglePause();
  renderHome();
}
init().catch(e=>{
  app.innerHTML=`<section class="screen"><div class="heading">Unable to start game</div><div class="card">${e.message}</div></section>`;
});
