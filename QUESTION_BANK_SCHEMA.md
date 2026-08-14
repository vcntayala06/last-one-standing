# Last One Standing question-bank schema — version 1

Migrated seed content is stored in `question-bank-data.js`; population batches are stored in `question-bank-batch-1.js` and `question-bank-batch-2.js`. Validation, indexing, difficulty mapping, and selection live in `question-bank.js`. These are static browser scripts and work without a network connection.

Each expanded question record contains:

- `schemaVersion`: schema version, currently `1`.
- `revision`: positive per-question revision number.
- `id`: stable slug ID. Wording edits should normally retain the ID.
- `prompt`: player-facing question.
- `subject`: value from the bank's versioned subject catalog.
- `difficulty`: `kids-easy`, `kids-medium`, `kids-hard`, `easy`, `medium`, `hard`, or `savage`.
- `answer.conceptId`: stable conceptual-answer identifier.
- `answer.canonical`: displayed canonical answer.
- `answer.accepted`: vetted language-keyed answer arrays, initially `en` and `es`.
- `editions`: explicit eligibility for `original`, `work`, `solo`, or future `family` use.
- `workTrack`: `dedicated`, `broad`, or `null`, used for the Work 70/30 mix.
- `workSafe`, `kidsSafe`: background safety flags.
- `gradeRange`: optional `{min,max}` grade suitability, or `null`.
- `classification`: `educational`, `entertainment`, or `mixed`.
- `educationalSubject`: optional curriculum/content classification.
- `review.status`: `draft`, `reviewed`, `verified`, `approved`, `rejected`, or `disabled`.
- `fact`: verification records, verification date, wording/ambiguity review, and date-sensitivity information.
- `quality`: Stage 6.7A human gameplay disposition, reviewer/date, issue flags, rubric results, and editorial notes. Its status is `passed`, `rewritten`, `recalibrated`, or `disabled`.

## Mandatory approval gate

Every new production question must be independently fact-checked twice before it can use `review.status: "approved"`. The validator enforces all of the following for approved records:

- at least two distinct HTTPS source records;
- source title, publisher, URL, and `verifiedAt` date;
- an explicit answer check and fair-wording check from each source;
- question-level `verifiedAt`, `wordingFair`, and `ambiguityChecked` fields;
- a boolean `dateSensitive` marker;
- `currentAsOf` when `dateSensitive` is true.

The two references should be independent rather than syndicated copies. Prefer authoritative primary sources where practical. AI-generated text is never a verification source. If references disagree, the record stays unapproved until the discrepancy is resolved. This gate applies to every future population batch unless the project requirement is explicitly changed.

The 34 migrated seed records are marked `reviewed`, not `verified` or `approved`, because Stage 6.6 did not perform external fact verification. Reviewed records remain selectable during the seed-bank transition. Every selectable Stage 6.7 Batch 1 record is `approved` with two verification records; records that failed the later quality audit are `disabled`. Draft, rejected, and disabled records are excluded.

Stage 6.7A adds a separate human-quality gate. A technically valid fact is not sufficient: a selectable production question must also be fair, realistically calibrated, worthwhile, and suitable for fast game play. Internal flags include `ambiguous`, `too-easy`, `too-hard`, `obscure`, `repetitive`, `awkward-wording`, `weak-reveal`, `textbook-like`, `culturally-narrow`, `answer-overly-broad`, and `alternate-answer-needed`. A rewritten factual claim must be double-verified again; a question that cannot clear the quality gate is marked `disabled` and excluded by the selector.

Stage 6.8 makes that quality review a pre-approval requirement. Records declaring `review.approvalStandard: "stage-6.8"` cannot validate as approved unless `quality.status` is `passed` or `rewritten` and the rubric explicitly confirms factual quality, fairness, difficulty, value, game wording, template variety, answer specificity, and timer suitability. Rejected candidates remain in the batch for auditability but never enter selection.

Stage 6.9 extends the pre-approval gate with explicit cultural-fairness and memorability checks. Batch 3 entertainment records may include `culture` metadata for lane, representation, and preferred-cultural-lane reporting. This metadata affects editorial reporting only; it does not change gameplay selection or answer matching.

Future Host tuning should share the bank's culturally intentional environment through timing, humor, confidence, playful competition, and natural SoCal Chicano/urban influence. It must remain mature, workplace-safe where required, and never become forced, cartoonish, or stereotyped. Stage 6.9 documents this requirement only and does not modify Host behavior.

The visible difficulty mapping is:

- Kids → Kids Easy, Kids Medium, Kids Hard
- Easy → Kids Hard, Easy
- Medium → Easy, Medium, Hard
- Hard → Medium, Hard, Savage
- Savage → Hard, Savage

If a tiny seed pool has no question in the requested group, selection expands only to the nearest internal difficulty represented in the same edition. It never crosses edition eligibility.

The canonical future answer field is `answer.accepted`. The gameplay compatibility projection still exposes these values as legacy `alts`, which the protected `accepted()` function intentionally does not consume. Reconciliation requires a separately approved answer-semantics change.
