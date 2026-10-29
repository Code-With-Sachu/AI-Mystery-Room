import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createMemoryRepository } from "../src/repositories/memoryRepository.js";
import { DIFFICULTY } from "../src/config/difficulty.js";
import { finalScore, liveScore } from "../src/services/scoring.js";
import { validateGeneratedCase } from "../src/services/caseValidator.js";
import { generateValidCase } from "../src/services/caseGenerator.js";
import { AppError } from "../src/utils/errors.js";

// ---------- fixture factory (test-only; production always uses Gemini) ----------
const NAMES = ["Victor Hale", "Marguerite Voss", "Desmond Okafor", "Lena Petrov", "Julian Cross"];
function makeCase(difficulty = "medium", culpritIndex = 1) {
  const cfg = DIFFICULTY[difficulty];
  const suspects = NAMES.slice(0, cfg.suspects).map((name, i) => ({
    id: "s" + (i + 1), name, role: "Role " + i, biography: "Bio of " + name, motive: "Motive " + i, alibi: "Alibi " + i,
  }));
  const culprit = suspects[culpritIndex];
  const clues = Array.from({ length: cfg.clues }, (_, i) => ({
    id: "c" + (i + 1), title: "Clue " + (i + 1), description: i < 2 ? `A detail that places ${culprit.name} near the scene SECRET-CLUE-${i + 1}` : "Neutral detail " + (i + 1),
    location: "Room " + i, relevance: i < 2 ? `Contradicts ${culprit.name}'s alibi` : "Background",
  }));
  return {
    title: "The Test Case", story: "A valuable object vanished.", crimeScene: "The study, door ajar.",
    suspects, clues,
    hints: Array.from({ length: cfg.hints }, (_, i) => ({ id: "h" + (i + 1), text: `Compare alibis with the timeline (hint ${i + 1}).` })),
    solution: {
      culpritId: culprit.id, motive: "Debt", method: "Used a spare key", timeline: "At nine.",
      explanation: `${culprit.name} lied about the alibi; clues 1 and 2 prove it. SECRET-SOLUTION`,
      keyClueIds: ["c1", "c2"],
      suspectEliminations: suspects.filter((s) => s.id !== culprit.id).map((s) => ({ suspectId: s.id, reason: "Verified alibi for " + s.name })),
    },
  };
}

function setup(generator) {
  const repo = createMemoryRepository();
  const generate = generator || (async ({ difficulty }) => makeCase(difficulty));
  const app = createApp({ repo, generate: async (a) => (await import("../src/services/caseValidator.js")).sanitizeGeneratedCase(await generate(a)), limits: { general: 10000, create: 10000 } });
  return { app, repo };
}
async function createCase(app, difficulty = "medium") {
  const res = await request(app).post("/api/cases").send({ premise: "A painting disappears at a gala.", difficulty });
  assert.equal(res.status, 201);
  return { id: res.body.data.case.id, token: res.body.data.accessToken, body: res.body };
}
const auth = (r, token) => r.set("X-Case-Token", token);

// ---------- scoring ----------
test("scoring: spec examples", () => {
  assert.equal(finalScore({ difficulty: "easy", correct: true, clues: 4, hints: 1 }).total, 110);
  assert.equal(finalScore({ difficulty: "medium", correct: true, clues: 6, hints: 2 }).total, 160);
  assert.equal(finalScore({ difficulty: "hard", correct: false, clues: 5, hints: 3 }).total, 0);
  assert.equal(finalScore({ difficulty: "hard", correct: false, clues: 0, hints: 3 }).total, 0);
  assert.equal(liveScore(1, 3), 0);
});
test("difficulty config matches spec", () => {
  assert.deepEqual(DIFFICULTY.easy, { suspects: 3, clues: 5, hints: 2, bonus: 100 });
  assert.deepEqual(DIFFICULTY.medium, { suspects: 4, clues: 7, hints: 3, bonus: 150 });
  assert.deepEqual(DIFFICULTY.hard, { suspects: 5, clues: 9, hints: 3, bonus: 200 });
});

