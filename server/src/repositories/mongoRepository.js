import mongoose from "mongoose";
import { CaseModel } from "../models/Case.js";
import { AppError } from "../utils/errors.js";

const dbDown = (err) => {
  console.error("[db] " + (err?.name || "error") + ": " + (err?.message || "").slice(0, 200));
  return new AppError(503, "DATABASE_ERROR", "The case database is unavailable. Please try again shortly.");
};
const wrap = (fn) => async (...a) => {
  try {
    return await fn(...a);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw dbDown(err);
  }
};
const SEL = "+solution +ownerTokenHash";

export function createMongoRepository() {
  return {
    name: "mongo",
    create: wrap(async (doc) => (await CaseModel.create(doc)).toObject()),
    findById: wrap((id) => CaseModel.findById(id).select(SEL).lean()),
    // Atomic: only matches while active and clue not yet discovered -> single reward.
    discoverClue: wrap((id, clueId) =>
      CaseModel.findOneAndUpdate(
        { _id: id, status: "active", discoveredClueIds: { $ne: clueId } },
        { $addToSet: { discoveredClueIds: clueId } },
        { new: true }
      ).select(SEL).lean()
    ),
    // Atomic: matches only if usedHintIds length still equals what the caller read.
    useHint: wrap((id, expectedUsed, hintId) =>
      CaseModel.findOneAndUpdate(
        { _id: id, status: "active", usedHintIds: { $size: expectedUsed } },
        { $push: { usedHintIds: hintId } },
        { new: true }
      ).select(SEL).lean()
    ),
    // Atomic: finalises exactly once, only if progress counts are unchanged since scoring.
    complete: wrap((id, { expectedClues, expectedHints, accusation, score }) =>
      CaseModel.findOneAndUpdate(
        { _id: id, status: "active", discoveredClueIds: { $size: expectedClues }, usedHintIds: { $size: expectedHints } },
        { $set: { status: "completed", accusation, score, completedAt: accusation.submittedAt } },
        { new: true }
      ).select(SEL).lean()
    ),
    async ping() {
      if (mongoose.connection.readyState !== 1) throw dbDown(new Error("not connected"));
      return true;
    },
  };
}

export async function connectMongo(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("[db] connected to MongoDB");
}
