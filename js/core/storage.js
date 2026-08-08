
const KEY="last-one-standing-v2";
const SESSION_KEY="last-one-standing-v2-active-session";

export function loadSavedState(){
  try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}
}

export function savePersistentState(state){
  localStorage.setItem(KEY,JSON.stringify({
    players:state.players,
    industry:state.industry,
    packs:state.packs,
    gameMinutes:state.gameMinutes,
    questionSeconds:state.questionSeconds,
    voiceEnabled:state.voiceEnabled
  }));
}

export function saveGameSession(snapshot){
  try{
    localStorage.setItem(SESSION_KEY,JSON.stringify(snapshot));
    return true;
  }catch{
    return false;
  }
}

export function loadGameSession(){
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    return raw?JSON.parse(raw):null;
  }catch{
    return null;
  }
}

export function hasGameSession(){
  return !!loadGameSession();
}

export function clearGameSession(){
  try{localStorage.removeItem(SESSION_KEY)}catch{}
}
