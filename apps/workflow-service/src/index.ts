import { eventNames } from "@flowpilot/contracts";
import { createLogger } from "@flowpilot/logger";

const logger = createLogger("workflow-service", "debug");

logger.info("Workflow service scaffold ready", {
  owns: ["workflow definitions", "triggers", "executions", "node metadata"],
  publishes: eventNames.filter((eventName) => eventName.startsWith("workflow."))
});
