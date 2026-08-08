# v2.0.14 Core Fix Pass

This build focuses on the repeated blockers:

- Game Time landscape is compressed like Ready to Play so CONTINUE is part of the visible layout.
- Existing centered Voice Recognition OFF / ON controls are preserved.
- All Next Player screens use one simplified full-screen landscape layout.
- The actual player scorekeeper ribbons ("1. Name" with Correct / Wrong / Timed Out) are directly centered.
- Voice answer matching is slightly more forgiving:
  - ignores leading "the / a / an"
  - keeps singular/plural forgiveness
  - allows a very small speech-to-text spelling error
  - short unrelated answers still do not pass
