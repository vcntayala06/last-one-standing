
import {app,qs,setupBack,titleCase,playerDisplayName} from "../core/ui.js";
import {savePersistentState} from "../core/storage.js";

export function createScreens({state,router,startGame}){

  function persist(){savePersistentState(state)}

  function home(){
    app.innerHTML=`<section class="screen">
      <div class="home-title">LAST ONE STANDING</div>
      <div class="home-subtitle">The Ultimate Voice-Powered Trivia Challenge</div>
      <button id="start" class="btn btn-gold btn-large">START</button>
    </section>`;
    qs("#start").onclick=()=>router.go("mode");
  }

  function mode(){
    app.innerHTML=`<section class="screen">
      ${setupBack()}
      <div class="heading">Choose Your Game</div>
      <div class="mode-grid">
        <button class="btn btn-gold" data-mode="work">💼 WORK</button>
        <button class="btn btn-gold" data-mode="family">🏠 FAMILY</button>
        <button class="btn btn-gold" data-mode="friends">🎉 FRIENDS</button>
      </div>
    </section>`;

    qs("#backBtn").onclick=()=>router.go("home");

    document.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{
      state.mode=btn.dataset.mode;
      state.packs=[];
      if(state.mode==="work")router.go("industry");
      else router.go("packs");
    });
  }

  function industry(){
    const industries=[
      ["transit","🚌 Transit"],
      ["healthcare","🏥 Healthcare"],
      ["first-responders","🚑 First Responders"],
      ["restaurant","🍔 Restaurant / Fast Food"],
      ["retail","🛒 Retail"],
      ["customer-service","☎ Customer Service"],
      ["office","🏢 Office / Corporate"],
      ["warehouse","📦 Warehouse / Logistics"],
      ["other","➕ Other"]
    ];

    app.innerHTML=`<section class="screen">
      ${setupBack()}
      <div class="heading">What type of business do you work for?</div>
      <div class="industry-grid">
        ${industries.map(([id,label])=>`
          <button class="btn btn-panel ${state.industry===id?"selected":""}" data-industry="${id}">
            ${label}
          </button>`).join("")}
      </div>
    </section>`;

    qs("#backBtn").onclick=()=>router.go("mode");

    document.querySelectorAll("[data-industry]").forEach(btn=>btn.onclick=()=>{
      state.industry=btn.dataset.industry;
      persist();
      router.go("packs");
    });
  }

  function packs(){
    const packs=[
      ["music","🎵 Music"],
      ["hmm","🤔 Things That Make You Say Hmm"],
      ["real-or-made-up","📰 Real or Made Up?"],
      ["math","➗ Math"],
      ["should-know","💡 I Should Have Known That"],
      ["movies","🎬 Movies"],
      ["sports","🏆 Sports"],
      ["food","🍕 Food"],
      ["science","🔬 Science"],
      ["history","📚 History"],
      ["random-facts","🎲 Random Facts"]
    ];

    const selectedCount=state.packs.length;

    app.innerHTML=`<section class="screen packs-screen">
      ${setupBack()}

      <div class="packs-header">
        <div class="heading">Add Some Fun?</div>
        <div class="subtle">Optional — choose any extras, or skip.</div>
        <div class="packs-count">${selectedCount} ${selectedCount===1?"CATEGORY":"CATEGORIES"} SELECTED</div>
      </div>

      <div class="packs-scroll">
        <div class="pack-grid">
          ${packs.map(([id,label])=>{
            const selected=state.packs.includes(id);
            return `<button
              class="btn btn-panel pack-choice ${selected?"selected":""}"
              data-pack="${id}"
              aria-pressed="${selected?"true":"false"}">
              <span class="pack-check">${selected?"✓":""}</span>
              <span>${label}</span>
            </button>`;
          }).join("")}
        </div>
      </div>

      <div class="packs-actions">
        <button id="skipPacks" class="btn btn-panel">SKIP</button>
        <button id="nextPacks" class="btn">CONTINUE ▶</button>
      </div>
    </section>`;

    qs("#backBtn").onclick=()=>state.mode==="work"?router.go("industry"):router.go("mode");

    document.querySelectorAll("[data-pack]").forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.pack;

      if(state.packs.includes(id)){
        state.packs=state.packs.filter(x=>x!==id);
      }else{
        state.packs.push(id);
      }

      persist();
      packs();
    });

    qs("#skipPacks").onclick=()=>router.go("players");
    qs("#nextPacks").onclick=()=>router.go("players");
  }

  function players(){
    app.innerHTML=`<section class="screen">
      ${setupBack()}
      <div class="heading">Who's Playing?</div>

      <div class="player-list">
        ${state.players.length
          ? state.players.map(p=>`
            <label class="player-row">
              <span class="player-name-label">${playerDisplayName(p)}</span>
              <input type="checkbox" data-player="${p.id}" ${state.selectedPlayerIds.includes(p.id)?"checked":""}>
            </label>`).join("")
          : `<div class="subtle">No players yet.</div>`
        }
      </div>

      <div class="row" style="margin-top:16px">
        <button id="addPlayer" class="btn btn-gold">+ ADD PLAYER</button>
        <button id="nextPlayers" class="btn" ${state.selectedPlayerIds.length?"":"disabled"}>NEXT ▶</button>
      </div>
    </section>`;

    qs("#backBtn").onclick=()=>router.go("packs");

    document.querySelectorAll("[data-player]").forEach(box=>box.onchange=()=>{
      const id=box.dataset.player;
      if(box.checked&&!state.selectedPlayerIds.includes(id))state.selectedPlayerIds.push(id);
      if(!box.checked)state.selectedPlayerIds=state.selectedPlayerIds.filter(x=>x!==id);
      players();
    });

    qs("#addPlayer").onclick=()=>router.go("add-player");
    qs("#nextPlayers").onclick=()=>router.go("time");
  }

  function addPlayer(){
    app.innerHTML=`<section class="screen">
      ${setupBack()}
      <div class="heading">Add New Player</div>

      <div class="stack">
        <label class="field">First name<input id="firstName" autocomplete="off"></label>
        <label class="field">Last name<input id="lastName" autocomplete="off"></label>
        <label class="field">Nickname<input id="nickname" autocomplete="off"></label>
      </div>

      <button id="savePlayer" class="btn btn-gold" style="margin-top:18px">SAVE</button>
    </section>`;

    qs("#backBtn").onclick=()=>router.go("players");

    qs("#savePlayer").onclick=()=>{
      const first=qs("#firstName").value.trim();
      const last=qs("#lastName").value.trim();
      const nickname=qs("#nickname").value.trim();

      if(!first&&!nickname)return;

      const player={
        id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),
        first,
        last,
        nickname
      };

      state.players.push(player);
      state.selectedPlayerIds.push(player.id);
      persist();
      router.go("players");
    };
  }

  function time(){
    app.innerHTML=`<section class="screen">
      ${setupBack()}
      <div class="heading">Game Time</div>

      <div class="card">
        <div class="heading" style="font-size:1.45rem">How long do you want to play?</div>
        <div class="row">
          ${[15,30,45,60].map(m=>`
            <button class="btn ${state.gameMinutes===m?"btn-gold":"btn-panel"}" data-game-min="${m}">
              ${m} MIN
            </button>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="heading" style="font-size:1.45rem">Time per question</div>
        <div class="row">
          ${[10,15,20,30].map(s=>`
            <button class="btn ${state.questionSeconds===s?"btn-gold":"btn-panel"}" data-question-sec="${s}">
              ${s} SEC
            </button>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="heading" style="font-size:1.45rem">🎤 Voice Recognition</div>
        <div class="row">
          <button id="voiceOff" class="btn ${!state.voiceEnabled?"btn-gold":"btn-panel"}">OFF</button>
          <button id="voiceOn" class="btn ${state.voiceEnabled?"btn-gold":"btn-panel"}">ON</button>
        </div>
      </div>

      <button id="nextTime" class="btn">NEXT ▶</button>
    </section>`;

    qs("#backBtn").onclick=()=>router.go("players");

    document.querySelectorAll("[data-game-min]").forEach(btn=>btn.onclick=()=>{
      state.gameMinutes=Number(btn.dataset.gameMin);
      persist();
      time();
    });

    document.querySelectorAll("[data-question-sec]").forEach(btn=>btn.onclick=()=>{
      state.questionSeconds=Number(btn.dataset.questionSec);
      persist();
      time();
    });

    qs("#voiceOff").onclick=()=>{
      state.voiceEnabled=false;
      persist();
      time();
    };

    qs("#voiceOn").onclick=()=>{
      state.voiceEnabled=true;
      persist();
      time();
    };

    qs("#nextTime").onclick=()=>router.go("ready");
  }

  function ready(){
    const selected=state.players.filter(p=>state.selectedPlayerIds.includes(p.id));

    app.innerHTML=`<section class="screen">
      ${setupBack()}
      <div class="heading">Ready to Play</div>

      <div class="card summary-grid">
        <div class="summary-line"><span>Game</span><strong>${titleCase(state.mode)}</strong></div>
        ${state.mode==="work"?`<div class="summary-line"><span>Business</span><strong>${titleCase(state.industry||"Other")}</strong></div>`:""}
        <div class="summary-line"><span>Players</span><strong>${selected.length}</strong></div>
        <div class="summary-line"><span>Game Time</span><strong>${state.gameMinutes} min</strong></div>
        <div class="summary-line"><span>Question Timer</span><strong>${state.questionSeconds} sec</strong></div>
        <div class="summary-line"><span>Voice</span><strong>${state.voiceEnabled?"On":"Off"}</strong></div>
        <div class="summary-line"><span>Extra Packs</span><strong>${state.packs.length?state.packs.map(titleCase).join(", "):"None"}</strong></div>
      </div>

      <button id="playGame" class="btn btn-gold btn-large" style="margin-top:20px">PLAY</button>
    </section>`;

    qs("#backBtn").onclick=()=>router.go("time");
    qs("#playGame").onclick=()=>startGame();
  }

  return {home,mode,industry,packs,players,addPlayer,time,ready};
}