// ---------- AI output validation ----------
test("validator accepts a consistent case for every difficulty", () => {
  for (const d of ["easy", "medium", "hard"]) assert.equal(validateGeneratedCase(makeCase(d), d).ok, true, d);
});
test("validator rejects wrong counts", () => {
  const c = makeCase("easy");
  c.clues.pop();
  assert.equal(validateGeneratedCase(c, "easy").ok, false);
  assert.equal(validateGeneratedCase(makeCase("easy"), "hard").ok, false);
});
test("validator rejects invalid culprit reference", () => {
  const c = makeCase("medium");
  c.solution.culpritId = "nope";
  assert.equal(validateGeneratedCase(c, "medium").ok, false);
});
test("validator rejects invalid key clue reference and duplicate ids", () => {
  const c = makeCase("medium");
  c.solution.keyClueIds = ["c1", "zzz"];
  assert.equal(validateGeneratedCase(c, "medium").ok, false);
  const d = makeCase("medium");
  d.clues[1].id = "c1";
  assert.equal(validateGeneratedCase(d, "medium").ok, false);
});
test("validator rejects unsupported solutions and leaking hints", () => {
  const c = makeCase("medium");
  c.clues.forEach((x) => { x.description = "Generic"; x.relevance = "Generic"; });
  assert.equal(validateGeneratedCase(c, "medium").ok, false);
  const leaky = makeCase("medium");
  leaky.hints[0].text = "Look closely at Marguerite Voss.";
  assert.equal(validateGeneratedCase(leaky, "medium").ok, false);
  const missingElim = makeCase("medium");
  missingElim.solution.suspectEliminations.pop();
  assert.equal(validateGeneratedCase(missingElim, "medium").ok, false);
});
test("generator retries invalid output and then succeeds; gives up safely", async () => {
  let calls = 0;
  const flaky = async () => (++calls < 2 ? { bad: true } : makeCase("easy"));
  const out = await generateValidCase({ premise: "x", difficulty: "easy" }, flaky, { attempts: 3, backoffMs: 1 });
  assert.equal(calls, 2);
  assert.equal(out.suspects.length, 3);
  await assert.rejects(generateValidCase({ premise: "x", difficulty: "easy" }, async () => ({ bad: 1 }), { attempts: 2, backoffMs: 1 }), (e) => e.code === "AI_INCONSISTENT_CASE");
  await assert.rejects(generateValidCase({ premise: "x", difficulty: "easy" }, async () => { throw new AppError(503, "AI_RATE_LIMIT", "q"); }, { attempts: 3, backoffMs: 1 }), (e) => e.code === "AI_RATE_LIMIT");
});

// ---------- creation + input validation ----------
test("create: validates premise and difficulty", async () => {
  const { app } = setup();
  for (const body of [{}, { premise: "", difficulty: "easy" }, { premise: "short", difficulty: "easy" }, { premise: "x".repeat(1001), difficulty: "easy" }, { premise: 42, difficulty: "easy" }, { premise: "A valid long premise here", difficulty: "insane" }, { premise: "A valid long premise here" }]) {
    const res = await request(app).post("/api/cases").send(body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 60));
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  }
  const bad = await request(app).post("/api/cases").set("Content-Type", "application/json").send("{oops");
  assert.equal(bad.status, 400);
});
test("create: each difficulty yields exact counts and safe public data", async () => {
  const { app } = setup();
  for (const d of ["easy", "medium", "hard"]) {
    const { body } = await createCase(app, d);
    const c = body.data.case;
    assert.equal(c.suspects.length, DIFFICULTY[d].suspects);
    assert.equal(c.clueCount, DIFFICULTY[d].clues);
    assert.equal(c.hintsRemaining, DIFFICULTY[d].hints);
    assert.equal(c.score, 0);
    assert.equal(c.status, "active");
  }
});

// ---------- secrecy ----------
test("active case never exposes solution, culprit, locked clues or unused hints", async () => {
  const { app } = setup();
  const { id, token, body } = await createCase(app, "medium");
  const check = (obj) => {
    const s = JSON.stringify(obj);
    for (const needle of ["SECRET-SOLUTION", "SECRET-CLUE", "culpritId", "keyClueIds", "suspectEliminations", "Compare alibis", "ownerTokenHash", "Used a spare key", "solution"]) assert.ok(!s.includes(needle), "leaked " + needle);
  };
  check(body);
  const get = await auth(request(app).get("/api/cases/" + id), token);
  assert.equal(get.status, 200);
  check(get.body);
  assert.ok(get.body.data.case.clues.every((c) => c.discovered === false && Object.keys(c).sort().join() === "discovered,id,slot"));
  const early = await auth(request(app).get(`/api/cases/${id}/result`), token);
  assert.equal(early.status, 409);
  assert.equal(early.body.error.code, "CASE_ACTIVE");
  check(early.body);
});

