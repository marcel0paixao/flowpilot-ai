export const queryKeys = {
  me: ["auth", "me"] as const,
  workspaces: ["workspaces"] as const,
  workspace: (workspaceId: string) => ["workspaces", workspaceId] as const,
  workspaceMembers: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  credentials: (workspaceId: string) => ["workspaces", workspaceId, "credentials"] as const,
  workflows: (workspaceId: string) => ["workspaces", workspaceId, "workflows"] as const,
  workflow: (workspaceId: string, workflowId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId] as const,
  workflowVersions: (workspaceId: string, workflowId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId, "versions"] as const,
  workflowExecutions: (workspaceId: string, workflowId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId, "executions"] as const,
  executionSummary: (workspaceId: string, workflowId: string, executionId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId, "executions", executionId, "summary"] as const,
  executionDiagnostics: (workspaceId: string, workflowId: string, executionId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId, "executions", executionId, "diagnostics"] as const
};
