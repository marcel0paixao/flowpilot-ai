import type { WorkflowDefinition, WorkflowNode } from "@flowpilot/contracts";
import {
  addEdge,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps
} from "@xyflow/react";
import { Braces, Globe2, Play, Workflow as WorkflowIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { humanizeIdentifier, cn } from "@/shared/lib/utils";
import { useTheme } from "@/features/theme/theme-provider";
import { Badge } from "@/shared/ui/badge";

interface FlowPilotNodeData extends Record<string, unknown> {
  editable: boolean;
  node: WorkflowNode;
  incomingCount: number;
  outgoingCount: number;
}

const nodeTypes = {
  flowpilot: FlowPilotNode
};

export function WorkflowCanvas({
  definition,
  selectedNodeId,
  selectedEdgeId,
  editable = false,
  onDefinitionChange,
  onSelectEdge,
  onSelectNode
}: {
  definition: WorkflowDefinition;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  editable?: boolean;
  onDefinitionChange?: (definition: WorkflowDefinition) => void;
  onSelectEdge?: (edgeId: string | undefined) => void;
  onSelectNode?: (nodeId: string) => void;
}) {
  const theme = useTheme();
  const initialElements = useMemo(
    () => toReactFlowElements(definition, selectedNodeId, selectedEdgeId, theme.theme, editable),
    [definition, editable, selectedEdgeId, selectedNodeId, theme.theme]
  );
  const [nodes, setNodes] = useState(initialElements.nodes);
  const [edges, setEdges] = useState(initialElements.edges);

  useEffect(() => {
    const nextElements = toReactFlowElements(definition, selectedNodeId, selectedEdgeId, theme.theme, editable);
    setNodes(nextElements.nodes);
    setEdges(nextElements.edges);
  }, [definition, editable, selectedEdgeId, selectedNodeId, theme.theme]);

  function updateDefinitionFromEdges(nextEdges: Edge[]) {
    onDefinitionChange?.({
      ...definition,
      edges: nextEdges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target
      }))
    });
  }

  function handleNodesChange(changes: NodeChange<Node<FlowPilotNodeData>>[]) {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));

    const removedNodeIds = changes
      .filter((change) => change.type === "remove")
      .map((change) => change.id);

    if (removedNodeIds.length > 0) {
      onDefinitionChange?.({
        nodes: definition.nodes.filter((node) => !removedNodeIds.includes(node.id)),
        edges: definition.edges.filter(
          (edge) => !removedNodeIds.includes(edge.sourceNodeId) && !removedNodeIds.includes(edge.targetNodeId)
        )
      });
    }
  }

  function handleEdgesChange(changes: EdgeChange<Edge>[]) {
    setEdges((currentEdges) => {
      const nextEdges = applyEdgeChanges(changes, currentEdges);
      if (changes.some((change) => change.type === "remove")) {
        updateDefinitionFromEdges(nextEdges);
      }
      return nextEdges;
    });
  }

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      return;
    }

    const edgeId = `${connection.source}-to-${connection.target}`;
    const nextEdges = addEdge(
      {
        ...connection,
        id: edgeId
      },
      edges
    );

    setEdges(nextEdges);
    updateDefinitionFromEdges(nextEdges);
    onSelectEdge?.(edgeId);
  }

  return (
    <ReactFlow
      className="liquid-glass h-full min-h-[32rem] rounded-lg border border-border bg-card"
      colorMode={theme.theme}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.45}
      nodes={nodes}
      nodesConnectable={editable}
      nodesDraggable={editable}
      nodesFocusable
      nodeTypes={nodeTypes}
      onConnect={editable ? handleConnect : undefined}
      onEdgesChange={editable ? handleEdgesChange : undefined}
      onEdgeClick={(_, edge) => {
        onSelectEdge?.(edge.id);
      }}
      onNodesChange={editable ? handleNodesChange : undefined}
      panOnScroll
      onNodeClick={(_, node) => {
        onSelectEdge?.(undefined);
        onSelectNode?.(node.id);
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color={theme.theme === "dark" ? "#6d4c93" : "#d4cee8"} gap={20} />
      <MiniMap pannable zoomable className="!border !border-border !bg-card dark:!bg-card/70" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function FlowPilotNode({ data, selected }: NodeProps<Node<FlowPilotNodeData>>) {
  const workflowNode = data.node;
  const Icon = getNodeIcon(workflowNode.type);
  const nodeKind = getNodeKind(workflowNode.type);
  const summary = getNodeSummary(workflowNode);
  const canReceiveInput = data.editable && workflowNode.type !== "trigger.manual";
  const canEmitOutput = data.editable || data.outgoingCount > 0;

  return (
    <div
      className={cn(
        "liquid-glass w-64 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors",
        selected
          ? "border-violet-500 ring-2 ring-violet-500/20 dark:border-purple-300 dark:ring-purple-300/24"
          : "border-border"
      )}
    >
      {data.incomingCount > 0 || canReceiveInput ? (
        <Handle className="!bg-violet-600 dark:!bg-purple-300" type="target" position={Position.Left} />
      ) : null}
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={workflowNode.type.startsWith("trigger.") ? "info" : "outline"}>{nodeKind}</Badge>
            <span className="text-xs text-muted-foreground">{workflowNode.id}</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{workflowNode.name}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{summary}</p>
        </div>
      </div>
      {canEmitOutput ? (
        <Handle className="!bg-violet-600 dark:!bg-purple-300" type="source" position={Position.Right} />
      ) : null}
    </div>
  );
}

function toReactFlowElements(
  definition: WorkflowDefinition,
  selectedNodeId: string | undefined,
  selectedEdgeId: string | undefined,
  theme: "light" | "dark",
  editable = false
) {
  const levels = getNodeLevels(definition);
  const lanes = new Map<number, number>();
  const degrees = getNodeDegrees(definition);
  const nodes: Node<FlowPilotNodeData>[] = definition.nodes.map((workflowNode, index) => {
    const level = levels.get(workflowNode.id) ?? index;
    const lane = lanes.get(level) ?? 0;
    lanes.set(level, lane + 1);

    return {
      id: workflowNode.id,
      type: "flowpilot",
      position: {
        x: level * 300,
        y: lane * 130
      },
      selected: workflowNode.id === selectedNodeId,
      data: {
        editable,
        node: workflowNode,
        incomingCount: degrees.incoming.get(workflowNode.id) ?? 0,
        outgoingCount: degrees.outgoing.get(workflowNode.id) ?? 0
      }
    };
  });
  const edges: Edge[] = definition.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    animated: true,
    selected: edge.id === selectedEdgeId,
    style: {
      stroke: edge.id === selectedEdgeId ? "#f59e0b" : theme === "dark" ? "#c084fc" : "#7c3aed",
      strokeWidth: edge.id === selectedEdgeId ? 3 : 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: theme === "dark" ? "#c084fc" : "#7c3aed"
    }
  }));

  return { nodes, edges };
}

