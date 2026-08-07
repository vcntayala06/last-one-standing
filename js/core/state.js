
export const DEFAULT_STATE = {
  mode:null,
  industry:null,
  packs:[],
  players:[],
  selectedPlayerIds:[],
  gameMinutes:30,
  questionSeconds:15,
  voiceEnabled:true,
  paused:false,

  turnOrder:[],
  currentPlayerIndex:0,
  round:1,
  scores:{},
  stats:{},
  questionDeck:[],
  questionIndex:0,
  targetEndAt:0,
  endAfterRound:false
};

export function createState(saved={}){
  return {
    ...structuredClone(DEFAULT_STATE),
    players:Array.isArray(saved.players)?saved.players:[],
    industry:saved.industry||null,
    packs:Array.isArray(saved.packs)?saved.packs:[],
    gameMinutes:Number(saved.gameMinutes)||30,
    questionSeconds:Number(saved.questionSeconds)||15,
    voiceEnabled:saved.voiceEnabled!==false
  };
}
