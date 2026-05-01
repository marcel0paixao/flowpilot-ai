export * from "./messaging.js";

import { FLOWPILOT_ROUTING_KEYS } from "./messaging.js";

export type WorkflowExecutionRequested = {
  eventName: typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested;
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
  eventName: typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted;
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  correlationId: string;
};

export type NodeExecutionStarted = {
  eventName: typeof FLOWPILOT_ROUTING_KEYS.nodeExecutionStarted;
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
  eventName: typeof FLOWPILOT_ROUTING_KEYS.nodeExecutionCompleted;
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
  eventName: typeof FLOWPILOT_ROUTING_KEYS.nodeExecutionFailed;
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
  eventName: typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted;
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
  eventName: typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed;
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
  eventName: typeof FLOWPILOT_ROUTING_KEYS.aiTraceCreated;
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
  FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested,
  FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted,
  FLOWPILOT_ROUTING_KEYS.nodeExecutionStarted,
  FLOWPILOT_ROUTING_KEYS.nodeExecutionCompleted,
  FLOWPILOT_ROUTING_KEYS.nodeExecutionFailed,
  FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted,
  FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed,
  FLOWPILOT_ROUTING_KEYS.aiTraceCreated
] as const;

export type FlowPilotEventName = (typeof eventNames)[number];
