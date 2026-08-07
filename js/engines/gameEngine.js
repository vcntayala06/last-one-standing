
import {app,qs,gameplayControls,playerDisplayName,scoreboardHtml,fitQuestion,titleCase} from "../core/ui.js";
import {shuffle} from "./questionEngine.js";

export class GameEngine{
  constructor({state,questionEngine,voiceEngine,onExit}){
    this.state=state;
    this.questionEngine=questionEngine;
    this.voice=voiceEngine;
    this.onExit=onExit;
    this.timerHandle=null;
    this.resultHandle=null;
    this.questionOpen=false;
    this.currentFinish=null;

    const resumeButton=document.getElementById("resumeGame")||document.getElementById("pauseResume");
    if(resumeButton){
      resumeButton.onclick=()=>this.setPaused(false);
    }
  }

  selectedPlayers(){
    return this.state.turnOrder.map(id=>this.state.players.find(p=>p.id===id)).filter(Boolean);
  }

  activePlayer(){
    return this.selectedPlayers()[this.state.currentPlayerIndex%this.state.turnOrder.length];
  }

  async start(){
    const s=this.state;

    s.paused=false;
    s.turnOrder=shuffle(s.selectedPlayerIds);
    s.currentPlayerIndex=0;
    s.round=1;
    s.questionIndex=0;
    s.endAfterRound=false;
    s.scores={};
    s.stats={};

    for(const id of s.selectedPlayerIds){
      s.scores[id]=0;
      s.stats[id]={correct:0,wrong:0,timeouts:0};
    }

    s.questionDeck=this.questionEngine.buildDeck({
      mode:s.mode,
      industry:s.industry,
      packs:s.packs
    });

    if(!s.questionDeck.length){
      alert("No questions are available for this setup yet.");
      this.onExit();
      return;
    }

    s.targetEndAt=Date.now()+s.gameMinutes*60000;

    if(s.voiceEnabled){
      const ok=await this.voice.ensureMic();
      if(!ok)s.voiceEnabled=false;
    }

    this.renderReadyPlayer();
  }

  attachTopControls(){
    qs("#pauseBtn")?.addEventListener("click",()=>this.setPaused(!this.state.paused));

    qs("#micBtn")?.addEventListener("click",async()=>{
      if(this.state.voiceEnabled){
        this.state.voiceEnabled=false;
        this.voice.stopRecognition();
      }else{
        const ok=await this.voice.ensureMic();
        this.state.voiceEnabled=ok;
      }

      this.updateTopControls();

      if(this.state.voiceEnabled&&this.questionOpen&&!this.state.paused){
        this.beginListening();
      }
    });
  }

  updateTopControls(){
    const pause=qs("#pauseBtn");
    const mic=qs("#micBtn");

    if(pause){
      pause.textContent=this.state.paused?"▶":"Ⅱ";
      pause.title=this.state.paused?"Resume":"Pause";
    }

    if(mic){
      mic.classList.toggle("mic-on",this.state.voiceEnabled);
      mic.classList.toggle("mic-off",!this.state.voiceEnabled);
      mic.title=this.state.voiceEnabled?"Voice on":"Voice off";
    }
  }

  setPaused(paused){
    this.state.paused=paused;
    const overlay=document.getElementById("pauseOverlay");
    if(overlay){
      overlay.classList.toggle("show",paused);
      overlay.setAttribute("aria-hidden",paused?"false":"true");
    }

    if(paused)this.voice.stopRecognition();
    else if(this.state.voiceEnabled&&this.questionOpen)this.beginListening();

    this.updateTopControls();
  }

  renderReadyPlayer(){
    const p=this.activePlayer();
    let count=3;

    app.innerHTML=`<section class="screen ready-screen">
      ${gameplayControls(this.state)}
      <div class="ready-label">NEXT PLAYER</div>
      <div class="ready-name">${playerDisplayName(p)}</div>
      <div class="ready-subtitle">Your turn starts in...</div>
      <div id="readyCount" class="big-countdown">${count}</div>
    </section>`;

    this.attachTopControls();

    const handle=setInterval(()=>{
      if(this.state.paused)return;

      count--;

      if(count>0){
        qs("#readyCount").textContent=count;
      }else{
        clearInterval(handle);
        this.renderQuestion();
      }
    },1000);
  }

  currentQuestion(){
    const s=this.state;

    if(s.questionIndex>=s.questionDeck.length){
      s.questionDeck=this.questionEngine.buildDeck({
        mode:s.mode,
        industry:s.industry,
        packs:s.packs
      });
      s.questionIndex=0;
    }

    return s.questionDeck[s.questionIndex];
  }

