# Last One Standing v2.0 — Foundation

This is the new clean foundation for the project.

## Core flow

Home
→ Choose Game
→ Work Industry (Work only)
→ Optional Question Packs
→ Players
→ Game Time
→ Ready
→ Play

## Included in v2.0

- Work / Family / Friends
- Work industry selection
- Optional packs for every mode
- Shared persistent player database
- Add players
- Proper name capitalization
- 15 / 30 / 45 / 60 minute game lengths
- 10 / 15 / 20 / 30 second question timers
- Fair full-round ending
- Pause / Resume
- Mic On / Off
- One-time microphone stream
- Automatic speech-recognition restart
- Forgiving answer matching
- Correct / Wrong / Timeout statistics
- Reserved-zone question layout so player name and timer do not get cut off
- Modular JSON question files
- GitHub Pages friendly structure

## Optional packs

- Music
- Things That Make You Say Hmm
- Real or Made Up?
- Math
- I Should Have Known That
- Movies
- Sports
- Food
- Science
- History
- Random Facts

## Work industries included

- Transit
- Healthcare
- First Responders
- Restaurant / Fast Food
- Retail
- Customer Service
- Office / Corporate
- Warehouse / Logistics
- Other

## Important microphone requirement

Use the GitHub Pages HTTPS site for microphone testing.

Do not judge microphone permissions by double-clicking index.html as a file:// page.

## Question database

v2.0 contains a small foundation question set so the architecture can be tested cleanly.

The next content release will expand the question banks substantially without changing the game engine.


## v2.0.2 Usability First
- Mobile Add Some Fun screen now has an independently scrollable category list.
- Skip / Continue remain visible at the bottom.
- Selected categories display a gold state and checkmark.
- Live selected-category count added.
- Question text is centered inside its reserved question zone.
- Answer matching no longer uses broad substring matching.
- Pacific / Pacific Ocean can both be accepted when explicitly listed, while unrelated speech is rejected.
- Additional defensive UI checks reduce the chance of a missing element crashing gameplay.


## v2.0.3 Functionality First
- Add Some Fun selections now update immediately.
- Game Time screen is mobile-safe with Continue always reachable.
- Phone landscape now has a dedicated compact layout.
- Voice recognition evaluates final speech results only.
- Added simple microphone status text.
- Added original Web Audio feedback tones for countdown, correct, and wrong/timeout.
- No copyrighted sound files are included.
