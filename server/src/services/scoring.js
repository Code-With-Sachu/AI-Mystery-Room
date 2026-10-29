import { DIFFICULTY, CLUE_POINTS, HINT_PENALTY } from "../config/difficulty.js";

// Live score shown during investigation (no accusation bonus yet).
export function liveScore(clues, hints) {
  return Math.max(0, CLUE_POINTS * clues - HINT_PENALTY * hints);
}

export function finalScore({ difficulty, correct, clues, hints }) {
  const cfg = DIFFICULTY[difficulty];
  if (!cfg) throw new Error("Unknown difficulty");
  const bonus = correct ? cfg.bonus : 0;
  const cluePoints = CLUE_POINTS * clues;
  const hintPenalty = HINT_PENALTY * hints;
  return {
    bonus,
    cluePoints,
    hintPenalty,
    total: Math.max(0, bonus + cluePoints - hintPenalty),
  };
}
