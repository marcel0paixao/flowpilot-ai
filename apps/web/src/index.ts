import { createLogger } from "@flowpilot/logger";

const logger = createLogger("web", "debug");

logger.info("Web app scaffold ready", {
  plannedViews: ["workspaces", "workflows", "executions", "AI traces"]
});
