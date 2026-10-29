import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env, isProd } from "./config/env.js";
import { casesRouter } from "./routes/cases.js";
import { createCaseService } from "./services/caseService.js";
import { generateValidCase } from "./services/caseGenerator.js";

const limited = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message } }),
  });

export function createApp({ repo, generate = generateValidCase, limits = {} }) {
  const app = express();
  if (isProd) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  const origins = env.clientOrigin.split(",").map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins, allowedHeaders: ["Content-Type", "X-Case-Token"], methods: ["GET", "POST", "OPTIONS"], maxAge: 600 }));
  app.use(express.json({ limit: "20kb" }));
  app.use("/api", limited(60_000, limits.general ?? env.generalLimitPerMin, "Too many requests. Please slow down."));

  app.get("/api/health", async (_req, res) => {
    try {
      await repo.ping();
      res.json({ success: true, data: { status: "ok", database: repo.name }, message: "Healthy." });
    } catch {
      res.status(503).json({ success: false, error: { code: "DATABASE_ERROR", message: "Database unavailable." } });
    }
  });

  const service = createCaseService(repo, generate);
  const createLimiter = limited(3_600_000, limits.create ?? env.createLimitPerHour, "You have created many mysteries recently. Please try again later.");
  app.use("/api/cases", casesRouter(service, createLimiter));

  app.use((_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Malformed JSON body." } });
    if (err?.type === "entity.too.large") return res.status(413).json({ success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." } });
    if (err?.expose && err.status) return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
    console.error("[error]", err?.name, String(err?.message || "").slice(0, 200)); // no stack, no payloads
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." } });
  });
  return app;
}
