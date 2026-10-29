import { DIFFICULTY_KEYS, PREMISE_MIN, PREMISE_MAX } from "../config/difficulty.js";
import { badRequest } from "../utils/errors.js";

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
export const CASE_ID_RE = /^[a-f0-9]{24}$/;

export function parseCreateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw badRequest("Request body must be a JSON object.");
  const { premise, difficulty } = body;
  if (typeof premise !== "string") throw badRequest("Please describe the mystery premise.");
  // eslint-disable-next-line no-control-regex
  const clean = premise.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length < PREMISE_MIN) throw badRequest("The premise must be at least " + PREMISE_MIN + " characters.");
  if (clean.length > PREMISE_MAX) throw badRequest("The premise must be at most " + PREMISE_MAX + " characters.");
  if (typeof difficulty !== "string" || !DIFFICULTY_KEYS.includes(difficulty)) throw badRequest("Please select a valid difficulty level.");
  return { premise: clean, difficulty };
}

export function parseAccuseBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw badRequest("Request body must be a JSON object.");
  const { suspectId, reasoning } = body;
  if (typeof suspectId !== "string" || !ID_RE.test(suspectId)) throw badRequest("Please select a valid suspect.");
  let r = "";
  if (reasoning !== undefined && reasoning !== null) {
    if (typeof reasoning !== "string") throw badRequest("Reasoning must be text.");
    // eslint-disable-next-line no-control-regex
    r = reasoning.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if (r.length > 1500) throw badRequest("Reasoning must be at most 1500 characters.");
  }
  return { suspectId, reasoning: r };
}

export function assertParamId(id, re, message) {
  if (typeof id !== "string" || !re.test(id)) throw badRequest(message);
  return id;
}
export const CLUE_ID_RE = ID_RE;