// ---------- ownership ----------
test("case access requires the owner token", async () => {
  const { app } = setup();
  const { id } = await createCase(app);
  assert.equal((await request(app).get("/api/cases/" + id)).status, 401);
  assert.equal((await auth(request(app).get("/api/cases/" + id), "wrong-token")).status, 403);
  assert.equal((await auth(request(app).get("/api/cases/" + "a".repeat(24)), "x")).status, 404);
  assert.equal((await auth(request(app).get("/api/cases/not-an-id"), "x")).status, 400);
});

// ---------- clues ----------
test("clue discovery reveals content once and awards 5 points once", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app);
  const r1 = await auth(request(app).post(`/api/cases/${id}/clues/c1/discover`), token);
  assert.equal(r1.status, 200);
  assert.match(r1.body.data.clue.description, /SECRET-CLUE-1/);
  assert.equal(r1.body.data.case.score, 5);
  const r2 = await auth(request(app).post(`/api/cases/${id}/clues/c1/discover`), token);
  assert.equal(r2.status, 409);
  assert.equal(r2.body.error.code, "CLUE_ALREADY_DISCOVERED");
  const get = await auth(request(app).get("/api/cases/" + id), token);
  assert.equal(get.body.data.case.score, 5);
  assert.equal(get.body.data.case.discoveredClueIds.length, 1);
  assert.equal((await auth(request(app).post(`/api/cases/${id}/clues/zzz/discover`), token)).status, 404);
  assert.equal((await auth(request(app).post(`/api/cases/${id}/clues/bad%20id/discover`), token)).status, 400);
});
test("concurrent discovery of the same clue awards only once", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app);
  const rs = await Promise.all(Array.from({ length: 5 }, () => auth(request(app).post(`/api/cases/${id}/clues/c3/discover`), token)));
  assert.equal(rs.filter((r) => r.status === 200).length, 1);
  assert.equal((await auth(request(app).get("/api/cases/" + id), token)).body.data.case.score, 5);
});

// ---------- hints ----------
test("hints are sequential, limited and charged once", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app, "easy");
  for (let i = 1; i <= 5; i++) await auth(request(app).post(`/api/cases/${id}/clues/c${i}/discover`), token);
  const h1 = await auth(request(app).post(`/api/cases/${id}/hints`), token);
  assert.equal(h1.body.data.hint.id, "h1");
  assert.equal(h1.body.data.case.hintsRemaining, 1);
  assert.equal(h1.body.data.case.score, 25 - 10);
  const h2 = await auth(request(app).post(`/api/cases/${id}/hints`), token);
  assert.equal(h2.body.data.hint.id, "h2");
  const h3 = await auth(request(app).post(`/api/cases/${id}/hints`), token);
  assert.equal(h3.status, 409);
  assert.equal(h3.body.error.code, "HINT_LIMIT_REACHED");
  const get = await auth(request(app).get("/api/cases/" + id), token);
  assert.equal(get.body.data.case.hints.length, 2);
  assert.equal(get.body.data.case.score, 25 - 20);
});
test("concurrent hint requests never double-charge the same hint", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app, "medium");
  const rs = await Promise.all(Array.from({ length: 6 }, () => auth(request(app).post(`/api/cases/${id}/hints`), token)));
  const okRes = rs.filter((r) => r.status === 200);
  const ids = okRes.map((r) => r.body.data.hint.id);
  assert.equal(new Set(ids).size, ids.length, "a hint was served twice");
  assert.ok(okRes.length <= DIFFICULTY.medium.hints);
  const state = (await auth(request(app).get("/api/cases/" + id), token)).body.data.case;
  assert.equal(state.hintsUsed, okRes.length); // charged exactly once per accepted request
  assert.equal(state.score, 0);
});

