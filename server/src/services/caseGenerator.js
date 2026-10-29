import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { requestMystery } from "./geminiService.js";
import { validateGeneratedCase, sanitizeGeneratedCase } from "./caseValidator.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRYABLE_UPSTREAM = new Set(["AI_INVALID_OUTPUT", "AI_TIMEOUT", "AI_UNAVAILABLE"]);

/**
 * Generates, validates and sanitises a case. Retries a limited number of times with backoff
 * when the output is malformed, fails consistency validation, or the upstream call fails transiently.
 * `request` is injectable so tests never call the real API.
 */
export async function generateValidCase({ premise, difficulty }, request = requestMystery, { attempts = env.aiMaxAttempts, backoffMs = 800 } = {}) {
  let previousErrors = [];
  let lastError = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      const raw = await request({ premise, difficulty, previousErrors });
      const { ok, errors } = validateGeneratedCase(raw, difficulty);
      if (ok) return sanitizeGeneratedCase(raw);
      previousErrors = errors;
      lastError = new AppError(502, "AI_INCONSISTENT_CASE", "The AI could not produce a consistent mystery. Please try again.");
      console.warn("[ai] attempt " + i + " rejected: " + errors.join("; "));
    } catch (err) {
      if (!(err instanceof AppError) || !RETRYABLE_UPSTREAM.has(err.code)) throw err; // config / quota: do not hammer
      lastError = err;
      console.warn("[ai] attempt " + i + " failed: " + err.code);
    }
    if (i < attempts) await sleep(backoffMs * i);
  }
  throw lastError || new AppError(502, "AI_INVALID_OUTPUT", "Mystery generation failed.");
}
