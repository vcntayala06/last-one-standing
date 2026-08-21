# Stage 6.23 — Voice responsiveness and forgiving answers

## Diagnosis

The application was already configured for interim Web Speech results, but active-question answers were only logged and prevalidated on interim callbacks. Scoring always waited for the browser's final result. The reported 2–3 second pause is therefore consistent with browser/OS end-of-speech finalization delay, not answer-matcher or screen-transition work.

The existing matcher also required canonical, explicit accepted/alias/legacy-alt, bounded spelling/phonetic, or controlled concept-equivalent identity. It did not reduce “a complete stop” to its core concept “stop.” The production regression was therefore correctly diagnosed as an application answer-semantics miss, independent of recognition latency.

## Controlled repair

- A repeated, unchanged accepted interim is treated as stable and may score before finalization.
- A single accepted interim may score early only when the browser reports confidence of at least 0.90.
- The existing question/session action key and recognition-result-slot guard prevent double scoring and duplicate transitions when the final callback arrives.
- Exact Start, Pause, Resume, and Lock In commands may react on a confidence-at-least-0.90 interim. Destructive Exit/Quit and ambiguous navigation still wait for final speech.
- Safe descriptor omission accepts a core answer such as “stop” for “a complete stop.”
- A number-only response such as “five” for “five pieces” is accepted only when the question explicitly asks how many/what number and the canonical answer is exactly a number plus one unit token.
- Canonical display answers and the question-bank projection remain unchanged. Existing `accept`, `aliases`, `equivalents`, and legacy `alts` inputs are preserved; the architecture was not rewritten.

## Latency evidence

The `?voiceLatency=1` event timeline and `?voiceHealth=1` phone HUD now expose high-resolution monotonic timestamps and calculated deltas for recognition start, audio/sound/speech activity, every transcript update, normalization, matcher invocation/result, and UI reaction.

| Voice stage | Before | After | Improvement |
|---|---:|---:|---:|
| Recognition start → first interim | Browser/OS dependent; not captured for the reported phone utterance | Measured live by HUD | Instrumented; still browser/OS controlled |
| First interim → usable transcript | Browser/OS dependent | Measured live by HUD | Instrumented; stable accepted interim can now be used |
| Usable transcript → matcher | Synchronous | Deterministic tests: no intentional timer; same callback | No added application delay |
| Matcher → UI reaction | Synchronous | Deterministic tests: no intentional timer; same callback | Explicitly timestamped |
| Speech start → total reaction | Approximately 2–3 seconds in the reported final-only phone case | Can react at the second stable accepted interim or one ≥0.90 accepted interim | Removes finalization wait when safe; physical measurement still required |

Automated tests cannot provide genuine microphone-to-transcript timing. Web Speech recognition, acoustic detection, interim delivery, and finalization remain browser/OS services. The application-controlled path contains no waiting timer after a safe transcript is available. If the phone supplies neither usable interims nor prompt finals, the Web Speech architecture cannot meet the desired latency; the next option to evaluate is a streaming speech engine with explicit endpointing and partial-result control. No speech engine was replaced in this stage.

## Physical acceptance

This stage is not voice-accepted until tested on the target phone. Open the deployed URL with `?voiceHealth=1`, capture the displayed deltas, and test normal, quiet, slow, paused/stuttered, accented, imperfect, and noisy-room speech. Confirm “Stop” answers the flashing-red question promptly, uncertain partials do not score, a trailing final does not score twice, and manual/touch/keyboard fallbacks remain intact.
