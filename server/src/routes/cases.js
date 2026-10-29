import { Router } from "express";
import { parseCreateBody, parseAccuseBody, assertParamId, CASE_ID_RE, CLUE_ID_RE } from "../services/inputValidation.js";

const ok = (res, data, message = "Operation completed successfully.", status = 200) => res.status(status).json({ success: true, data, message });
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const token = (req) => req.get("x-case-token");
const caseId = (req) => assertParamId(req.params.id, CASE_ID_RE, "Invalid case id.");

export function casesRouter(service, createLimiter) {
  const r = Router();
  r.post("/", createLimiter, h(async (req, res) => {
    const input = parseCreateBody(req.body);
    const { case: c, accessToken } = await service.create(input);
    ok(res, { case: c, accessToken }, "Case file created.", 201);
  }));
  r.get("/:id", h(async (req, res) => ok(res, { case: await service.get(caseId(req), token(req)) })));
  r.post("/:id/clues/:clueId/discover", h(async (req, res) => {
    const clueId = assertParamId(req.params.clueId, CLUE_ID_RE, "Invalid clue id.");
    ok(res, await service.discoverClue(caseId(req), clueId, token(req)), "Evidence collected.");
  }));
  r.post("/:id/hints", h(async (req, res) => ok(res, await service.requestHint(caseId(req), token(req)), "Hint received.")));
  r.post("/:id/accuse", h(async (req, res) => {
    const body = parseAccuseBody(req.body);
    ok(res, { result: await service.accuse(caseId(req), body, token(req)) }, "Case closed.");
  }));
  r.get("/:id/result", h(async (req, res) => ok(res, { result: await service.result(caseId(req), token(req)) })));
  return r;
}
