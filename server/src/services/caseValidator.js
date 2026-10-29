import { DIFFICULTY } from "../config/difficulty.js";

const str = (v, min = 1, max = 4000) => typeof v === "string" && v.trim().length >= min && v.length <= max;
const dupes = (arr) => new Set(arr).size !== arr.length;
const nameTokens = (name) => name.toLowerCase().split(/\s+/).filter((t) => t.length > 2 && !["mrs.", "mr.", "dr.", "ms.", "the"].includes(t));

/**
 * Validates structure, counts, references and basic logical consistency of a generated case.
 * Returns { ok, errors }. Valid JSON alone is NOT accepted as a solvable mystery.
 */
export function validateGeneratedCase(c, difficulty) {
  const errors = [];
  const cfg = DIFFICULTY[difficulty];
  if (!cfg) return { ok: false, errors: ["unknown difficulty"] };
  if (!c || typeof c !== "object") return { ok: false, errors: ["not an object"] };

  for (const k of ["title", "story", "crimeScene"]) if (!str(c[k], 3)) errors.push("missing " + k);
  if (!Array.isArray(c.suspects) || c.suspects.length !== cfg.suspects) errors.push("expected " + cfg.suspects + " suspects");
  if (!Array.isArray(c.clues) || c.clues.length !== cfg.clues) errors.push("expected " + cfg.clues + " clues");
  if (!Array.isArray(c.hints) || c.hints.length !== cfg.hints) errors.push("expected " + cfg.hints + " hints");
  const s = c.solution;
  if (!s || typeof s !== "object") errors.push("missing solution");
  if (errors.length) return { ok: false, errors };

  const check = (items, fields, label) => {
    items.forEach((it, i) => {
      if (!it || typeof it !== "object") return errors.push(label + "[" + i + "] invalid");
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(it.id || "")) errors.push(label + "[" + i + "] bad id");
      for (const f of fields) if (!str(it[f])) errors.push(label + "[" + i + "] missing " + f);
    });
    if (dupes(items.map((x) => x && x.id))) errors.push("duplicate " + label + " ids");
  };
  check(c.suspects, ["name", "role", "biography", "motive", "alibi"], "suspect");
  check(c.clues, ["title", "description", "location", "relevance"], "clue");
  check(c.hints, ["text"], "hint");
  for (const f of ["culpritId", "motive", "method", "timeline", "explanation"]) if (!str(s[f])) errors.push("solution missing " + f);
  if (errors.length) return { ok: false, errors };

  if (dupes(c.suspects.map((x) => x.name.trim().toLowerCase()))) errors.push("duplicate suspect names");
  const suspectIds = c.suspects.map((x) => x.id);
  const clueIds = c.clues.map((x) => x.id);
  const culprit = c.suspects.find((x) => x.id === s.culpritId);
  if (!culprit) return { ok: false, errors: ["culpritId does not reference a suspect"] };

  if (!Array.isArray(s.keyClueIds) || s.keyClueIds.length < 2) errors.push("need at least 2 key clues");
  else {
    if (dupes(s.keyClueIds)) errors.push("duplicate keyClueIds");
    if (s.keyClueIds.some((id) => !clueIds.includes(id))) errors.push("keyClueIds reference unknown clue");
  }
  if (!Array.isArray(s.suspectEliminations)) errors.push("missing suspectEliminations");
  else {
    const elim = s.suspectEliminations.map((e) => e && e.suspectId);
    const expected = suspectIds.filter((id) => id !== s.culpritId);
    if (elim.includes(s.culpritId)) errors.push("culprit listed as eliminated");
    if (dupes(elim) || elim.length !== expected.length || !expected.every((id) => elim.includes(id))) errors.push("eliminations must cover every non-culprit suspect exactly once");
    if (s.suspectEliminations.some((e) => !e || !str(e.reason))) errors.push("elimination missing reason");
  }
  if (errors.length) return { ok: false, errors };

  // Consistency: key clues must tie back to the culprit by name; hints must not leak the answer.
  const tokens = nameTokens(culprit.name);
  const mentionsCulprit = (t) => tokens.some((tok) => t.toLowerCase().includes(tok));
  const keyClues = c.clues.filter((x) => s.keyClueIds.includes(x.id));
  if (!keyClues.some((k) => mentionsCulprit(k.description + " " + k.relevance))) errors.push("no key clue references the culprit");
  if (!mentionsCulprit(s.explanation)) errors.push("explanation does not reference the culprit");
  if (c.hints.some((h) => mentionsCulprit(h.text) || /culprit|guilty|did it|is the (killer|thief)/i.test(h.text))) errors.push("hint leaks the culprit");
  if (mentionsCulprit(c.title) && /culprit|guilty/i.test(c.title)) errors.push("title leaks the culprit");
  const publicText = [c.story, c.crimeScene].join(" ");
  if (/\b(the culprit is|was guilty|is guilty|solution:)/i.test(publicText)) errors.push("public text leaks the solution");
  // Key clues should be spread: not every key clue may be the culprit-only accusation without any other suspect context.
  if (c.clues.some((x) => x.description.trim().toLowerCase() === x.title.trim().toLowerCase())) errors.push("clue description repeats title");

  return { ok: errors.length === 0, errors };
}

// Normalise a validated AI case to only known fields (drops any extra properties).
export function sanitizeGeneratedCase(c) {
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, typeof o[k] === "string" ? o[k].trim() : o[k]]));
  return {
    title: c.title.trim(),
    story: c.story.trim(),
    crimeScene: c.crimeScene.trim(),
    suspects: c.suspects.map((x) => pick(x, ["id", "name", "role", "biography", "motive", "alibi"])),
    clues: c.clues.map((x) => pick(x, ["id", "title", "description", "location", "relevance"])),
    hints: c.hints.map((x) => pick(x, ["id", "text"])),
    solution: {
      ...pick(c.solution, ["culpritId", "motive", "method", "timeline", "explanation"]),
      keyClueIds: [...c.solution.keyClueIds],
      suspectEliminations: c.solution.suspectEliminations.map((e) => pick(e, ["suspectId", "reason"])),
    },
  };
}
