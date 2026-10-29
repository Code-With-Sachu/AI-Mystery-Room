import crypto from "node:crypto";
import { DIFFICULTY } from "../config/difficulty.js";
import { AppError, notFound, conflict, badRequest } from "../utils/errors.js";
import { finalScore, liveScore } from "./scoring.js";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest();

// ---- Public (active-case) view: explicit allowlist, never spreads the stored document. ----
export function toPublicCase(doc) {
  const cfg = DIFFICULTY[doc.difficulty];
  const found = new Set(doc.discoveredClueIds);
  const used = doc.usedHintIds.length;
  return {
    id: doc._id,
    referenceNumber: doc.referenceNumber,
    title: doc.title,
    difficulty: doc.difficulty,
    story: doc.story,
    crimeScene: doc.crimeScene,
    suspects: doc.suspects.map((s) => ({ id: s.id, name: s.name, role: s.role, biography: s.biography, motive: s.motive, alibi: s.alibi })),
    clueCount: doc.clues.length,
    clues: doc.clues.map((c, i) =>
      found.has(c.id)
        ? { id: c.id, slot: i + 1, discovered: true, title: c.title, description: c.description, location: c.location, relevance: c.relevance }
        : { id: c.id, slot: i + 1, discovered: false }
    ),
    discoveredClueIds: [...doc.discoveredClueIds],
    hintsTotal: cfg.hints,
    hintsUsed: used,
    hintsRemaining: cfg.hints - used,
    hints: doc.usedHintIds.map((hid, i) => ({ id: hid, order: i + 1, text: doc.hints.find((h) => h.id === hid)?.text ?? "" })),
    score: doc.status === "completed" ? doc.score : liveScore(doc.discoveredClueIds.length, used),
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function toResult(doc) {
  const s = doc.solution;
  const name = (id) => doc.suspects.find((x) => x.id === id);
  const culprit = name(s.culpritId);
  const acc = doc.accusation;
  const accused = name(acc.suspectId);
  return {
    id: doc._id,
    referenceNumber: doc.referenceNumber,
    title: doc.title,
    difficulty: doc.difficulty,
    correct: acc.correct,
    accusation: { suspectId: acc.suspectId, suspectName: accused?.name, reasoning: acc.reasoning || "", correct: acc.correct },
    culprit: { id: culprit.id, name: culprit.name, role: culprit.role },
    solution: { motive: s.motive, method: s.method, timeline: s.timeline, explanation: s.explanation },
    keyClues: doc.clues.filter((c) => s.keyClueIds.includes(c.id)).map((c) => ({ id: c.id, title: c.title, description: c.description, location: c.location, relevance: c.relevance, discovered: doc.discoveredClueIds.includes(c.id) })),
    eliminations: s.suspectEliminations.map((e) => ({ suspectId: e.suspectId, name: name(e.suspectId)?.name, reason: e.reason })),
    score: { total: doc.score, ...acc.breakdown },
    cluesDiscovered: doc.discoveredClueIds.length,
    cluesTotal: doc.clues.length,
    hintsUsed: doc.usedHintIds.length,
    hintsTotal: DIFFICULTY[doc.difficulty].hints,
    completedAt: doc.completedAt,
  };
}

export function createCaseService(repo, generate) {
  async function loadOwned(id, token) {
    if (!token || typeof token !== "string") throw new AppError(401, "UNAUTHORIZED", "This case belongs to another browser session. Start a new case.");
    const doc = await repo.findById(id);
    if (!doc) throw notFound();
    const a = sha256(token);
    const b = Buffer.from(doc.ownerTokenHash, "hex");
    if (b.length !== a.length || !crypto.timingSafeEqual(a, b)) throw new AppError(403, "FORBIDDEN", "You do not have access to this case.");
    return doc;
  }

  return {
    async create({ premise, difficulty }) {
      const generated = await generate({ premise, difficulty });
      const accessToken = crypto.randomBytes(24).toString("base64url");
      const doc = await repo.create({
        referenceNumber: "MR-" + crypto.randomBytes(3).toString("hex").toUpperCase(),
        ownerTokenHash: sha256(accessToken).toString("hex"),
        premise,
        difficulty,
        ...generated,
      });
      return { case: toPublicCase(doc), accessToken };
    },

    async get(id, token) {
      return toPublicCase(await loadOwned(id, token));
    },

    async discoverClue(id, clueId, token) {
      const doc = await loadOwned(id, token);
      if (doc.status !== "active") throw conflict("This case is already closed.", "CASE_COMPLETED");
      const clue = doc.clues.find((c) => c.id === clueId);
      if (!clue) throw notFound("That clue does not belong to this case.");
      if (doc.discoveredClueIds.includes(clueId)) throw conflict("You already examined this evidence.", "CLUE_ALREADY_DISCOVERED");
      const updated = await repo.discoverClue(id, clueId);
      if (!updated) throw conflict("This evidence was already examined.", "CLUE_ALREADY_DISCOVERED");
      return { clue: { id: clue.id, title: clue.title, description: clue.description, location: clue.location, relevance: clue.relevance }, case: toPublicCase(updated) };
    },

    async requestHint(id, token) {
      const doc = await loadOwned(id, token);
      if (doc.status !== "active") throw conflict("This case is already closed.", "CASE_COMPLETED");
      const used = doc.usedHintIds.length;
      if (used >= DIFFICULTY[doc.difficulty].hints) throw conflict("You have no hints remaining.", "HINT_LIMIT_REACHED");
      const hint = doc.hints[used]; // sequential, chosen server-side
      const updated = await repo.useHint(id, used, hint.id);
      if (!updated) throw conflict("Another hint request is already being processed.", "HINT_CONFLICT");
      return { hint: { id: hint.id, order: used + 1, text: hint.text }, case: toPublicCase(updated) };
    },

    async accuse(id, { suspectId, reasoning }, token) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const doc = await loadOwned(id, token);
        if (doc.status !== "active") throw conflict("This case is already closed.", "CASE_COMPLETED");
        if (!doc.suspects.some((s) => s.id === suspectId)) throw badRequest("That suspect is not part of this case.", "INVALID_SUSPECT");
        const correct = suspectId === doc.solution.culpritId;
        const clues = doc.discoveredClueIds.length;
        const hints = doc.usedHintIds.length;
        const breakdown = finalScore({ difficulty: doc.difficulty, correct, clues, hints });
        const accusation = { suspectId, reasoning, correct, submittedAt: new Date(), breakdown: { bonus: breakdown.bonus, cluePoints: breakdown.cluePoints, hintPenalty: breakdown.hintPenalty } };
        const done = await repo.complete(id, { expectedClues: clues, expectedHints: hints, accusation, score: breakdown.total });
        if (done) return toResult(done);
      }
      throw conflict("The case changed while submitting. Please try again.", "CASE_CHANGED");
    },

    async result(id, token) {
      const doc = await loadOwned(id, token);
      if (doc.status !== "completed") throw conflict("The case is still open. Submit an accusation to see the result.", "CASE_ACTIVE");
      return toResult(doc);
    },
  };
}
