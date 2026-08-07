
import {app,qs,gameplayControls,scoreboardHtml,displayName,fitQuestion,titleCase} from "./ui.js";
import {buildDeck,shuffled} from "./questions.js";

export class Game{
  constructor(state,questions,voice,renderSetup){
    this.state=state; this.questions=questions; this.voice=voice; this.renderSetup=renderSetup;
    this.timer=null; this.questionOpen=false; this.resultHold=null;
  }

  selectedPlayers(){
    return this.state.turnOrder.map(id=>this.state.players.find(p=>p.id===id)).filter(Boolean);
  }
  activePlayer(){ return this.selectedPlayers()[this.state.currentIndex % this.state.turnOrder.length] }

  async start(){
    const s=this.state;
    s.gamePaused=false; s.currentIndex=0; s.questionIndex=0; s.round=1; s.endAfterRound=false;
    s.turnOrder=shuffled(s.selectedIds);
    s.scores={}; s.stats={}; s.selectedIds.forEach(id=>{s.scores[id]=0;s.stats[id]={correct:0,wrong:0,timeouts:0}});
    s.deck=buildDeck(this.questions,{mode:s.gameMode,industry:s.industry});
    s.gameStartedAt=Date.now(); s.targetEndAt=s.gameStartedAt+s.gameMinutes*60000;
    if(s.voiceMode){ const ok=await this.voice.enable(); if(!ok)s.voiceMode=false; }
    this.renderReady();
  }

  attachTop(){
    qs("#pauseBtn")?.addEventListener("click",()=>this.togglePause());
    qs("#micBtn")?.addEventListener("click",async()=>{
      this.state.voiceMode=!this.state.voiceMode;
      if(this.state.voiceMode){
        const ok=await this.voice.enable();
        if(!ok)this.state.voiceMode=false;
      }else this.voice.stopRecognition();
      this.refreshTopButtons();
      if(this.state.voiceMode && this.questionOpen && !this.state.gamePaused)this.beginListening();
    });
  }

  refreshTopButtons(){
    const m=qs("#micBtn"); if(m){m.classList.toggle("mic-off",!this.state.voiceMode);m.title=this.state.voiceMode?"Voice on":"Voice off"}
    const p=qs("#pauseBtn"); if(p)p.textContent=this.state.gamePaused?"▶":"Ⅱ";
  }

  togglePause(){
    this.state.gamePaused=!this.state.gamePaused;
    document.getElementById("pauseOverlay").classList.toggle("show",this.state.gamePaused);
    if(this.state.gamePaused)this.voice.stopRecognition();
    else if(this.state.voiceMode && this.questionOpen)this.beginListening();
    this.refreshTopButtons();
  }

  renderReady(){
    const p=this.activePlayer(); let count=3;
    app.innerHTML=`<section class="screen">
      ${gameplayControls(this.state)}
      <div class="label">NEXT PLAYER</div>
      <div class="player-name">${displayName(p)}</div>
      <div style="font-size:1.3rem;margin-top:24px">Your turn starts in...</div>
      <div id="readyCount" class="countdown">${count}</div>
    </section>`;
    this.attachTop();
    const int=setInterval(()=>{
      if(this.state.gamePaused)return;
      count--;
      if(count>0)qs("#readyCount").textContent=count;
      else{clearInterval(int);this.renderQuestion()}
    },1000);
  }

  nextQuestion(){
    if(!this.state.deck.length)this.state.deck=buildDeck(this.questions,{mode:this.state.gameMode,industry:this.state.industry});
    if(this.state.questionIndex>=this.state.deck.length){this.state.deck=buildDeck(this.questions,{mode:this.state.gameMode,industry:this.state.industry});this.state.questionIndex=0}
    return this.state.deck[this.state.questionIndex];
  }

