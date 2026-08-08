
import {app,qs,gameplayControls,playerDisplayName,scoreboardHtml,fitQuestion,titleCase} from "../core/ui.js";
import {shuffle} from "./questionEngine.js";
import {saveGameSession,loadGameSession,clearGameSession} from "../core/storage.js";

export class GameEngine{
  constructor({state,questionEngine,voiceEngine,audioEngine,onExit}){
    this.state=state;
    this.questionEngine=questionEngine;
    this.voice=voiceEngine;
    this.audio=audioEngine;
    this.onExit=onExit;
    this.timerHandle=null;
    this.resultHandle=null;
    this.questionOpen=false;
    this.currentFinish=null;
    this.phase="idle";
    this.pauseStartedAt=0;
    this.lastResult=null;

    const resumeButton=document.getElementById("resumeGame")||document.getElementById("pauseResume");
    if(resumeButton)resumeButton.onclick=()=>this.setPaused(false);

    const leaveButton=document.getElementById("pauseLeaveGame");
    if(leaveButton)leaveButton.onclick=()=>this.saveAndLeave();

    const endButton=document.getElementById("endCurrentGame");
    if(endButton)endButton.onclick=()=>this.endGame();

    document.addEventListener("visibilitychange",()=>{
      if(document.hidden&&this.isActiveGame()&&!this.state.paused){
        this.setPaused(true);
      }
    });

    window.addEventListener("pagehide",()=>{
      if(this.isActiveGame())this.saveSession();
    });
  }

  isActiveGame(){
    return ["ready","question","result"].includes(this.phase);
  }

  hidePauseOverlay(){
    const overlay=document.getElementById("pauseOverlay");
    if(overlay){
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden","true");
    }
  }

  saveSession(){
    if(!this.isActiveGame())return false;

    const remainingGameMs=Math.max(0,this.state.targetEndAt-Date.now());

    return saveGameSession({
      version:1,
      savedAt:Date.now(),
      phase:this.phase,
      remainingGameMs,
      state:JSON.parse(JSON.stringify(this.state))
    });
  }

  saveAndLeave(){
    if(!this.isActiveGame())return;

    this.state.questionRemaining=Math.max(0,Number(this.state.questionRemaining)||0);
    this.saveSession();

    clearInterval(this.timerHandle);
    clearInterval(this.resultHandle);
    this.voice.stopRecognition();

    this.phase="idle";
    this.state.paused=false;
    this.hidePauseOverlay();
    this.onExit();
  }

  endGame(){
    const ok=window.confirm("End this game? Your current progress will be discarded.");
    if(!ok)return;

    clearInterval(this.timerHandle);
    clearInterval(this.resultHandle);

    this.voice.release();
    clearGameSession();

    this.phase="idle";
    this.state.paused=false;
    this.hidePauseOverlay();
    this.onExit();
  }

