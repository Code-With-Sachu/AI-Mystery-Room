# API
Base: `/api`. JSON in/out. Success `{ success: true, data, message }`; error `{ success: false, error: { code, message } }`.
All `/api/cases/:id...` routes require header `X-Case-Token` (returned once by create). Missing → 401, wrong → 403, malformed id → 400, unknown → 404.

| Method & path | Purpose | Success | Errors |
|---|---|---|---|
| GET `/health` | liveness + DB ping | 200 | 503 DATABASE_ERROR |
| POST `/cases` | body `{premise, difficulty}`; generate + save | 201 `{case, accessToken}` | 400 VALIDATION_ERROR, 429 RATE_LIMITED, 502 AI_INCONSISTENT_CASE / AI_INVALID_OUTPUT, 503 AI_NOT_CONFIGURED / AI_RATE_LIMIT / AI_UNAVAILABLE / DATABASE_ERROR, 504 AI_TIMEOUT |
| GET `/cases/:id` | public case state | 200 `{case}` | 401/403/404 |
| POST `/cases/:id/clues/:clueId/discover` | reveal clue, +5 once | 200 `{clue, case}` | 404 unknown clue, 409 CLUE_ALREADY_DISCOVERED / CASE_COMPLETED |
| POST `/cases/:id/hints` | next hint, −10 once | 200 `{hint, case}` | 409 HINT_LIMIT_REACHED / HINT_CONFLICT / CASE_COMPLETED |
| POST `/cases/:id/accuse` | body `{suspectId, reasoning?}`; finalise once | 200 `{result}` | 400 INVALID_SUSPECT / VALIDATION_ERROR, 409 CASE_COMPLETED / CASE_CHANGED |
| GET `/cases/:id/result` | completed result | 200 `{result}` | 409 CASE_ACTIVE |

`case` (active) fields: id, referenceNumber, title, difficulty, story, crimeScene, suspects[id,name,role,biography,motive,alibi], clueCount, clues[{id,slot,discovered, +content only if discovered}], discoveredClueIds, hintsTotal/Used/Remaining, hints[used only], score, status.

`result` fields: correct, accusation, culprit, solution{motive,method,timeline,explanation}, keyClues, eliminations, score{total,bonus,cluePoints,hintPenalty}, counts.

**Disclosure rules.** Before completion no response contains culprit id, solution, keyClueIds, eliminations, undiscovered clue text or unused hint text. Client-sent scores/culprit/correct fields are ignored.
