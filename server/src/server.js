import { env, isProd } from "./config/env.js";
import { createApp } from "./app.js";
import { createMongoRepository, connectMongo } from "./repositories/mongoRepository.js";
import { createMemoryRepository } from "./repositories/memoryRepository.js";

async function main() {
  if (!env.geminiApiKey || !env.geminiModel) console.warn("[config] GEMINI_API_KEY / GEMINI_MODEL missing: case generation will return AI_NOT_CONFIGURED.");
  let repo;
  if (env.useMemoryDb) {
    if (isProd) throw new Error("USE_MEMORY_DB must not be enabled in production.");
    console.warn("[db] Using in-memory store. Data is lost on restart.");
    repo = createMemoryRepository();
  } else {
    if (!env.mongoUri) throw new Error("MONGODB_URI is required (or set USE_MEMORY_DB=true for local demos).");
    await connectMongo(env.mongoUri);
    repo = createMongoRepository();
  }
  createApp({ repo }).listen(env.port, () => console.log("[server] listening on port " + env.port));
}
main().catch((e) => {
  console.error("[fatal]", e.message);
  process.exit(1);
});
