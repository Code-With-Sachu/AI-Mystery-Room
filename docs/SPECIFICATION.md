# Specification
**Overview.** AI Mystery Room generates personalised detective cases with Gemini and lets one player solve them.
**Problem.** Fixed-story mystery games have little replay value. Here the premise and difficulty are the player's.
**Audience.** Students practising deduction, casual gamers, crime-fiction fans, developers evaluating full-stack GenAI.

## Functional requirements
FR1 create case (premise 10–1000 chars, easy|medium|hard) · FR2 exact counts per difficulty · FR3 sealed clues revealed by server action (+5, once) · FR4 sequential hints (−10, once, per-difficulty limit) · FR5 single accusation, server-compared to hidden culprit · FR6 result only after completion · FR7 refresh persistence · FR8 case closed to further actions after accusation.

## Scoring
`final = max(0, (correct ? bonus : 0) + 5·clues − 10·hints)`; bonus 100/150/200. Live score during play = `max(0, 5·clues − 10·hints)`.

## Non-functional
Responsive, keyboard accessible, reduced-motion aware, safe errors (no stack traces), rate limited, secrets server-side.

## Pages
`/` home · `/create` premise+difficulty · `/case/:id` overview/scene/suspects/evidence/hints · `/case/:id/accuse` · `/case/:id/results`.

## Constraints and limitations
Single-player, no accounts; case history not implemented; logical solvability is checked heuristically (see AI_DESIGN.md), not proven.

## Acceptance criteria
Mapped to automated tests in TESTING.md; items requiring real Gemini/Atlas/deployment are listed there as unverified.
