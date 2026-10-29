import crypto from "node:crypto";

// Explicitly-enabled demo/test store (USE_MEMORY_DB=true). Data is lost on restart.
// Each method is synchronous inside, so it is atomic in Node single-threaded execution,
// mirroring the conditional updates of the Mongo repository.
export function createMemoryRepository() {
  const db = new Map();
  const clone = (d) => (d ? structuredClone(d) : null);
  return {
    name: "memory",
    async create(doc) {
      const now = new Date();
      const row = { _id: crypto.randomBytes(12).toString("hex"), discoveredClueIds: [], usedHintIds: [], score: 0, status: "active", createdAt: now, updatedAt: now, ...doc };
      db.set(row._id, row);
      return clone(row);
    },
    async findById(id) {
      return clone(db.get(id));
    },
    async discoverClue(id, clueId) {
      const d = db.get(id);
      if (!d || d.status !== "active" || d.discoveredClueIds.includes(clueId)) return null;
      d.discoveredClueIds.push(clueId);
      d.updatedAt = new Date();
      return clone(d);
    },
    async useHint(id, expectedUsed, hintId) {
      const d = db.get(id);
      if (!d || d.status !== "active" || d.usedHintIds.length !== expectedUsed) return null;
      d.usedHintIds.push(hintId);
      d.updatedAt = new Date();
      return clone(d);
    },
    async complete(id, { expectedClues, expectedHints, accusation, score }) {
      const d = db.get(id);
      if (!d || d.status !== "active" || d.discoveredClueIds.length !== expectedClues || d.usedHintIds.length !== expectedHints) return null;
      Object.assign(d, { status: "completed", accusation, score, completedAt: accusation.submittedAt, updatedAt: new Date() });
      return clone(d);
    },
    async ping() {
      return true;
    },
  };
}
