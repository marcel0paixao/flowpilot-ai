export type WorkflowExecutionRequested = {
  eventName: "workflow.execution.requested";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  workflowVersion: number;
  executionId: string;
  requestedBy: {
    type: "user" | "system" | "webhook";
    id: string;
  };
  input: Record<string, unknown>;
  correlationId: string;
};

export type WorkflowExecutionStarted = {
  eventName: "workflow.execution.started";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  correlationId: string;
};

export type NodeExecutionStarted = {
  eventName: "node.execution.started";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  correlationId: string;
};

export type NodeExecutionCompleted = {
  eventName: "node.execution.completed";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
  output: Record<string, unknown>;
  durationMs: number;
  correlationId: string;
};

export type NodeExecutionFailed = {
  eventName: "node.execution.failed";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
  correlationId: string;
};

export type WorkflowExecutionCompleted = {
  eventName: "workflow.execution.completed";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  output: Record<string, unknown>;
  durationMs: number;
  correlationId: string;
};

export type WorkflowExecutionFailed = {
  eventName: "workflow.execution.failed";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
  correlationId: string;
};

export type AiTraceCreated = {
  eventName: "ai.trace.created";
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  traceId: string;
  executionId?: string;
  model: string;
  provider: string;
  latencyMs: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd?: number;
  status: "success" | "error";
  correlationId: string;
};

export type FlowPilotEvent =
  | WorkflowExecutionRequested
  | WorkflowExecutionStarted
  | NodeExecutionStarted
  | NodeExecutionCompleted
  | NodeExecutionFailed
  | WorkflowExecutionCompleted
  | WorkflowExecutionFailed
  | AiTraceCreated;

export const eventNames = [
  "workflow.execution.requested",
  "workflow.execution.started",
  "node.execution.started",
  "node.execution.completed",
  "node.execution.failed",
  "workflow.execution.completed",
  "workflow.execution.failed",
  "ai.trace.created"
] as const;

export type FlowPilotEventName = (typeof eventNames)[number];
