import mongoose from "mongoose";
import crypto from "node:crypto";

const { Schema } = mongoose;
const idField = { type: String, required: true, match: /^[A-Za-z0-9_-]{1,40}$/ };
const text = (max = 4000) => ({ type: String, required: true, trim: true, maxlength: max });

const SuspectSchema = new Schema({ id: idField, name: text(120), role: text(160), biography: text(), motive: text(), alibi: text() }, { _id: false });
const ClueSchema = new Schema({ id: idField, title: text(200), description: text(), location: text(300), relevance: text() }, { _id: false });
const HintSchema = new Schema({ id: idField, text: text() }, { _id: false });

const SolutionSchema = new Schema(
  {
    culpritId: idField,
    motive: text(),
    method: text(),
    timeline: text(),
    explanation: text(8000),
    keyClueIds: [String],
    suspectEliminations: [new Schema({ suspectId: idField, reason: text() }, { _id: false })],
  },
  { _id: false }
);

const CaseSchema = new Schema(
  {
    _id: { type: String, default: () => crypto.randomBytes(12).toString("hex") },
    referenceNumber: { type: String, required: true },
    ownerTokenHash: { type: String, required: true, select: false },
    title: text(200),
    premise: text(1000),
    story: text(8000),
    crimeScene: text(8000),
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    suspects: { type: [SuspectSchema], validate: (v) => v.length > 0 },
    clues: { type: [ClueSchema], validate: (v) => v.length > 0 },
    hints: { type: [HintSchema], validate: (v) => v.length > 0 },
    // Server-only: never selected by default, never serialised to clients.
    solution: { type: SolutionSchema, required: true, select: false },
    discoveredClueIds: { type: [String], default: [] },
    usedHintIds: { type: [String], default: [] },
    accusation: {
      suspectId: String,
      reasoning: { type: String, maxlength: 1500 },
      correct: Boolean,
      submittedAt: Date,
      breakdown: { bonus: Number, cluePoints: Number, hintPenalty: Number },
    },
    score: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    completedAt: Date,
  },
  { timestamps: true, minimize: false }
);

CaseSchema.index({ status: 1, createdAt: -1 });
CaseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // purge cases after 90 days

export const CaseModel = mongoose.models.Case || mongoose.model("Case", CaseSchema);
