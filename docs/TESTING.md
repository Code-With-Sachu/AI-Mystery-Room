# Testing
Commands: `cd server && npm test` · `cd client && npm test` · `cd client && npm run build`.

## Backend (node:test + Supertest, Gemini mocked, in-memory repository)
Scoring formula and spec examples; difficulty config; validator (wrong counts, bad culprit/key-clue refs, duplicate ids, unsupported solution, leaking hints, missing eliminations); generator retry/backoff and give-up behaviour; premise/difficulty/malformed-JSON validation; exact counts per difficulty; **secrecy** (no solution, culprit, locked clue text, unused hints, token hash in create/get/early-result responses); ownership (401/403/404/400); clue discovery once + concurrent duplicates; sequential hints, limit, concurrent requests never double-charge; correct/incorrect accusations, zero floor, locked case afterwards, client-sent score ignored, concurrent accusations finalise once; safe AI/DB/unknown errors; health check; rate limit.

## Frontend (Vitest + Testing Library, API mocked)
Premise validation and counter; example + difficulty selection and submitted values; generation failure with retry; locked vs discovered evidence; case page discovery and hint flow; missing-token state; accusation requires selection, confirmation dialog, submit payload; Escape cancels dialog; results rendering and links; redirect when case still active.

## Actual results (this build)
- Server: # tests 22 # pass 22 # fail 0 
- Client: Test Files  1 passed (1) Tests  10 passed (10) 
- Production build: ✓ built in 4.14s 
- Smoke run of the real server process (memory store, no Gemini key): /api/health 200; create returns AI_NOT_CONFIGURED; validation and 404 JSON errors; CORS header only for the configured origin.

## Not executed (do not treat as passing)
Real Gemini generation; MongoDB Atlas reads/writes (Mongo repository and schema were written but not run against a live database; the same service logic was tested through the in-memory repository); Playwright browser E2E; deployed-site verification; screenshot/mobile review.
