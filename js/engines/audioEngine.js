
export class AudioEngine{
  constructor(){
    this.ctx=null;
    this.enabled=true;
  }

  async unlock(){
    if(!this.enabled)return;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;

    try{
      if(!this.ctx)this.ctx=new Ctx();
      if(this.ctx.state==="suspended")await this.ctx.resume();
    }catch{}
  }

  tone(freq=440,duration=.12,type="sine",gain=.05){
    if(!this.enabled)return;

    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;

    try{
      if(!this.ctx)this.ctx=new Ctx();
      const ctx=this.ctx;
      const osc=ctx.createOscillator();
      const amp=ctx.createGain();

      osc.type=type;
      osc.frequency.value=freq;

      amp.gain.setValueAtTime(.0001,ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(Math.max(gain,.0002),ctx.currentTime+.015);
      amp.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);

      osc.connect(amp);
      amp.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime+duration+.03);
    }catch{}
  }

  tick(){
    this.tone(520,.055,"sine",.025);
  }

  correct(){
    this.tone(660,.11,"sine",.055);
    setTimeout(()=>this.tone(880,.14,"sine",.05),90);
  }

  wrong(){
    this.tone(190,.22,"square",.035);
  }
}
