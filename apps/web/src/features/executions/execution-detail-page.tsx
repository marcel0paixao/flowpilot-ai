import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock3, GitBranch, ListChecks, RadioTower } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { queryKeys } from "@/shared/api/query-keys";
import type { WorkflowExecutionSummary } from "@/shared/api/types";
import { getExecutionDiagnostics, getExecutionSummary } from "@/shared/api/workflows";
import { formatDateTime, formatDuration, humanizeIdentifier, isTerminalExecutionStatus } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { ErrorState } from "@/shared/ui/error-state";
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
  const diagnosticsQuery = useQuery({
    queryKey: queryKeys.executionDiagnostics(workspaceId, workflowId, executionId),
    queryFn: () => getExecutionDiagnostics(workspaceId, workflowId, executionId),
    enabled: Boolean(workspaceId && workflowId && executionId)
  });

  if (summaryQuery.isError) {
    return (
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
        <ErrorState
          title="Execution summary could not be loaded"
          message={summaryQuery.error instanceof Error ? summaryQuery.error.message : undefined}
          onRetry={() => void summaryQuery.refetch()}
        />
      </section>
    );
  }

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
  const isLive = !isTerminalExecutionStatus(summary.execution.status);
  const orderedEvents = [...summary.events].sort(
    (left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
  );

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-normal">Execution Detail</h1>
            <StatusBadge status={summary.execution.status} />
            {isLive ? <Badge variant="info">Polling every 2s</Badge> : null}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{summary.execution.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/app/workspaces/${workspaceId}/workflows/${workflowId}`}>Workflow</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Activity} label="Status" value={summary.execution.status} />
        <MetricCard icon={GitBranch} label="Nodes" value={`${succeededNodes}/${summary.nodes.length}`} />
        <MetricCard icon={ListChecks} label="Events" value={String(summary.events.length)} />
        <MetricCard
          icon={Clock3}
          label="Duration"
          value={formatDuration(summary.execution.startedAt, summary.execution.completedAt)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Retry & DLQ</CardTitle>
            <CardDescription>Operational failure state derived from persisted execution data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnosticsQuery.isLoading ? (
              <>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </>
            ) : diagnosticsQuery.data ? (
              <>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <RadioTower className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Retry attempts</span>
                  </div>
                  <Badge variant={diagnosticsQuery.data.retry.attempts > 0 ? "warning" : "outline"}>
                    {diagnosticsQuery.data.retry.attempts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Dead-lettered</span>
                  </div>
                  <Badge variant={diagnosticsQuery.data.retry.deadLettered ? "danger" : "success"}>
                    {diagnosticsQuery.data.retry.deadLettered ? "Yes" : "No"}
                  </Badge>
                </div>
                {diagnosticsQuery.data.retry.lastFailureMessage ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                    <p className="font-medium text-destructive">
                      {diagnosticsQuery.data.retry.lastFailureCode ?? "Last failure"}
                    </p>
                    <p className="mt-1 text-muted-foreground">{diagnosticsQuery.data.retry.lastFailureMessage}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Diagnostics are not available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-x-auto">
          <CardHeader>
            <CardTitle>Outbox dispatch</CardTitle>
            <CardDescription>Lifecycle events persisted before RabbitMQ publish.</CardDescription>
          </CardHeader>
          <CardContent>
            {diagnosticsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : diagnosticsQuery.data && diagnosticsQuery.data.outbox.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Last error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnosticsQuery.data.outbox.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="font-medium">{humanizeIdentifier(message.eventName)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{message.routingKey}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={message.status} />
                      </TableCell>
                      <TableCell>{message.attempts}</TableCell>
                      <TableCell>{formatDateTime(message.publishedAt)}</TableCell>
                      <TableCell>{message.lastError ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No outbox messages are associated with this execution yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-x-auto">
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.nodes.length > 0 ? (
                  summary.nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="min-w-0">
                        <div className="font-medium">{node.nodeId}</div>
                        <div className="mt-1 max-w-72 truncate text-xs text-muted-foreground">{node.id}</div>
                        {node.error ? <JsonBlock className="mt-2 max-h-28" value={node.error} /> : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{humanizeIdentifier(node.nodeType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={node.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(node.startedAt)}</TableCell>
                      <TableCell>{formatDuration(node.startedAt, node.completedAt)}</TableCell>
                      <TableCell>{formatDateTime(node.completedAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Node progress has not been persisted for this execution yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Execution data</CardTitle>
            <CardDescription>{formatDateTime(summary.execution.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium">Input</p>
              <JsonBlock value={summary.execution.input} />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium">Output</p>
              <JsonBlock value={summary.execution.output} />
            </div>
            {summary.execution.error ? (
              <div className="min-w-0">
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
            {orderedEvents.length > 0 ? (
              orderedEvents.map((event, index) => (
                <div key={event.id} className="relative min-w-0 rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{humanizeIdentifier(event.eventName)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.producer} · {formatDateTime(event.occurredAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{event.eventId.slice(0, 8)}</Badge>
                  </div>
                  <JsonBlock className="mt-3 max-h-44" value={event.payload} />
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Timeline events have not arrived yet. Running executions will keep polling.
              </div>
            )}
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
