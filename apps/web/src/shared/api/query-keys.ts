export const queryKeys = {
  me: ["auth", "me"] as const,
  workspaces: ["workspaces"] as const,
  workspace: (workspaceId: string) => ["workspaces", workspaceId] as const,
  workspaceMembers: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  workflows: (workspaceId: string) => ["workspaces", workspaceId, "workflows"] as const,
  workflow: (workspaceId: string, workflowId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId] as const,
  workflowExecutions: (workspaceId: string, workflowId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId, "executions"] as const,
  executionSummary: (workspaceId: string, workflowId: string, executionId: string) =>
    ["workspaces", workspaceId, "workflows", workflowId, "executions", executionId, "summary"] as const
};
