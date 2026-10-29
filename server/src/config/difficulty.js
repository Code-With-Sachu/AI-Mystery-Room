// Server-owned game configuration. Never trust client-supplied values.
export const DIFFICULTY = Object.freeze({
  easy: Object.freeze({ suspects: 3, clues: 5, hints: 2, bonus: 100 }),
  medium: Object.freeze({ suspects: 4, clues: 7, hints: 3, bonus: 150 }),
  hard: Object.freeze({ suspects: 5, clues: 9, hints: 3, bonus: 200 }),
});
export const CLUE_POINTS = 5;
export const HINT_PENALTY = 10;
export const DIFFICULTY_KEYS = Object.keys(DIFFICULTY);
export const PREMISE_MIN = 10;
export const PREMISE_MAX = 1000;
