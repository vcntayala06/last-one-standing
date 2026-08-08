
import {Router} from "./core/router.js";
import {createState} from "./core/state.js";
import {loadSavedState} from "./core/storage.js";
import {loadQuestionCatalog} from "./core/catalog.js";
import {QuestionEngine} from "./engines/questionEngine.js";
import {VoiceEngine} from "./engines/voiceEngine.js";
import {AudioEngine} from "./engines/audioEngine.js";
import {GameEngine} from "./engines/gameEngine.js";
import {createScreens} from "./screens/screens.js";
import {app} from "./core/ui.js";

async function main(){
  const state=createState(loadSavedState());
  const router=new Router();
  const catalog=await loadQuestionCatalog();

  const questionEngine=new QuestionEngine(catalog);
  const voiceEngine=new VoiceEngine();
  const audioEngine=new AudioEngine();

  let game;

  const screens=createScreens({
    state,
    router,
    startGame:()=>game.start(),
    resumeGame:()=>game.resumeSaved(),
    audio:audioEngine
  });

  game=new GameEngine({
    state,
    questionEngine,
    voiceEngine,
    audioEngine,
    onExit:()=>router.go("home")
  });

  router.register("home",screens.home);
  router.register("mode",screens.mode);
  router.register("industry",screens.industry);
  router.register("packs",screens.packs);
  router.register("players",screens.players);
  router.register("add-player",screens.addPlayer);
  router.register("time",screens.time);
  router.register("ready",screens.ready);

  router.go("home");
}

main().catch(err=>{
  console.error(err);
  app.innerHTML=`<section class="screen">
    <div class="heading">Unable to start the game</div>
    <div class="card">${err.message}</div>
  </section>`;
});
