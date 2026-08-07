
const KEY="last-one-standing-v2";

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
