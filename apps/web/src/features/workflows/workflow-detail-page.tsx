import {
  WORKFLOW_HTTP_METHODS,
  WORKFLOW_NODE_TYPES,
  workflowDefinitionSchema,
  type WorkflowDefinition,
  type WorkflowNode,
  type WorkflowNodeType
} from "@flowpilot/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock3, GitBranch, Network, Plus, PlayCircle, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { WorkflowCanvas } from "@/features/workflow-canvas/workflow-canvas";
import { RunWorkflowButton } from "@/features/workflows/run-workflow-button";
import { ApiError } from "@/shared/api/http";
import { queryKeys } from "@/shared/api/query-keys";
import { createWorkflowVersion, getWorkflow, listWorkflowExecutions } from "@/shared/api/workflows";
import { formatDateTime, formatDuration, humanizeIdentifier, slugify } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { JsonBlock } from "@/shared/ui/json-block";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

export function WorkflowDetailPage() {
  const { workspaceId = "", workflowId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [draftDefinition, setDraftDefinition] = useState<WorkflowDefinition>();
  const [formError, setFormError] = useState<string>();
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
  const activeDefinition = isEditing && draftDefinition ? draftDefinition : definition;

  useEffect(() => {
    if (definition) {
      setDraftDefinition(cloneDefinition(definition));
    }
  }, [definition, workflowQuery.data?.currentVersion.id]);

  useEffect(() => {
    if (!selectedNodeId && activeDefinition?.nodes[0]) {
      setSelectedNodeId(activeDefinition.nodes[0].id);
      return;
    }

    if (selectedNodeId && activeDefinition && !activeDefinition.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(activeDefinition.nodes[0]?.id);
    }
  }, [activeDefinition, selectedNodeId]);

  const selectedNode = useMemo(
    () => activeDefinition?.nodes.find((node) => node.id === selectedNodeId),
    [activeDefinition?.nodes, selectedNodeId]
  );
  const selectedEdge = useMemo(
    () => activeDefinition?.edges.find((edge) => edge.id === selectedEdgeId),
    [activeDefinition?.edges, selectedEdgeId]
  );
  const definitionStats = useMemo(() => {
    if (!activeDefinition) {
      return null;
    }

    return {
      triggers: activeDefinition.nodes.filter((node) => node.type.startsWith("trigger.")).length,
      actions: activeDefinition.nodes.filter((node) => node.type.startsWith("action.")).length,
      edges: activeDefinition.edges.length
    };
  }, [activeDefinition]);
  const saveMutation = useMutation({
    mutationFn: (nextDefinition: WorkflowDefinition) =>
      createWorkflowVersion(workspaceId, workflowId, {
        definition: nextDefinition
      }),
    onSuccess: async (workflow) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflow(workspaceId, workflowId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows(workspaceId) })
      ]);
      setDraftDefinition(cloneDefinition(workflow.currentVersion.definition));
      setIsEditing(false);
      setFormError(undefined);
    }
  });

  function updateDraftDefinition(updater: (definition: WorkflowDefinition) => WorkflowDefinition) {
    setDraftDefinition((currentDefinition) => {
      if (!currentDefinition) {
        return currentDefinition;
      }

      setFormError(undefined);
      return updater(currentDefinition);
    });
  }

  function updateSelectedNode(nextNode: WorkflowNode) {
    updateDraftDefinition((currentDefinition) => ({
      ...currentDefinition,
      nodes: currentDefinition.nodes.map((node) => (node.id === nextNode.id ? nextNode : node))
    }));
  }

  function addNode(type: WorkflowNodeType) {
    updateDraftDefinition((currentDefinition) => {
      const nodeNumber = currentDefinition.nodes.length + 1;
      const node = createNode(type, nodeNumber, currentDefinition);
      const sourceNodeId = selectedNodeId && currentDefinition.nodes.some((candidate) => candidate.id === selectedNodeId)
        ? selectedNodeId
        : currentDefinition.nodes.at(-1)?.id;
      const nextEdges =
        sourceNodeId && node.type.startsWith("action.")
          ? [
              ...currentDefinition.edges,
              {
                id: `${sourceNodeId}-to-${node.id}`,
                sourceNodeId,
                targetNodeId: node.id
              }
            ]
          : currentDefinition.edges;

      setSelectedNodeId(node.id);
      setSelectedEdgeId(undefined);

      return {
        ...currentDefinition,
        nodes: [...currentDefinition.nodes, node],
        edges: nextEdges
      };
    });
  }

  function deleteSelectedNode() {
    if (!selectedNode) {
      return;
    }

    updateDraftDefinition((currentDefinition) => ({
      nodes: currentDefinition.nodes.filter((node) => node.id !== selectedNode.id),
      edges: currentDefinition.edges.filter(
        (edge) => edge.sourceNodeId !== selectedNode.id && edge.targetNodeId !== selectedNode.id
      )
    }));
  }

  function deleteSelectedEdge() {
    if (!selectedEdge) {
      return;
    }

    updateDraftDefinition((currentDefinition) => ({
      ...currentDefinition,
      edges: currentDefinition.edges.filter((edge) => edge.id !== selectedEdge.id)
    }));
    setSelectedEdgeId(undefined);
  }

  async function saveDefinition() {
    if (!draftDefinition) {
      return;
    }

    const validation = workflowDefinitionSchema.safeParse(draftDefinition);

    if (!validation.success) {
      setFormError(validation.error.issues.map((issue) => issue.message).join("; "));
      return;
    }

    try {
      await saveMutation.mutateAsync(validation.data);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Workflow version save failed");
    }
  }

  function discardDraft() {
    if (definition) {
      setDraftDefinition(cloneDefinition(definition));
    }
    setFormError(undefined);
    setIsEditing(false);
  }

  if (workflowQuery.isLoading || !workflowQuery.data || !definition || !activeDefinition) {
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
            {isEditing ? <Badge variant="warning">Unsaved draft</Badge> : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {workflowQuery.data.description ?? workflowQuery.data.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={discardDraft}>
                <X />
                Discard
              </Button>
              <Button onClick={saveDefinition} disabled={saveMutation.isPending}>
                <Save />
                {saveMutation.isPending ? "Saving" : "Save version"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit workflow
            </Button>
          )}
          <RunWorkflowButton workspaceId={workspaceId} workflowId={workflowId} />
        </div>
      </div>

      {definitionStats ? (
        <div className="grid gap-3 md:grid-cols-3">
          <WorkflowMetric icon={PlayCircle} label="Triggers" value={String(definitionStats.triggers)} />
          <WorkflowMetric icon={GitBranch} label="Actions" value={String(definitionStats.actions)} />
          <WorkflowMetric icon={Network} label="Edges" value={String(definitionStats.edges)} />
        </div>
      ) : null}

      {isEditing ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <span className="mr-2 text-sm font-medium">Add node</span>
            <Button size="sm" variant="outline" onClick={() => addNode(WORKFLOW_NODE_TYPES.manualTrigger)}>
              <Plus />
              Manual trigger
            </Button>
            <Button size="sm" variant="outline" onClick={() => addNode(WORKFLOW_NODE_TYPES.transformAction)}>
              <Plus />
              Transform
            </Button>
            <Button size="sm" variant="outline" onClick={() => addNode(WORKFLOW_NODE_TYPES.httpRequestAction)}>
              <Plus />
              HTTP request
            </Button>
            {formError ? <p className="w-full text-sm text-destructive">{formError}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid min-h-[34rem] gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkflowCanvas
          definition={activeDefinition}
          editable={isEditing}
          selectedEdgeId={selectedEdgeId}
          selectedNodeId={selectedNodeId}
          onDefinitionChange={setDraftDefinition}
          onSelectEdge={setSelectedEdgeId}
          onSelectNode={setSelectedNodeId}
        />
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>{selectedEdge ? "Edge details" : "Node details"}</CardTitle>
            <CardDescription>
              {selectedEdge ? selectedEdge.id : selectedNode ? selectedNode.id : "Select a node"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEdge ? (
              <EdgeInspector
                editable={isEditing}
                edge={selectedEdge}
                nodes={activeDefinition.nodes}
                onDelete={deleteSelectedEdge}
              />
            ) : selectedNode ? (
              <NodeInspector
                editable={isEditing}
                node={selectedNode}
                onChange={updateSelectedNode}
                onDelete={deleteSelectedNode}
              />
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionsQuery.data && executionsQuery.data.length > 0 ? (
                  executionsQuery.data.slice(0, 6).map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <StatusBadge status={execution.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(execution.createdAt)}</TableCell>
                      <TableCell>{formatDuration(execution.startedAt, execution.completedAt)}</TableCell>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No executions yet. Run this workflow to create the first trace.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function NodeInspector({
  editable,
  node,
  onChange,
  onDelete
}: {
  editable: boolean;
  node: WorkflowNode;
  onChange: (node: WorkflowNode) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div>
        {editable ? (
          <div className="space-y-2">
            <Label htmlFor="node-name">Name</Label>
            <Input
              id="node-name"
              value={node.name}
              onChange={(event) => onChange({ ...node, name: event.target.value })}
            />
          </div>
        ) : (
          <p className="text-sm font-medium">{node.name}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="info">{humanizeIdentifier(node.type)}</Badge>
          <Badge variant="outline">{node.id}</Badge>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Runtime role</p>
        <p className="mt-1 text-sm">{getNodeRuntimeDescription(node.type)}</p>
      </div>
      {editable ? <NodeConfigEditor node={node} onChange={onChange} /> : <JsonBlock value={node.config} />}
      {editable ? (
        <Button variant="outline" className="w-full justify-center" onClick={onDelete}>
          <Trash2 />
          Delete node
        </Button>
      ) : null}
    </>
  );
}

function EdgeInspector({
  editable,
  edge,
  nodes,
  onDelete
}: {
  editable: boolean;
  edge: WorkflowDefinition["edges"][number];
  nodes: WorkflowNode[];
  onDelete: () => void;
}) {
  const source = nodes.find((node) => node.id === edge.sourceNodeId);
  const target = nodes.find((node) => node.id === edge.targetNodeId);

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Source</p>
        <p className="mt-1 text-sm">{source?.name ?? edge.sourceNodeId}</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Target</p>
        <p className="mt-1 text-sm">{target?.name ?? edge.targetNodeId}</p>
      </div>
      <JsonBlock value={edge} />
      {editable ? (
        <Button variant="outline" className="w-full justify-center" onClick={onDelete}>
          <Trash2 />
          Delete edge
        </Button>
      ) : null}
    </>
  );
}

function NodeConfigEditor({
  node,
  onChange
}: {
  node: WorkflowNode;
  onChange: (node: WorkflowNode) => void;
}) {
  if (node.type === WORKFLOW_NODE_TYPES.manualTrigger) {
    return <JsonBlock value={node.config} />;
  }

  if (node.type === WORKFLOW_NODE_TYPES.transformAction) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="transform-mode">Mode</Label>
          <select
            id="transform-mode"
            className="liquid-field h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={node.config.mode}
            onChange={(event) =>
              onChange({
                ...node,
                config:
                  event.target.value === "pick"
                    ? { mode: "pick", pick: node.config.pick ?? ["leadId"] }
                    : { mode: "passthrough" }
              })
            }
          >
            <option value="passthrough">Passthrough</option>
            <option value="pick">Pick fields</option>
          </select>
        </div>
        {node.config.mode === "pick" ? (
          <div className="space-y-2">
            <Label htmlFor="transform-pick">Pick fields</Label>
            <Input
              id="transform-pick"
              value={node.config.pick?.join(", ") ?? ""}
              onChange={(event) =>
                onChange({
                  ...node,
                  config: {
                    mode: "pick",
                    pick: event.target.value
                      .split(",")
                      .map((field) => field.trim())
                      .filter(Boolean)
                  }
                })
              }
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (node.type === WORKFLOW_NODE_TYPES.httpRequestAction) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="http-method">Method</Label>
          <select
            id="http-method"
            className="liquid-field h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={node.config.method}
            onChange={(event) =>
              onChange({
                ...node,
                config: {
                  ...node.config,
                  method: event.target.value as (typeof WORKFLOW_HTTP_METHODS)[number]
                }
              })
            }
          >
            {WORKFLOW_HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="http-url">URL</Label>
          <Input
            id="http-url"
            value={node.config.url}
            onChange={(event) =>
              onChange({
                ...node,
                config: {
                  ...node.config,
                  url: event.target.value
                }
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="http-body">Body JSON</Label>
          <Textarea
            id="http-body"
            value={JSON.stringify(node.config.body ?? {}, null, 2)}
            onChange={(event) => {
              const parsedBody = parseJsonObject(event.target.value);
              if (parsedBody) {
                onChange({
                  ...node,
                  config: {
                    ...node.config,
                    body: parsedBody
                  }
                });
              }
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}

function WorkflowMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof PlayCircle;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getNodeRuntimeDescription(type: string) {
  if (type === "trigger.manual") {
    return "Starts the execution with the input supplied by the user.";
  }

  if (type === "action.transform") {
    return "Transforms the current payload before the next node runs.";
  }

  if (type === "action.httpRequest") {
    return "Runs the deterministic HTTP request action used by the MVP worker.";
  }

  return "Runs as part of the workflow execution graph.";
}

function cloneDefinition(definition: WorkflowDefinition): WorkflowDefinition {
  return {
    nodes: definition.nodes.map((node) => ({
      ...node,
      config: { ...node.config }
    })) as WorkflowDefinition["nodes"],
    edges: definition.edges.map((edge) => ({ ...edge }))
  };
}

function createNode(type: WorkflowNodeType, nodeNumber: number, definition: WorkflowDefinition): WorkflowNode {
  const baseId = slugify(humanizeIdentifier(type)) || "node";
  const id = getUniqueNodeId(baseId, definition);

  if (type === WORKFLOW_NODE_TYPES.manualTrigger) {
    return {
      id,
      type,
      name: `Manual Trigger ${nodeNumber}`,
      config: {}
    };
  }

  if (type === WORKFLOW_NODE_TYPES.transformAction) {
    return {
      id,
      type,
      name: `Transform ${nodeNumber}`,
      config: {
        mode: "passthrough"
      }
    };
  }

  return {
    id,
    type: WORKFLOW_NODE_TYPES.httpRequestAction,
    name: `HTTP Request ${nodeNumber}`,
    config: {
      method: "GET",
      url: "https://example.test/webhook",
      body: {}
    }
  };
}

function getUniqueNodeId(baseId: string, definition: WorkflowDefinition) {
  const existingIds = new Set(definition.nodes.map((node) => node.id));

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
