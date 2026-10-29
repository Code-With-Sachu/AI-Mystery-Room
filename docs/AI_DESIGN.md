# AI design
`geminiService.js` is the only module that talks to Gemini (`@google/genai`, `ai.models.generateContent`). Model id from `GEMINI_MODEL`; key from `GEMINI_API_KEY`.

**Request.** System instruction with fair-play rules; `responseMimeType: application/json` and a `responseSchema` mirroring the case structure; premise wrapped in `<premise>` tags and declared to be data. Timeout via `AbortController` (`AI_TIMEOUT_MS`).

**Validation (`caseValidator.js`).** Exact counts for difficulty; required text fields; id format and uniqueness; unique suspect names; culprit exists; ≥2 key clues, all existing; eliminations cover every non-culprit suspect exactly once; at least one key clue and the explanation mention the culprit; hints and title don't leak the culprit; public text doesn't state the solution. Output is then reduced to known fields only.

**Retries.** Up to `AI_MAX_ATTEMPTS` (default 3) with linear backoff for malformed/inconsistent output or transient upstream errors; the previous rejection reasons are fed back into the prompt. Config and quota errors are not retried. Cases that never validate are rejected, never saved.

**Limits (honest).** These checks catch structural and obvious logical defects; they cannot prove a mystery is uniquely solvable. A second LLM "solver" pass is a sensible future addition.

**Boundaries.** Prompts, keys and solutions are never logged or returned; only error codes are logged.
