import { createLogger } from "@flowpilot/logger";

const logger = createLogger("execution-worker", "debug");

logger.info("Execution worker scaffold ready", {
  consumes: ["workflow.execution.requested"],
  emits: ["node.execution.started", "node.execution.completed", "node.execution.failed"]
});