function getNodeLevels(definition: WorkflowDefinition) {
  const outgoing = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();
  const levels = new Map<string, number>();

  for (const node of definition.nodes) {
    incomingCount.set(node.id, 0);
  }

  for (const edge of definition.edges) {
    outgoing.set(edge.sourceNodeId, [...(outgoing.get(edge.sourceNodeId) ?? []), edge.targetNodeId]);
    incomingCount.set(edge.targetNodeId, (incomingCount.get(edge.targetNodeId) ?? 0) + 1);
  }

  const queue = definition.nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);

  for (const node of queue) {
    levels.set(node.id, 0);
  }

  while (queue.length > 0) {
    const node = queue.shift();

    if (!node) {
      continue;
    }

    const nextLevel = (levels.get(node.id) ?? 0) + 1;

    for (const targetNodeId of outgoing.get(node.id) ?? []) {
      levels.set(targetNodeId, Math.max(levels.get(targetNodeId) ?? 0, nextLevel));
      const targetNode = definition.nodes.find((candidate) => candidate.id === targetNodeId);

      if (targetNode) {
        queue.push(targetNode);
      }
    }
  }

  return levels;
}

function getNodeDegrees(definition: WorkflowDefinition) {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const node of definition.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, 0);
  }

  for (const edge of definition.edges) {
    outgoing.set(edge.sourceNodeId, (outgoing.get(edge.sourceNodeId) ?? 0) + 1);
    incoming.set(edge.targetNodeId, (incoming.get(edge.targetNodeId) ?? 0) + 1);
  }

  return { incoming, outgoing };
}

function getNodeIcon(type: string) {
  if (type === "trigger.manual") {
    return Play;
  }

  if (type === "action.transform") {
    return Braces;
  }

  if (type === "action.httpRequest") {
    return Globe2;
  }

  return WorkflowIcon;
}

function getNodeKind(type: string) {
  return type.startsWith("trigger.") ? "Trigger" : "Action";
}

function getNodeSummary(node: WorkflowNode) {
  if (node.type === "trigger.manual") {
    return "Receives manual run input and starts the workflow.";
  }

  if (node.type === "action.transform") {
    return node.config.mode === "pick"
      ? `Pick fields: ${node.config.pick?.join(", ")}`
      : "Pass input through unchanged.";
  }

  if (node.type === "action.httpRequest") {
    return `${node.config.method} ${node.config.url}`;
  }

  return "Workflow node";
}
