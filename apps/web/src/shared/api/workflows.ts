import { apiRequest } from "@/shared/api/http";
import type { WorkflowDefinition } from "@flowpilot/contracts";
import type {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionSummary
} from "@/shared/api/types";

export interface CreateWorkflowRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface RequestWorkflowExecutionRequest {
  input?: Record<string, unknown>;
}

export interface CreateWorkflowVersionRequest {
  definition: WorkflowDefinition;
}

export function listWorkflows(workspaceId: string) {
  return apiRequest<Workflow[]>(`/workspaces/${workspaceId}/workflows`);
}

export function getWorkflow(workspaceId: string, workflowId: string) {
  return apiRequest<Workflow>(`/workspaces/${workspaceId}/workflows/${workflowId}`);
}

export function createWorkflow(workspaceId: string, request: CreateWorkflowRequest) {
  return apiRequest<Workflow>(`/workspaces/${workspaceId}/workflows`, {
    method: "POST",
    body: request
  });
}

export function createWorkflowVersion(
  workspaceId: string,
  workflowId: string,
  request: CreateWorkflowVersionRequest
) {
  return apiRequest<Workflow>(`/workspaces/${workspaceId}/workflows/${workflowId}/versions`, {
    method: "POST",
    body: request
  });
}

export function listWorkflowExecutions(workspaceId: string, workflowId: string) {
  return apiRequest<WorkflowExecution[]>(
    `/workspaces/${workspaceId}/workflows/${workflowId}/executions`
  );
}

export function requestWorkflowExecution(
  workspaceId: string,
  workflowId: string,
  request: RequestWorkflowExecutionRequest
) {
  return apiRequest<WorkflowExecution>(
    `/workspaces/${workspaceId}/workflows/${workflowId}/executions`,
    {
      method: "POST",
      body: request
    }
  );
}

export function getExecutionSummary(workspaceId: string, workflowId: string, executionId: string) {
  return apiRequest<WorkflowExecutionSummary>(
    `/workspaces/${workspaceId}/workflows/${workflowId}/executions/${executionId}/summary`
  );
}
