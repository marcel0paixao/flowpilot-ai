import type { WorkflowDefinition } from "@flowpilot/contracts";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type WorkflowStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type WorkflowExecutionStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type WorkflowNodeExecutionStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
export type OutboxMessageStatus = "PENDING" | "PUBLISHED" | "FAILED";
export type AiTraceStatus = "SUCCEEDED" | "FAILED";
export type CredentialType = "openrouter" | "ollama" | "openai" | "claude";
export type CredentialKind = "llm" | "database" | "search" | "webhook" | "email";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface UserProfile extends User {
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
  user: UserProfile;
}

export interface CurrentUserMembership {
  role: WorkspaceRole;
  workspace: Omit<Workspace, "members">;
}

export interface CurrentUser extends UserProfile {
  memberships: CurrentUserMembership[];
}

export interface IntegrationCredential {
  id: string;
  workspaceId: string;
  name: string;
  type: CredentialType;
  kind: CredentialKind;
  capabilities: string[];
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  workspace: {
    id: string;
    role: WorkspaceRole;
  } | null;
}

export interface MeResponse {
  user: CurrentUser;
}

export interface WorkflowVersion {
  id: string;
  version: number;
  definition: WorkflowDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  status: WorkflowStatus;
  currentVersion: WorkflowVersion;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workspaceId: string;
  workflowId: string;
  workflowVersionId: string;
  requestedByUserId: string | null;
  status: WorkflowExecutionStatus;
  input: unknown;
  output: unknown | null;
  error: unknown | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNodeExecution {
  id: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  status: WorkflowNodeExecutionStatus;
  input: unknown;
  output: unknown | null;
  error: unknown | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionEvent {
  id: string;
  workspaceId: string;
  workflowId: string;
  executionId: string;
  eventName: string;
  eventId: string;
  occurredAt: string;
  producer: string;
  payload: unknown;
  createdAt: string;
}

export interface WorkflowAiTrace {
  id: string;
  workspaceId: string;
  workflowId: string | null;
  workflowExecutionId: string | null;
  nodeExecutionId: string | null;
  nodeId: string | null;
  credentialId: string | null;
  provider: string;
  model: string;
  status: AiTraceStatus;
  latencyMs: number;
  providerLatencyMs: number | null;
  finishReason: string | null;
  inputTokenCount: number;
  outputTokenCount: number;
  totalTokenCount: number;
  estimatedCostUsd: string | null;
  inputSizeBytes: number | null;
  outputSizeBytes: number | null;
  schemaValid: boolean | null;
  errorCode: string | null;
  errorMessage: string | null;
  providerStatusCode: number | null;
  retryable: boolean | null;
  createdAt: string;
}

export interface WorkflowExecutionSummary {
  execution: WorkflowExecution;
  nodes: WorkflowNodeExecution[];
  events: WorkflowExecutionEvent[];
  aiTraces: WorkflowAiTrace[];
}

export interface WorkflowExecutionDiagnostics {
  retry: {
    attempts: number;
    deadLettered: boolean;
    lastFailureCode: string | null;
    lastFailureMessage: string | null;
    retryable: boolean | null;
  };
  outbox: Array<{
    id: string;
    eventName: string;
    status: OutboxMessageStatus;
    attempts: number;
    exchange: string;
    routingKey: string;
    lastError: string | null;
    publishedAt: string | null;
    createdAt: string;
  }>;
}
