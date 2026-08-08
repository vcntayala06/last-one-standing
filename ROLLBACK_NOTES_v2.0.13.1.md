# v2.0.13.1 Known-Good Rollback

Emergency recovery build.

- Restores the exact v2.0.13 application code that previously loaded successfully.
- No new layout, voice-matching, scorekeeper, or gameplay changes.
- Only cache-busts index.html so browsers/Home Screen are forced to reload the known-good files.
- Includes all question-pack JSON files.
