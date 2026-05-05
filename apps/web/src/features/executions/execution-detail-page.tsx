import { useQuery } from "@tanstack/react-query";
import { Activity, GitBranch, ListChecks } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { queryKeys } from "@/shared/api/query-keys";
import type { WorkflowExecutionSummary } from "@/shared/api/types";
import { getExecutionSummary } from "@/shared/api/workflows";
import { formatDateTime, humanizeIdentifier, isTerminalExecutionStatus } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { JsonBlock } from "@/shared/ui/json-block";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function ExecutionDetailPage() {
  const { workspaceId = "", workflowId = "", executionId = "" } = useParams();
  const summaryQuery = useQuery({
    queryKey: queryKeys.executionSummary(workspaceId, workflowId, executionId),
    queryFn: () => getExecutionSummary(workspaceId, workflowId, executionId),
    enabled: Boolean(workspaceId && workflowId && executionId),
    refetchInterval: (query) => {
      const data = query.state.data as WorkflowExecutionSummary | undefined;

      return data && !isTerminalExecutionStatus(data.execution.status) ? 2_000 : false;
    }
  });

  if (summaryQuery.isLoading || !summaryQuery.data) {
    return (
      <section className="grid gap-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-72 w-full" />
      </section>
    );
  }

  const summary = summaryQuery.data;
  const succeededNodes = summary.nodes.filter((node) => node.status === "SUCCEEDED").length;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-normal">Execution Detail</h1>
            <StatusBadge status={summary.execution.status} />
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{summary.execution.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/app/workspaces/${workspaceId}/workflows/${workflowId}`}>Workflow</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Activity} label="Status" value={summary.execution.status} />
        <MetricCard icon={GitBranch} label="Nodes" value={`${succeededNodes}/${summary.nodes.length}`} />
        <MetricCard icon={ListChecks} label="Events" value={String(summary.events.length)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Node progress</CardTitle>
            <CardDescription>Status by executed workflow node.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.nodes.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell>
                      <div className="font-medium">{node.nodeId}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{node.id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{humanizeIdentifier(node.nodeType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={node.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(node.startedAt)}</TableCell>
                    <TableCell>{formatDateTime(node.completedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution data</CardTitle>
            <CardDescription>{formatDateTime(summary.execution.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Input</p>
              <JsonBlock value={summary.execution.input} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Output</p>
              <JsonBlock value={summary.execution.output} />
            </div>
            {summary.execution.error ? (
              <div>
                <p className="mb-2 text-sm font-medium">Error</p>
                <JsonBlock value={summary.execution.error} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Persisted workflow and node lifecycle events.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{event.eventName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.producer} · {formatDateTime(event.occurredAt)}
                    </p>
                  </div>
                  <Badge variant="outline">{event.eventId.slice(0, 8)}</Badge>
                </div>
                <JsonBlock className="mt-3 max-h-44" value={event.payload} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
