# v2.0.14 Acceptance Test

Home Screen app, landscape:

1. Game Time
   - Voice OFF / ON remain centered.
   - CONTINUE is fully visible on the screen.
   - No scrolling is required just to reach CONTINUE.

2. Next Player
   - Check first player AND later players.
   - NEXT PLAYER, name, YOU'RE UP, GET READY, countdown are all separated and centered.
   - Nothing overlaps or runs off screen.

3. Scorekeeper
   - On Results/Time's Up, inspect the actual row that says "1. Name" and shows ✓ / ✕ / ⏱.
   - That player score ribbon is centered on the page.

4. Voice forgiveness
   - Exact answers still work immediately.
   - Minor one-letter speech-to-text misses on ordinary answers can still score.
   - Leading "the / a / an" differences do not block a correct answer.
   - Clearly wrong answers must still fail.
