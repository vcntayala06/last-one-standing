# Build 6.24 — iPhone voice-enable diagnosis

## Finding

Build 6.23 incorrectly collapsed two distinct `startVoice()` failures into the same `voice-off` diagnostic:

1. `state.voiceOn === false`, normally loaded from the device-local `los5_voice` preference.
2. Neither `window.SpeechRecognition` nor `window.webkitSpeechRecognition` exists.

Both called `stopVoice()`, which unconditionally set `desired=false`, `state=stopped`, and `suppressed=voice-off`. Consequently, the physical iPhone observation could not distinguish a persisted Voice Off setting from WebKit exposing no Web Speech recognition API.

There is no iPhone/Safari user-agent branch, secure-context branch, Question/game-state branch, or debug-query branch that disables recognition. Every rendered Question calls `startVoice("question")`. Desktop reaches `desired=true` because its device-local Voice preference is on and a recognition constructor exists.

## Diagnostic-only correction

Build 6.24 preserves behavior and reports the real decision:

- `voice-setting-off`: persisted/current Voice toggle is off.
- `speech-api-unavailable`: Voice is on, but neither recognition constructor exists.
- `permission-blocked`: an earlier `not-allowed` or `service-not-allowed` error blocked retries.
- `permission-error`: the callback that created that block.
- `host-speaking`: recognition start is temporarily deferred during existing Host playback.
- `start-requested`: prerequisites passed and recognition is desired.

The phone HUD now exposes the current and stored Voice setting, API constructor, API support, secure-context state, permission block, Host playback state, owner, and last desired-state decision.

No answer matching, question-bank, scoring, screen, Host/audio, or speech-engine behavior changed.

## Physical acceptance

Open the deployed game with `?voiceHealth=1`, enter an active Question, and record:

- `decision`
- `setting` and `stored`
- `API`, `supported`, and `secure`
- `permissionBlocked` and `hostSpeaking`
- `desired`, `state`, `error`, and `suppressed`

This build is not voice-fixed. Acceptance requires the physical iPhone to show `desired=true`, a recognition-start attempt, and then transcript activity or a real Safari/WebKit error.
