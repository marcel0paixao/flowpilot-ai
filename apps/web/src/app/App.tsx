import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/features/auth/auth-provider";
import { LoginPage } from "@/features/auth/login-page";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { ExecutionDetailPage } from "@/features/executions/execution-detail-page";
import { ExecutionsPage } from "@/features/executions/executions-page";
import { MembersPage } from "@/features/workspaces/members-page";
import { WorkspaceSettingsPage } from "@/features/workspaces/workspace-settings-page";
import { WorkspacesPage } from "@/features/workspaces/workspaces-page";
import { WorkflowDetailPage } from "@/features/workflows/workflow-detail-page";
import { WorkflowsPage } from "@/features/workflows/workflows-page";
import { AuthenticatedLayout } from "@/app/layout/authenticated-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app/workspaces" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AuthenticatedLayout />}>
                <Route index element={<Navigate to="/app/workspaces" replace />} />
                <Route path="workspaces" element={<WorkspacesPage />} />
                <Route path="workspaces/:workspaceId" element={<Navigate to="workflows" replace />} />
                <Route path="workspaces/:workspaceId/workflows" element={<WorkflowsPage />} />
                <Route path="workspaces/:workspaceId/workflows/:workflowId" element={<WorkflowDetailPage />} />
                <Route
                  path="workspaces/:workspaceId/workflows/:workflowId/executions/:executionId"
                  element={<ExecutionDetailPage />}
                />
                <Route path="workspaces/:workspaceId/executions" element={<ExecutionsPage />} />
                <Route path="workspaces/:workspaceId/members" element={<MembersPage />} />
                <Route path="workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/app/workspaces" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
