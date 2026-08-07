
export function normalizeAnswer(text){
  let s=String(text??"").toLowerCase().trim();
  try{s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,"")}catch(e){}
  s=s.replace(/\bsaint\b/g,"st").replace(/\bst[.]?\b/g,"st");
  s=s.replace(/\bu[.]?s[.]?a[.]?\b/g,"usa").replace(/\bunited states of america\b/g,"usa").replace(/\bunited states\b/g,"usa");
  s=s.replace(/['’`".,!?;:()[\]{}\-_/\\]/g," ").replace(/\s+/g," ").trim();
  return s;
}

export function isAcceptedAnswer(heard,answers){
  const h=normalizeAnswer(heard);
  if(!h)return false;
  return answers.some(a=>{
    const x=normalizeAnswer(a);
    if(h===x)return true;
    if(h.length>=3&&x.length>=3&&(h.includes(x)||x.includes(h)))return true;
    if(h.endsWith("s")&&h.slice(0,-1)===x)return true;
    if(x.endsWith("s")&&x.slice(0,-1)===h)return true;
    return false;
  });
}

export class VoiceEngine{
  constructor(onState=()=>{}){
    this.stream=null; this.rec=null; this.active=false; this.onState=onState; this.token=0;
  }
  supported(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition) }
  secure(){ return location.protocol==="https:" || ["localhost","127.0.0.1"].includes(location.hostname) }
  async enable(){
    if(!navigator.mediaDevices?.getUserMedia)return false;
    if(this.stream?.getAudioTracks().some(t=>t.readyState==="live"))return true;
    try{ this.stream=await navigator.mediaDevices.getUserMedia({audio:true}); this.onState("ready"); return true }
    catch(e){ this.onState("denied"); return false }
  }
  stopRecognition(){
    this.token++;
    if(this.rec){ try{this.rec.onend=null;this.rec.abort()}catch(e){} }
    this.rec=null; this.active=false;
  }
  disable(){
    this.stopRecognition();
    if(this.stream){ try{this.stream.getTracks().forEach(t=>t.stop())}catch(e){} }
    this.stream=null;
  }
  listen({answers,onCorrect,shouldContinue}){
    this.stopRecognition();
    if(!this.supported())return;
    const token=++this.token;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

    const begin=()=>{
      if(token!==this.token || !shouldContinue())return;
      try{
        const rec=new SR();
        this.rec=rec; rec.lang="en-US"; rec.interimResults=true; rec.continuous=false; rec.maxAlternatives=5;
        rec.onstart=()=>{this.active=true};
        rec.onresult=e=>{
          if(token!==this.token||!shouldContinue())return;
          for(let r=e.resultIndex;r<e.results.length;r++){
            for(let i=0;i<e.results[r].length;i++){
              const text=e.results[r][i].transcript.trim();
              if(text && isAcceptedAnswer(text,answers)){
                this.token++; this.active=false;
                try{rec.onend=null;rec.stop()}catch(e){}
                onCorrect(text); return;
              }
            }
          }
        };
        rec.onerror=()=>{this.active=false};
        rec.onend=()=>{
          this.active=false;
          if(token===this.token && shouldContinue()) setTimeout(begin,220);
        };
        rec.start();
      }catch(e){
        if(token===this.token && shouldContinue())setTimeout(begin,350);
      }
    };
    begin();
  }
}
