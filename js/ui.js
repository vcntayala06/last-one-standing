
export const app = document.getElementById("app");
export const qs = (s,root=document)=>root.querySelector(s);

export function button(label,id,cls="btn"){
  return `<button id="${id}" class="${cls}">${label}</button>`;
}

export function setupBack(id="backBtn"){
  return `<button id="${id}" class="btn panel back">← Back</button>`;
}

export function gameplayControls(state){
  return `<div class="top-controls">
    <button id="pauseBtn" class="icon-btn" title="Pause">Ⅱ</button>
    <button id="micBtn" class="icon-btn ${state.voiceMode?"":"mic-off"}" title="${state.voiceMode?"Voice on":"Voice off"}">🎤</button>
  </div>`;
}

export function scoreboardHtml(players,state){
  const ranked=[...players].sort((a,b)=>(state.stats[b.id]?.correct||0)-(state.stats[a.id]?.correct||0));
  return `<div class="scoreboard">${ranked.map((p,i)=>{
    const s=state.stats[p.id]||{correct:0,wrong:0,timeouts:0};
    return `<div class="scoreline"><span>${i+1}. ${displayName(p)}</span><strong>✓ ${s.correct} &nbsp; ✕ ${s.wrong} &nbsp; ⏱ ${s.timeouts}</strong></div>`;
  }).join("")}</div>`;
}

export function titleCase(text=""){
  const small=new Set(["and","or","the","of","in","on","at","to","for","a","an","by","with"]);
  return String(text).trim().toLowerCase().split(/\s+/).map((w,i)=>{
    if(i>0&&small.has(w))return w;
    return w.charAt(0).toUpperCase()+w.slice(1);
  }).join(" ");
}

export function displayName(p){
  return titleCase((p.nickname||"").trim() || `${p.first||""} ${p.last||""}`.trim());
}

export function fitQuestion(text){
  const el=document.getElementById("questionText");
  if(!el)return;
  const len=text.trim().length;
  if(len<=30) el.style.fontSize="clamp(6rem,14vw,12rem)";
  else if(len<=60) el.style.fontSize="clamp(5rem,11vw,9.5rem)";
  else if(len<=95) el.style.fontSize="clamp(4rem,9vw,7.5rem)";
  else el.style.fontSize="clamp(3.2rem,7vw,6rem)";
}
