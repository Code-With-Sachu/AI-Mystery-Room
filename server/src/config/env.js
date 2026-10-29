import "dotenv/config";

const num = (v, d) => (Number.isFinite(Number(v)) && v !== undefined && v !== "" ? Number(v) : d);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: num(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "",
  useMemoryDb: process.env.USE_MEMORY_DB === "true",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "",
  aiTimeoutMs: num(process.env.AI_TIMEOUT_MS, 60000),
  aiMaxAttempts: num(process.env.AI_MAX_ATTEMPTS, 3),
  createLimitPerHour: num(process.env.CREATE_LIMIT_PER_HOUR, 10),
  generalLimitPerMin: num(process.env.GENERAL_LIMIT_PER_MIN, 120),
};
export const isProd = env.nodeEnv === "production";
