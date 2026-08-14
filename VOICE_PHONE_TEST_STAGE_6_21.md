# Stage 6.21 Phone Voice Test

Open the deployed game with `?voiceHealth=1` appended to its URL. The small developer overlay is diagnostic-only and can be removed by reopening the normal URL.

## Test checklist

- [ ] On Game Setup, whisper **“Medium.”** Confirm it selects on the first transcript.
- [ ] In a normal speaking voice, say **“Savage.”** Confirm it selects once.
- [ ] Say **“Read question on.”** Confirm Read Questions changes to On, persists, and the screen does not navigate.
- [ ] During an active match, say **“Leave Game.”** Confirm Home appears with Resume Game available.
- [ ] Start another turn and answer immediately when the Question appears. Confirm the first answer is not lost.
- [ ] Repeat the setup command and answer tests with ordinary TV or music playing nearby.
- [ ] Listen for one clear urgent cue at **5, 4, 3, 2, and 1**, followed by one timeout buzzer at zero.
- [ ] Confirm the turn begins with **“LOCK IN, [PLAYER NAME]”** and the name fits without clipping.
- [ ] Confirm exactly one Player-Up screen follows Lock In and contains the player name, **YOU’RE UP**, and the 3 → 2 → 1 countdown.

## If voice fails

Capture a screenshot of the Voice Health overlay and note:

- Build and current screen/session
- Desired mic state versus actual state
- Listening owner and recognition generation
- Language, continuous mode, interim-results state, and alternatives count
- Listening age and restart count
- Last interim and final transcript
- Last route and rejection reason
- Last recognition error and suppression reason

Interpretation:

- No interim/final text after speaking means the delay or miss occurred before the app received a transcript.
- A transcript with no route indicates an application command or ownership mismatch.
- `starting`, `stopped`, `error`, or `suppressed` while the screen appears ready identifies a lifecycle problem.
- A rising restart count indicates browser recognition termination rather than parser latency.

The Web Speech API does not expose microphone gain or reliable speaker identification. This checklist validates actual phone acoustics and browser service behavior that simulated transcripts cannot reproduce.
