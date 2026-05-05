import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { WorkflowCanvas } from "@/features/workflow-canvas/workflow-canvas";
import { RunWorkflowButton } from "@/features/workflows/run-workflow-button";
import { queryKeys } from "@/shared/api/query-keys";
import { getWorkflow, listWorkflowExecutions } from "@/shared/api/workflows";
import { formatDateTime, humanizeIdentifier } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { JsonBlock } from "@/shared/ui/json-block";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function WorkflowDetailPage() {
  const { workspaceId = "", workflowId = "" } = useParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const workflowQuery = useQuery({
    queryKey: queryKeys.workflow(workspaceId, workflowId),
    queryFn: () => getWorkflow(workspaceId, workflowId),
    enabled: Boolean(workspaceId && workflowId)
  });
  const executionsQuery = useQuery({
    queryKey: queryKeys.workflowExecutions(workspaceId, workflowId),
    queryFn: () => listWorkflowExecutions(workspaceId, workflowId),
    enabled: Boolean(workspaceId && workflowId)
  });
  const definition = workflowQuery.data?.currentVersion.definition;

  useEffect(() => {
    if (!selectedNodeId && definition?.nodes[0]) {
      setSelectedNodeId(definition.nodes[0].id);
    }
  }, [definition?.nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => definition?.nodes.find((node) => node.id === selectedNodeId),
    [definition?.nodes, selectedNodeId]
  );

  if (workflowQuery.isLoading || !workflowQuery.data || !definition) {
    return (
      <section className="grid gap-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[32rem] w-full" />
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-normal">{workflowQuery.data.name}</h1>
            <StatusBadge status={workflowQuery.data.status} />
            <Badge variant="outline">v{workflowQuery.data.currentVersion.version}</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {workflowQuery.data.description ?? workflowQuery.data.slug}
          </p>
        </div>
        <RunWorkflowButton workspaceId={workspaceId} workflowId={workflowId} />
      </div>

      <div className="grid min-h-[34rem] gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkflowCanvas definition={definition} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Node details</CardTitle>
            <CardDescription>{selectedNode ? selectedNode.id : "Select a node"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode ? (
              <>
                <div>
                  <p className="text-sm font-medium">{selectedNode.name}</p>
                  <div className="mt-2">
                    <Badge variant="info">{humanizeIdentifier(selectedNode.type)}</Badge>
                  </div>
                </div>
                <JsonBlock value={selectedNode.config} />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent executions</CardTitle>
            <CardDescription>Latest worker runs for this workflow.</CardDescription>
          </div>
          <Clock3 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {executionsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionsQuery.data?.slice(0, 6).map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <StatusBadge status={execution.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(execution.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(execution.completedAt)}</TableCell>
                    <TableCell>
                      <Button asChild size="icon" variant="ghost" aria-label="Open execution">
                        <Link
                          to={`/app/workspaces/${workspaceId}/workflows/${workflowId}/executions/${execution.id}`}
                        >
                          <ArrowRight />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
