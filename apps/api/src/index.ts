import { createLogger } from "@flowpilot/logger";

const logger = createLogger("api", "debug");

logger.info("Auth/API service scaffold ready", {
  owns: ["users", "workspaces", "roles", "permissions", "jwt"]
});
