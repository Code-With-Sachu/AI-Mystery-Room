# AI Mystery Room

An AI-powered detective game. Describe a premise, pick a difficulty, and Google Gemini writes a case with suspects, sealed evidence, hints and a hidden solution. You examine evidence, request hints, then accuse a suspect. The **server** owns the answer, the clue gating and the scoring.

Live URL: `<add after deployment>`  |  Repository: `<add repository URL>`

## Features
- Premise + Easy/Medium/Hard generation (3/4/5 suspects, 5/7/9 clues, 2/3/3 hints), validated server-side before saving
- Sealed evidence: clue text is only returned after a backend "discover" call (+5 once)
- Sequential hints revealed one at a time by the server (−10 each, charged once)
- One accusation per case, scored on the server; results page explains the solution
- Progress survives refresh (case access token kept in this browser's localStorage)
- Rate limiting, Helmet, strict CORS, body limits, atomic state transitions

## Stack
React 18 + Vite + Tailwind CSS 3 + React Router + lucide-react · Node 20+ / Express · Mongoose / MongoDB Atlas · `@google/genai` · Vitest + Testing Library · `node:test` + Supertest

## Architecture
```
client/  React SPA ──fetch──▶ server/ Express REST API
                               ├─ routes → caseService (rules, scoring, public/result views)
                               ├─ caseGenerator → geminiService (only module that calls Gemini)
                               │     └─ caseValidator (structure, counts, refs, consistency)
                               └─ repository (Mongo via Mongoose | in-memory for demos/tests)
```
Layering note: `caseService` builds every response from an explicit allowlist. The `solution` field is also `select: false` in Mongoose.

## Prerequisites
Node.js 20+, a MongoDB Atlas cluster (or `USE_MEMORY_DB=true` for a throwaway local demo), a Gemini API key.

## Setup
```bash
cd server && cp .env.example .env   # fill in values
npm install
cd ../client && cp .env.example .env
npm install
```
Environment variables (server): `GEMINI_API_KEY`, `GEMINI_MODEL`, `MONGODB_URI`, `PORT`, `CLIENT_ORIGIN`, `NODE_ENV` (+ optional `AI_TIMEOUT_MS`, `AI_MAX_ATTEMPTS`, `CREATE_LIMIT_PER_HOUR`, `GENERAL_LIMIT_PER_MIN`, `USE_MEMORY_DB`). Client: `VITE_API_BASE_URL` (public, never a secret).

**Gemini model:** `GEMINI_MODEL` has no default in code. Pick a currently supported id from <https://ai.google.dev/gemini-api/docs/models>; `.env.example` shows the id that appeared in the official quickstart when this was built.

## Run locally
```bash
cd server && npm run dev        # http://localhost:4000
cd client && npm run dev        # http://localhost:5173 (proxies /api)
```
For a no-database demo: `USE_MEMORY_DB=true npm run dev` (data disappears on restart; refused when `NODE_ENV=production`).

## Test and build
```bash
cd server && npm test
cd client && npm test && npm run build
```

## Deploy (summary, details in docs/DEPLOYMENT.md)
1. MongoDB Atlas: create a cluster, a least-privilege DB user, restrict network access, copy the URI.
2. Backend on Render (`render.yaml` included, root dir `server`): set `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_ORIGIN` (your frontend URL), `NODE_ENV=production`.
3. Frontend on Vercel/Netlify (root `client`, build `npm run build`, output `dist`): set `VITE_API_BASE_URL` to the Render URL. SPA rewrites are included (`vercel.json`, `public/_redirects`).

## Security notes
- Gemini key lives only on the server. The browser never calls Gemini.
- Active-case responses never include culprit, solution, locked clue text or unused hints (covered by tests).
- Each case has a 192-bit random owner token (stored hashed) sent as `X-Case-Token`; there are no accounts, so case history (`GET /api/cases`) is intentionally not implemented.
- Premise is passed to Gemini inside delimiters and treated as data; output is schema-constrained and re-validated.

## Troubleshooting
- `AI_NOT_CONFIGURED`: set `GEMINI_API_KEY` and `GEMINI_MODEL`.
- `AI_RATE_LIMIT` / `AI_UNAVAILABLE`: quota or upstream issue; retry later.
- `DATABASE_ERROR` on `/api/health`: check `MONGODB_URI` and Atlas network access.
- CORS errors in the browser: `CLIENT_ORIGIN` must exactly match the frontend origin (comma-separate several).
- "Case file unavailable": the case was opened in another browser/profile; its token isn't here.

## Status and limitations
See docs/TESTING.md for what was actually run. Not yet verified: real Gemini generation, MongoDB Atlas persistence, cloud deployment, browser E2E (Playwright), and visual review on real devices.
