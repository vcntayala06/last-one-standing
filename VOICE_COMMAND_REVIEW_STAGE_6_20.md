# Last One Standing Voice Command Review — Stage 6.20

This is the authoritative production voice-command map for Stage 6.20. Commands are owned by the current screen and runtime session. Exact, reversible setting changes may execute on interim recognition; navigation, destructive actions, player mutations, and answers require a final transcript unless noted.

| Screen | Intent | Supported phrases | Policy | Canonical action / notes |
|---|---|---|---|---|
| Home | Start | `Start`, `Start Game`, `Begin`, `Play` and established generic primary-action forms | Final only | Visible primary action / setup entry |
| Home | Resume saved game | `Resume`, `Resume Game`, `Continue Game` | Final only | `resumeSavedGame()` |
| Game Setup | Mode | `Original`, `Original Game`, `Work`, `Work Edition`, `Work Game`, `Solo`, `Solo Game` | Exact interim allowed | `setUnifiedMode()` |
| Game Setup | Difficulty | Visible labels `Easy`, `Medium`, `Hard`, `Savage`, optionally “questions” | Exact interim allowed | `setSetupDifficulty()` |
| Game Setup | Answer time | `10/15/20/30 seconds`, word-number variants, optional `Set Answer Time to` | Exact interim allowed | `setSetupSeconds()` |
| Game Setup | Game length | `5/10/15/20 minutes`, word-number variants, optional `Set Game Length to` | Exact interim allowed | `setGameDuration()` |
| Game Setup | Voice | `Voice On/Off`, `Turn Voice On/Off`, `Microphone On/Off` | Exact interim allowed | `setSetupVoiceVoice()`; Voice On explicitly clears permission block |
| Game Setup | Read questions | `Read Questions On/Off`, `Turn Read Questions On/Off`, `Question Reading On/Off`, established positive/negative forms | Exact interim allowed | `setReadQuestionsVoice()` |
| Game Setup | Volume | `Volume Up/Down`, `Louder`, `Quieter`, `Mute`, `Unmute`, `Full/Max Volume`, `Half Volume`, `Volume N`, `Set Volume to N Percent` | Exact interim allowed | Canonical `setVolume()` / `adjustGameVolume()` |
| Game Setup | Continue / Back / Exit | Established `Continue` family; `Back`, `Go Back`; setup Exit/Home forms | Final only | `startUnifiedGame()`, `back()`/Home, `exitSetup()` |
| Who’s In | Player count | `N Players`, `Set/Make It/Add N Players` (1–39) | Final only | Existing roster-size controller; does not auto-advance |
| Who’s In | Add player | `Add Player [name]`, `Add [name]`, `Player Named/Called [name]`, `Put [name] In` | Final only | `playersVoiceController()` |
| Who’s In | Rename | `Rename/Change/Edit Player N [to name]`, established pending-name flow | Final only | Existing player controller and rerender |
| Who’s In | Delete | `Delete/Remove Player N`, `Delete/Remove [name]` | Final only | Existing player controller |
| Who’s In | Spell name | `Spell Player N`, then letters; `Backspace`, `Clear`, `Done/Save`, `Cancel` | Final only | Existing spelling state |
| Who’s In | Navigation | Continue-family, `Back`/`Go Back`, setup Exit/Home forms | Final only | `playersContinue()`, `back()`, `exitSetup()` |
| Work / Industry | Industry | Exact visible industry labels | Exact interim allowed | Existing industry selection |
| Extra Categories (legacy/internal) | Select | Exact category names and aliases, `Add/Select/Choose [category]` | Exact interim allowed | `setCategorySelected(..., true)`; additive |
| Extra Categories (legacy/internal) | Remove/all | `Remove/Unselect/Deselect [category]`, `Select All`, `Clear All` | Exact interim allowed | Canonical category selection actions |
| Showtime / Ready | Start | `Start`, `Start Game`, `Begin`, `Begin Game` | Final only | Visible Showtime Start action |
| Showtime / Ready | Back / Exit | `Back`, `Go Back`; setup Exit/Leave/Home forms | Final only | Visible Back or `exitSetup()` |
| Player-Up / Countdown / Lock In | Pause | `Pause`, `Pause Game`, `Pause the Game`, `Hold On` when an active game exists | Final only | `pauseGame()`; other navigation is intentionally narrow |
| Active Question | Answer | Any final transcript accepted by the protected question matcher; up to five browser alternatives are inspected, bounded | Final only | `centralQuestionIntent()` → existing matcher → `finish("correct")`; no threshold changes |
| Active Question | Another guess | A final nonmatching answer-like transcript | Final only | Records an attempt; does not immediately strike |
| Active Question | Pass | `Pass`, `I Pass`, `Pass This`, established variants | Final only | `finish("pass")` |
| Active Question | Skip | `Skip`, `Skip It`, `Skip This One`, `Skip Question`, `Next Question` | Final only | `finish("pass")` with skip detail; showdown protections remain |
| Active Question | Pause | Pause forms above | Final only | `pauseGame()` |
| Active game | Save and leave | `Leave Game`, `Leave the Game`, `Exit Game`, `Exit the Game`, `Save and Leave`, `Save Game and Leave`, `Go Home and Save` | Final only, destructive | `leaveGame()`; saves Resume state and performs canonical cleanup |
| Active game | Quit/end | `Quit`, `Quit Game`, `End Game`, `Stop Game` and established “the game” forms | Final only, destructive | `confirmEnd()`; confirmation remains required |
| Pause | Resume | `Resume`, `Resume Game`, `Continue Game`, `Keep Playing`, `Continue` | Final only | `resumeGame()` with preserved question/time |
| Pause | Quit | Quit/end forms | Final only | `confirmEnd()` |
| Quit confirmation | Confirm | `Yes`, `Confirm`, `Do It`, `End Game`, `Exit`, `Quit` | Final transcript routed to visible modal | Existing confirmation action |
| Quit confirmation | Cancel | `No`, `Cancel`, `Go Back`, `Keep Playing`, `Resume` | Final transcript routed to visible modal | Existing cancel action and pause restoration |
| Result | Controls | Only exact visible supported controls and established generic primary action, when present | Navigation final only | Visible canonical control; previous answer finals are deduplicated by result slot |
| Final Showdown | Answers / pause / leave | Same active-question and active-game rules | Final only | No expansion of skip behavior |
| Champion | Replay | `Play Again`, `Play Another Game`, `Another Game` | Final only | `replayGame()` |
| Champion | Home | `Home`, `Go Home`, `Back to Home` | Final only | `championHome()` |

## Routing and deduplication policy

- The current screen/session owns every transcript; stale recognition generations are ignored.
- Safe exact settings can execute on an interim result. The matching final result for that recognition slot is then suppressed because an action actually executed.
- An unhandled interim result does not suppress its final result.
- Navigation and destructive commands are final-only to prevent television dialogue or partial utterances from moving the game.
- Player-name mutations and question answers remain final-only for accuracy.
- Exact supported commands are not rejected solely for low confidence. Confidence is diagnostic, not a hard threshold.
- Question answers retain the existing normalization, phonetic rules, thresholds, and semantics. Stage 6.20 only checks a bounded set of browser-provided alternatives before treating the utterance as wrong.

## Acoustic and browser boundary

The Web Speech API does not expose microphone gain, reliable speaker identity, or injectable acoustic test input. Automated party-noise tests therefore characterize application routing from simulated transcripts, not the browser’s acoustic recognition quality. The app cannot reliably distinguish the active player from another nearby speaker who says the exact answer. Live-device testing remains required for quiet speech, music/TV echo, browser-specific interim latency, and microphone hardware placement.
