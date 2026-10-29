export const DIFFICULTY_INFO = {
  easy: { label: "Easy", suspects: 3, clues: 5, hints: 2, bonus: 100, blurb: "Direct clues and one obvious contradiction." },
  medium: { label: "Medium", suspects: 4, clues: 7, hints: 3, bonus: 150, blurb: "Compare several clues. One red herring." },
  hard: { label: "Hard", suspects: 5, clues: 9, hints: 3, bonus: 200, blurb: "Several red herrings and subtle timeline gaps." },
};
export const EXAMPLES = [
  "A priceless painting disappears during a private gallery exhibition.",
  "A researcher is found unconscious in a locked laboratory.",
  "A rare diamond vanishes during a luxury train journey.",
];
export const PREMISE_MIN = 10;
export const PREMISE_MAX = 1000;
export function validatePremise(text) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "Describe the mystery you want to investigate.";
  if (t.length < PREMISE_MIN) return `Add a little more detail (at least ${PREMISE_MIN} characters).`;
  if (t.length > PREMISE_MAX) return `Keep the premise under ${PREMISE_MAX} characters.`;
  return "";
}
