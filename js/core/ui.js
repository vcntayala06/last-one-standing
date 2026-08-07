
export const app=document.getElementById("app");
export const qs=(s,root=document)=>root.querySelector(s);

export function titleCase(text=""){
  const small=new Set(["and","or","the","of","in","on","at","to","for","a","an","by","with"]);
  return String(text).trim().toLowerCase().split(/\s+/).filter(Boolean).map((word,i)=>{
    const clean=word.replace(/[^a-z0-9]/g,"").toUpperCase();
    if(["ADA","EMS","CPR","HIPAA","PPE","IT","TV","NBA","NFL","MLB","NHL","USA","US","UK"].includes(clean))return clean;
    if(i>0&&small.has(word))return word;
    return word.charAt(0).toUpperCase()+word.slice(1);
  }).join(" ");
}

export function playerDisplayName(player){
  const raw=(player.nickname||"").trim() || `${player.first||""} ${player.last||""}`.trim();
  return titleCase(raw);
}

export function setupBack(id="backBtn"){
  return `<button id="${id}" class="btn btn-panel back-btn">← Back</button>`;
}

export function gameplayControls(state){
  return `<div class="top-controls">
    <button id="pauseBtn" class="icon-btn" title="${state.paused?"Resume":"Pause"}">${state.paused?"▶":"Ⅱ"}</button>
    <button id="micBtn" class="icon-btn ${state.voiceEnabled?"mic-on":"mic-off"}" title="${state.voiceEnabled?"Voice on":"Voice off"}">🎤</button>
  </div>`;
}

export function scoreboardHtml(players,state){
  const ranked=[...players].sort((a,b)=>{
    const ac=state.stats[a.id]?.correct||0, bc=state.stats[b.id]?.correct||0;
    if(bc!==ac)return bc-ac;
    const aw=state.stats[a.id]?.wrong||0, bw=state.stats[b.id]?.wrong||0;
    return aw-bw;
  });

  return `<div class="scoreboard">
    ${ranked.map((p,i)=>{
      const s=state.stats[p.id]||{correct:0,wrong:0,timeouts:0};
      return `<div class="scoreline">
        <span>${i+1}. ${playerDisplayName(p)}</span>
        <strong>✓ ${s.correct} &nbsp; ✕ ${s.wrong} &nbsp; ⏱ ${s.timeouts}</strong>
      </div>`;
    }).join("")}
  </div>`;
}

export function fitQuestion(text){
  const el=document.getElementById("questionText");
  if(!el)return;
  const clean=String(text||"").trim();
  const len=clean.length;
  const words=clean.split(/\s+/).filter(Boolean).length;

  let size;
  if(len<=28&&words<=5) size="clamp(2.9rem,min(5.8vw,6.6vh),5.2rem)";
  else if(len<=55&&words<=10) size="clamp(2.6rem,min(5vw,5.8vh),4.6rem)";
  else if(len<=90&&words<=16) size="clamp(2.25rem,min(4.3vw,5vh),4rem)";
  else size="clamp(1.95rem,min(3.7vw,4.3vh),3.5rem)";

  el.style.fontSize=size;
}
