
export function normalizeAnswer(text){
  let s=String(text??"").toLowerCase().trim();

  try{s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,"")}catch{}

  s=s
    .replace(/\bsaint\b/g,"st")
    .replace(/\bst[.]?\b/g,"st")
    .replace(/\bunited states of america\b/g,"usa")
    .replace(/\bunited states\b/g,"usa")
    .replace(/\bu[.]?s[.]?a[.]?\b/g,"usa")

    // Conversational filler should not invalidate the answer.
    .replace(/\b(i think|i guess|maybe|the answer is|answer is|it is|its|it's)\b/g," ")
    .replace(/\b(como se dice|cómo se dice|creo que|la respuesta es|es)\b/g," ")

    .replace(/['’`".,!?;:()[\]{}\-_/\\]/g," ")
    .replace(/\s+/g," ")
    .trim();

  return s;
}

function variants(text){
  const base=normalizeAnswer(text);
  const set=new Set([base]);

  if(base.endsWith("s")&&base.length>3)set.add(base.slice(0,-1));
  else if(base)set.add(base+"s");

  const pairs=[
    ["colour","color"],
    ["theatre","theater"],
    ["centre","center"],
    ["grey","gray"]
  ];

  for(const [a,b] of pairs){
    if(base.includes(a))set.add(base.replaceAll(a,b));
    if(base.includes(b))set.add(base.replaceAll(b,a));
  }

  return [...set].filter(Boolean);
}

export function acceptedAnswer(heard,answers){
  const hv=variants(heard);
  if(!hv.length)return false;

  return answers.some(answer=>{
    const av=variants(answer);

    return hv.some(h=>av.some(a=>{
      if(h===a)return true;

      // Only simple singular/plural forgiveness. No broad substring matches.
      if(h.endsWith("s")&&h.length>3&&h.slice(0,-1)===a)return true;
      if(a.endsWith("s")&&a.length>3&&a.slice(0,-1)===h)return true;

      return false;
    }));
  });
}

export class VoiceEngine{
  constructor(){
    this.stream=null;
    this.recognition=null;
    this.token=0;
    this.lastError="";
  }

  supported(){
    return !!(window.SpeechRecognition||window.webkitSpeechRecognition);
  }

  secureOrigin(){
    return location.protocol==="https:"||["localhost","127.0.0.1"].includes(location.hostname);
  }

  async ensureMic(){
    if(this.stream?.getAudioTracks().some(t=>t.readyState==="live"))return true;
    if(!navigator.mediaDevices?.getUserMedia){
      this.lastError="microphone unavailable";
      return false;
    }

    try{
      this.stream=await navigator.mediaDevices.getUserMedia({
        audio:{
          echoCancellation:true,
          noiseSuppression:true,
          autoGainControl:true
        }
      });
      this.lastError="";
      return true;
    }catch(err){
      this.lastError=err?.name||"microphone unavailable";
      return false;
    }
  }

  stopRecognition(){
    this.token++;

    if(this.recognition){
      try{
        this.recognition.onend=null;
        this.recognition.abort();
      }catch{}
    }

    this.recognition=null;
  }

  release(){
    this.stopRecognition();

    if(this.stream){
      try{this.stream.getTracks().forEach(t=>t.stop())}catch{}
    }

    this.stream=null;
  }

  listen({answers,onCorrect,onHeard,shouldContinue}){
    this.stopRecognition();

    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){
      this.lastError="speech recognition unavailable";
      return;
    }

    const token=++this.token;

    const begin=()=>{
      if(token!==this.token||!shouldContinue())return;

      try{
        const rec=new SR();
        this.recognition=rec;

        rec.lang="en-US";
        rec.interimResults=true;
        rec.continuous=false;
        rec.maxAlternatives=5;

        rec.onresult=e=>{
          if(token!==this.token||!shouldContinue())return;

          let lastFinal="";

          for(let r=e.resultIndex;r<e.results.length;r++){
            const result=e.results[r];

            for(let i=0;i<result.length;i++){
              const heard=result[i].transcript.trim();
              if(!heard)continue;
              onHeard?.(heard,result.isFinal);

              // Strict exact matching makes it safe to react to a confident
              // interim result instead of always waiting for finalization.
              if(acceptedAnswer(heard,answers)){
                this.token++;

                try{
                  rec.onend=null;
                  rec.stop();
                }catch{}

                onCorrect(heard);
                return;
              }

              if(result.isFinal&&i===0)lastFinal=heard;
            }
          }

          
        };

        rec.onerror=e=>{
          this.lastError=e?.error||"recognition error";
        };

        rec.onend=()=>{
          if(token===this.token&&shouldContinue()){
            setTimeout(begin,25);
          }
        };

        rec.start();
      }catch{
        if(token===this.token&&shouldContinue()){
          setTimeout(begin,60);
        }
      }
    };

    begin();
  }
}