  async resumeSaved(){
    const snapshot=loadGameSession();

    if(!snapshot?.state){
      clearGameSession();
      this.onExit();
      return;
    }

    Object.keys(this.state).forEach(k=>delete this.state[k]);
    Object.assign(this.state,snapshot.state);

    this.state.paused=false;
    this.state.targetEndAt=Date.now()+Math.max(0,Number(snapshot.remainingGameMs)||0);

    clearGameSession();
    this.hidePauseOverlay();

    await this.audio?.unlock?.();

    if(this.state.voiceEnabled){
      const ok=await this.voice.ensureMic();
      if(!ok)this.state.voiceEnabled=false;
    }

    if(snapshot.phase==="question"){
      this.renderQuestion(Math.max(1,Number(this.state.questionRemaining)||this.state.questionSeconds));
    }else if(snapshot.phase==="result"){
      this.advanceTurn();
    }else{
      this.renderReadyPlayer();
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

    clearGameSession();
    await this.audio?.unlock?.();

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

      const micStatus=qs("#micStatus");
      if(micStatus)micStatus.textContent=this.state.voiceEnabled?"Listening…":"Voice Off";

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
    if(this.state.paused===paused)return;

    this.state.paused=paused;

    const overlay=document.getElementById("pauseOverlay");

    if(overlay){
      overlay.classList.toggle("show",paused);
      overlay.setAttribute("aria-hidden",paused?"false":"true");
    }

    if(paused){
      this.pauseStartedAt=Date.now();
      this.voice.stopRecognition();
      this.saveSession();
    }else{
      if(this.pauseStartedAt&&this.state.targetEndAt){
        this.state.targetEndAt+=Date.now()-this.pauseStartedAt;
      }

      this.pauseStartedAt=0;

      if(this.state.voiceEnabled&&this.questionOpen)this.beginListening();
    }

    this.updateTopControls();
  }

  renderReadyPlayer(){
    this.phase="ready";
    this.audio?.nextPlayer?.();
    const p=this.activePlayer();
    let count=3;

    app.innerHTML=`<section class="screen ready-screen next-player-screen">
      ${gameplayControls(this.state)}
      <div class="next-player-stage">
        <div class="ready-label">NEXT PLAYER</div>
        <div class="ready-name">${playerDisplayName(p)}</div>
        <div class="next-player-hype">YOU’RE UP!</div>
        <div class="ready-subtitle">GET READY</div>
        <div id="readyCount" class="big-countdown">${count}</div>
      </div>
    </section>`;

    this.attachTopControls();

    const handle=setInterval(()=>{
      if(this.state.paused)return;

      count--;

      if(count>0){
        const readyEl=qs("#readyCount");
        if(readyEl)readyEl.textContent=count;
        this.audio?.tick?.();
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

  renderQuestion(startRemaining=null){
    this.phase="question";

    const s=this.state;
    const q=this.currentQuestion();
    const p=this.activePlayer();

    let remaining=Math.max(1,Number(startRemaining)||s.questionSeconds);
    s.questionRemaining=remaining;
    let finished=false;

    this.questionOpen=true;

    app.innerHTML=`<section class="question-screen">
      ${gameplayControls(s)}

      <div class="question-player-zone">
        <div class="question-player-name">${playerDisplayName(p)}</div>
        <div class="question-divider"></div>
      </div>

      <div class="question-text-zone">
        <div class="question-center-wrap">
          <div id="questionText" class="question-text">${q.q}</div>
        </div>
      </div>

      <div class="question-timer-zone">
        <div id="questionTimer" class="question-timer">${remaining}</div>
        <div class="round-label">ROUND ${s.round}</div>
        <div id="micStatus" class="mic-status">${s.voiceEnabled?"Listening…":"Voice Off"}</div>
      </div>
    </section>`;

    fitQuestion(q.q);
    this.attachTopControls();
    this.audio?.question?.();

    const finish=(type,heard="")=>{
      if(finished)return;
      finished=true;
      this.questionOpen=false;
      clearInterval(this.timerHandle);
      this.voice.stopRecognition();

      if(type==="correct"){
        s.stats[p.id].correct++;
        s.scores[p.id]++;
        this.audio?.correct?.();
      }else if(type==="wrong"){
        s.stats[p.id].wrong++;
        this.audio?.wrong?.();
      }else{
        s.stats[p.id].timeouts++;
        this.audio?.wrong?.();
      }

      this.renderResult(type,q,heard);
    };

    this.currentFinish=finish;

    this.timerHandle=setInterval(()=>{
      if(s.paused)return;

      remaining--;
      s.questionRemaining=Math.max(remaining,0);

      if(remaining>0)this.audio?.tick?.();

      const timerEl=qs("#questionTimer");
      if(timerEl)timerEl.textContent=Math.max(remaining,0);

      if(remaining<=0){
        finish("timeout");
      }
    },1000);

    if(s.voiceEnabled)this.beginListening();
  }

  beginListening(){
    const q=this.currentQuestion();

    const accepted=[
      ...(q.answers||[]),
      ...(q.answers_es||[]),
      ...(q.answers_fr||[])
    ];

    this.voice.listen({
      answers:accepted,
      onCorrect:heard=>this.currentFinish?.("correct",heard),
      onHeard:(heard,isFinal)=>{
        const micStatus=qs("#micStatus");

        if(micStatus){
          micStatus.textContent=`Heard: “${heard}”${isFinal?" — keep trying":""}`;

          clearTimeout(this.micStatusHandle);
          this.micStatusHandle=setTimeout(()=>{
            const el=qs("#micStatus");
            if(el&&this.questionOpen&&!this.state.paused){
              el.textContent=this.state.voiceEnabled?"Listening…":"Voice Off";
            }
          },750);
        }
      },
      shouldContinue:()=>this.state.voiceEnabled&&this.questionOpen&&!this.state.paused
    });
  }

  renderResult(type,q){
    this.phase="result";
    this.lastResult={type,questionId:q.id};

    const players=this.state.players.filter(p=>this.state.selectedPlayerIds.includes(p.id));
    const cls=type==="correct"?"correct":type==="wrong"?"wrong":"timeout";
    const label=type==="correct"?"✓ CORRECT!":type==="wrong"?"✕ WRONG":"⏱ TIME'S UP!";

    app.innerHTML=`<section class="screen result-screen result-${cls}">
      ${gameplayControls(this.state)}
      <div class="result-flash"></div>
      <div class="result-content">
      <div class="result-word ${cls}">${label}</div>
      <div class="answer-label">CORRECT ANSWER</div>
      <div class="answer-big">${titleCase(q.answers[0])}</div>
      ${type==="correct"?`<div class="correct-sparkle-burst" aria-hidden="true">✦ ✧ ✦</div>`:""}
      <div class="standings-block">
        <div class="current-standings-ribbon">CURRENT STANDINGS</div>
        ${scoreboardHtml(players,this.state)}
      </div>
      </div>
    </section>`;

    this.attachTopControls();

    let hold=3000;
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
    clearGameSession();

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
    this.phase="final";
    clearGameSession();

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
      this.phase="idle";
      this.voice.release();
      clearGameSession();
      this.onExit();
    };
  }
}