// ---------- accusation ----------
test("correct accusation: bonus applied, solution revealed, case locked", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app, "easy"); // culprit = s2 (Marguerite Voss)
  for (const c of ["c1", "c2", "c3", "c4"]) await auth(request(app).post(`/api/cases/${id}/clues/${c}/discover`), token);
  await auth(request(app).post(`/api/cases/${id}/hints`), token);
  const res = await auth(request(app).post(`/api/cases/${id}/accuse`), token).send({ suspectId: "s2", reasoning: "Alibi broke." });
  assert.equal(res.status, 200);
  const r = res.body.data.result;
  assert.equal(r.correct, true);
  assert.equal(r.score.total, 100 + 20 - 10);
  assert.equal(r.culprit.name, "Marguerite Voss");
  assert.match(r.solution.explanation, /SECRET-SOLUTION/);
  assert.equal(r.keyClues.length, 2);
  const again = await auth(request(app).post(`/api/cases/${id}/accuse`), token).send({ suspectId: "s1" });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, "CASE_COMPLETED");
  assert.equal((await auth(request(app).post(`/api/cases/${id}/clues/c5/discover`), token)).status, 409);
  assert.equal((await auth(request(app).post(`/api/cases/${id}/hints`), token)).status, 409);
  const result = await auth(request(app).get(`/api/cases/${id}/result`), token);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.result.score.total, 110);
  const pub = await auth(request(app).get("/api/cases/" + id), token);
  assert.equal(pub.body.data.case.status, "completed");
  assert.equal(pub.body.data.case.score, 110);
});
test("incorrect accusation: no bonus, floor at zero, solution still explained", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app, "hard");
  for (let i = 0; i < 3; i++) await auth(request(app).post(`/api/cases/${id}/hints`), token);
  const res = await auth(request(app).post(`/api/cases/${id}/accuse`), token).send({ suspectId: "s1" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.result.correct, false);
  assert.equal(res.body.data.result.score.total, 0);
  assert.equal(res.body.data.result.culprit.id, "s2");
});
test("accusation validates suspect and ignores client-sent score/culprit", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app, "medium");
  assert.equal((await auth(request(app).post(`/api/cases/${id}/accuse`), token).send({ suspectId: "s99" })).body.error.code, "INVALID_SUSPECT");
  assert.equal((await auth(request(app).post(`/api/cases/${id}/accuse`), token).send({})).status, 400);
  const res = await auth(request(app).post(`/api/cases/${id}/accuse`), token).send({ suspectId: "s1", score: 9999, culpritId: "s1", correct: true });
  assert.equal(res.body.data.result.correct, false);
  assert.equal(res.body.data.result.score.total, 0);
});
test("concurrent accusations finalise exactly once", async () => {
  const { app } = setup();
  const { id, token } = await createCase(app, "easy");
  const rs = await Promise.all(["s1", "s2", "s3", "s2"].map((s) => auth(request(app).post(`/api/cases/${id}/accuse`), token).send({ suspectId: s })));
  assert.equal(rs.filter((r) => r.status === 200).length, 1);
});

// ---------- safe failures ----------
test("AI and DB failures return safe errors", async () => {
  const ai = setup(async () => { throw new AppError(503, "AI_UNAVAILABLE", "The AI service is currently unavailable. Please try again."); });
  const r = await request(ai.app).post("/api/cases").send({ premise: "A long enough premise.", difficulty: "easy" });
  assert.equal(r.status, 503);
  assert.equal(r.body.error.code, "AI_UNAVAILABLE");
  const boom = setup(async () => { throw new Error("secret stack GEMINI_API_KEY=abc"); });
  const r2 = await request(boom.app).post("/api/cases").send({ premise: "A long enough premise.", difficulty: "easy" });
  assert.equal(r2.status, 500);
  assert.ok(!JSON.stringify(r2.body).includes("GEMINI_API_KEY"));
  const repo = createMemoryRepository();
  repo.ping = async () => { throw new Error("down"); };
  const health = await request(createApp({ repo })).get("/api/health");
  assert.equal(health.status, 503);
});
test("health check and rate limit", async () => {
  const { app } = setup();
  assert.equal((await request(app).get("/api/health")).body.data.status, "ok");
  const limited = createApp({ repo: createMemoryRepository(), generate: async () => makeCase("easy"), limits: { general: 1000, create: 2 } });
  const codes = [];
  for (let i = 0; i < 3; i++) codes.push((await request(limited).post("/api/cases").send({ premise: "bad", difficulty: "easy" })).status);
  assert.deepEqual(codes, [400, 400, 429]);
});
