
export class AudioEngine{
  constructor(){
    this.ctx=null;
    this.enabled=true;
  }

  async unlock(){
    if(!this.enabled)return false;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return false;

    try{
      if(!this.ctx)this.ctx=new Ctx();
      if(this.ctx.state==="suspended")await this.ctx.resume();

      // iOS benefits from a tiny immediate sound in the original tap gesture.
      const osc=this.ctx.createOscillator();
      const gain=this.ctx.createGain();
      gain.gain.value=.0001;
      osc.frequency.value=20;
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime+.02);
      return true;
    }catch{
      return false;
    }
  }

  tone(freq=440,duration=.12,type="sine",gain=.05){
    if(!this.enabled)return;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;

    try{
      if(!this.ctx)this.ctx=new Ctx();
      const ctx=this.ctx;

      if(ctx.state==="suspended"){
        ctx.resume().catch(()=>{});
      }

      const osc=ctx.createOscillator();
      const amp=ctx.createGain();

      osc.type=type;
      osc.frequency.value=freq;

      amp.gain.setValueAtTime(.0001,ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(Math.max(gain,.0002),ctx.currentTime+.012);
      amp.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);

      osc.connect(amp);
      amp.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime+duration+.03);
    }catch{}
  }

  question(){
    this.tone(430,.065,"sine",.032);
  }

  tick(){
    this.tone(540,.06,"sine",.035);
  }

  correct(){
    this.tone(660,.10,"sine",.065);
    setTimeout(()=>this.tone(880,.12,"sine",.06),80);
    setTimeout(()=>this.tone(1040,.13,"sine",.05),155);
  }

  wrong(){
    this.tone(210,.16,"triangle",.045);
    setTimeout(()=>this.tone(165,.18,"triangle",.04),105);
  }
}