  renderQuestion(){
    const q=this.nextQuestion(); const p=this.activePlayer(); let remaining=this.state.questionSeconds; let finished=false;
    this.questionOpen=true;

    app.innerHTML=`<section class="screen">
      ${gameplayControls(this.state)}
      <div class="question-player">${displayName(p)}</div>
      <div class="divider"></div>
      <div id="questionText" class="question">${q.q}</div>
      <div id="questionTimer" class="countdown">${remaining}</div>
      <div class="label">ROUND ${this.state.round}</div>
    </section>`;
    fitQuestion(q.q); this.attachTop();

    const finish=(type,heard="")=>{
      if(finished)return; finished=true; this.questionOpen=false; clearInterval(this.timer); this.voice.stopRecognition();
      if(type==="correct"){this.state.stats[p.id].correct++;this.state.scores[p.id]++}
      else if(type==="wrong")this.state.stats[p.id].wrong++;
      else this.state.stats[p.id].timeouts++;
      this.renderResult(type,q,heard);
    };
    this.currentFinish=finish;

    this.timer=setInterval(()=>{
      if(this.state.gamePaused)return;
      remaining--; qs("#questionTimer").textContent=remaining;
      if(remaining<=0)finish("timeout");
    },1000);

    if(this.state.voiceMode)this.beginListening(q.answers);
  }

  beginListening(answers=null){
    const q=this.state.deck[this.state.questionIndex];
    this.voice.listen({
      answers:answers||q.answers,
      onCorrect:(heard)=>this.currentFinish?.("correct",heard),
      shouldContinue:()=>this.state.voiceMode && this.questionOpen && !this.state.gamePaused
    });
  }

  renderResult(type,q,heard){
    const players=this.state.players.filter(p=>this.state.selectedIds.includes(p.id));
    const cls=type==="correct"?"correct":type==="wrong"?"wrong":"timeout";
    const label=type==="correct"?"✓ CORRECT!":type==="wrong"?"✕ WRONG":"⏱ TIME'S UP!";
    app.innerHTML=`<section class="screen">
      ${gameplayControls(this.state)}
      <div class="result ${cls}">${label}</div>
      <div class="answer-label">CORRECT ANSWER</div>
      <div class="answer-big">${titleCase(q.answers[0])}</div>
      <div class="heading" style="font-size:1.35rem;margin-top:12px">CURRENT STANDINGS</div>
      ${scoreboardHtml(players,this.state)}
    </section>`;
    this.attachTop();

    let hold=4000;
    this.resultHold=setInterval(()=>{
      if(this.state.gamePaused)return;
      hold-=100;
      if(hold<=0){clearInterval(this.resultHold);this.advanceTurn()}
    },100);
  }

  advanceTurn(){
    this.state.questionIndex++;
    this.state.currentIndex++;
    if(Date.now()>=this.state.targetEndAt)this.state.endAfterRound=true;
    const endOfRound=this.state.currentIndex % this.state.turnOrder.length===0;
    if(endOfRound){
      if(this.state.endAfterRound)return this.renderFinal();
      this.state.round++;
    }
    this.renderReady();
  }

  renderFinal(){
    const players=this.state.players.filter(p=>this.state.selectedIds.includes(p.id));
    const ranked=[...players].sort((a,b)=>(this.state.stats[b.id]?.correct||0)-(this.state.stats[a.id]?.correct||0));
    app.innerHTML=`<section class="screen">
      <div class="label">FINAL RESULTS</div>
      <div class="title" style="font-size:clamp(3rem,8vw,6rem)">🏆 ${displayName(ranked[0])}</div>
      ${scoreboardHtml(players,this.state)}
      <div class="row" style="margin-top:20px">
        <button id="again" class="btn gold">PLAY AGAIN</button>
        <button id="menu" class="btn panel">MAIN MENU</button>
      </div>
    </section>`;
    qs("#again").onclick=()=>this.start();
    qs("#menu").onclick=()=>{this.voice.disable();this.renderSetup()}
  }
}
