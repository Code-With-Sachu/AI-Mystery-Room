# Deployment
1. **Atlas:** create cluster → Database Access: user with readWrite on `ai-mystery-room` only → Network Access: allow Render's outbound IPs (or 0.0.0.0/0 with a strong password if IPs are unknown) → copy the SRV URI.
2. **Render (API):** new Web Service from the repo, root `server`, build `npm install`, start `npm start`, health check `/api/health` (or use `render.yaml`). Env: `NODE_ENV=production`, `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_ORIGIN=https://<frontend>`. Render supplies `PORT`.
3. **Vercel/Netlify (client):** root `client`, build `npm run build`, output `dist`, env `VITE_API_BASE_URL=https://<api>`. SPA rewrite files are included.
4. **Verify in production:** health → create a case on each difficulty → discover clue → hint → accuse → result → refresh → confirm `GET /api/cases/:id` JSON contains no solution; check browser console and Render logs.
Free-tier Render sleeps when idle; the first request can be slow, and case generation can take up to ~40 s.