  renderQuestion(){
    const s=this.state;
    const q=this.currentQuestion();
    const p=this.activePlayer();

    let remaining=s.questionSeconds;
    let finished=false;

    this.questionOpen=true;

    app.innerHTML=`<section class="question-screen">
      ${gameplayControls(s)}

      <div class="question-player-zone">
        <div class="question-player-name">${playerDisplayName(p)}</div>
        <div class="question-divider"></div>
      </div>

      <div class="question-text-zone">
        <div id="questionText" class="question-text">${q.q}</div>
      </div>

      <div class="question-timer-zone">
        <div id="questionTimer" class="question-timer">${remaining}</div>
        <div class="round-label">ROUND ${s.round}</div>
      </div>
    </section>`;

    fitQuestion(q.q);
    this.attachTopControls();

    const finish=(type,heard="")=>{
      if(finished)return;
      finished=true;
      this.questionOpen=false;
      clearInterval(this.timerHandle);
      this.voice.stopRecognition();

      if(type==="correct"){
        s.stats[p.id].correct++;
        s.scores[p.id]++;
      }else if(type==="wrong"){
        s.stats[p.id].wrong++;
      }else{
        s.stats[p.id].timeouts++;
      }

      this.renderResult(type,q,heard);
    };

    this.currentFinish=finish;

    this.timerHandle=setInterval(()=>{
      if(s.paused)return;

      remaining--;
      qs("#questionTimer").textContent=Math.max(remaining,0);

      if(remaining<=0){
        finish("timeout");
      }
    },1000);

    if(s.voiceEnabled)this.beginListening();
  }

  beginListening(){
    const q=this.currentQuestion();

    this.voice.listen({
      answers:q.answers,
      onCorrect:heard=>this.currentFinish?.("correct",heard),
      shouldContinue:()=>this.state.voiceEnabled&&this.questionOpen&&!this.state.paused
    });
  }

  renderResult(type,q){
    const players=this.state.players.filter(p=>this.state.selectedPlayerIds.includes(p.id));
    const cls=type==="correct"?"correct":type==="wrong"?"wrong":"timeout";
    const label=type==="correct"?"✓ CORRECT!":type==="wrong"?"✕ WRONG":"⏱ TIME'S UP!";

    app.innerHTML=`<section class="screen result-screen">
      ${gameplayControls(this.state)}
      <div class="result-word ${cls}">${label}</div>
      <div class="answer-label">CORRECT ANSWER</div>
      <div class="answer-big">${titleCase(q.answers[0])}</div>
      <div class="heading" style="font-size:1.3rem;margin-top:10px">CURRENT STANDINGS</div>
      ${scoreboardHtml(players,this.state)}
    </section>`;

    this.attachTopControls();

    let hold=4000;
    this.resultHandle=setInterval(()=>{
      if(this.state.paused)return;

      hold-=100;

      if(hold<=0){
        clearInterval(this.resultHandle);
        this.advanceTurn();
      }
    },100);
  }

  advanceTurn(){
    const s=this.state;

    s.questionIndex++;
    s.currentPlayerIndex++;

    if(Date.now()>=s.targetEndAt)s.endAfterRound=true;

    const completedRound=s.currentPlayerIndex%s.turnOrder.length===0;

    if(completedRound){
      if(s.endAfterRound){
        this.renderFinal();
        return;
      }
      s.round++;
    }

    this.renderReadyPlayer();
  }

  renderFinal(){
    const players=this.state.players.filter(p=>this.state.selectedPlayerIds.includes(p.id));
    const ranked=[...players].sort((a,b)=>(this.state.stats[b.id]?.correct||0)-(this.state.stats[a.id]?.correct||0));

    app.innerHTML=`<section class="screen">
      <div class="eyebrow">FINAL RESULTS</div>
      <div class="home-title" style="font-size:clamp(3rem,8vw,6rem)">🏆 ${playerDisplayName(ranked[0])}</div>
      <div class="heading" style="font-size:1.3rem;margin-top:20px">STANDINGS</div>
      ${scoreboardHtml(players,this.state)}
      <div class="row" style="margin-top:22px">
        <button id="playAgain" class="btn btn-gold">PLAY AGAIN</button>
        <button id="mainMenu" class="btn btn-panel">MAIN MENU</button>
      </div>
    </section>`;

    qs("#playAgain").onclick=()=>this.start();
    qs("#mainMenu").onclick=()=>{
      this.voice.release();
      this.onExit();
    };
  }
}
