import { createLogger } from "@flowpilot/logger";

const logger = createLogger("ai-orchestrator", "debug");

logger.info("AI orchestrator scaffold ready", {
  owns: ["LangChain flows", "RAG", "memory", "tools", "provider abstraction"],
  emits: ["ai.trace.created"]
});
