import type { WorkflowDefinition, WorkflowNode } from "@flowpilot/contracts";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps
} from "@xyflow/react";
import { MousePointer2, Play, Split, Workflow as WorkflowIcon } from "lucide-react";
import { useMemo } from "react";

import { humanizeIdentifier, cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

interface FlowPilotNodeData extends Record<string, unknown> {
  node: WorkflowNode;
}

const nodeTypes = {
  flowpilot: FlowPilotNode
};

export function WorkflowCanvas({
  definition,
  selectedNodeId,
  onSelectNode
}: {
  definition: WorkflowDefinition;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
}) {
  const { nodes, edges } = useMemo(() => toReactFlowElements(definition, selectedNodeId), [
    definition,
    selectedNodeId
  ]);

  return (
    <ReactFlow
      className="h-full min-h-[32rem] rounded-lg border border-border bg-card"
      colorMode="light"
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.45}
      nodes={nodes}
      nodesConnectable={false}
      nodesDraggable={false}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onSelectNode?.(node.id)}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#dbe4e0" gap={18} />
      <MiniMap pannable zoomable className="!border !border-border !bg-card" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function FlowPilotNode({ data, selected }: NodeProps<Node<FlowPilotNodeData>>) {
  const workflowNode = data.node;
  const Icon = getNodeIcon(workflowNode.type);

  return (
    <div
      className={cn(
        "w-56 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors",
        selected ? "border-teal-500 ring-2 ring-teal-500/20" : "border-border"
      )}
    >
      <Handle className="!bg-teal-700" type="target" position={Position.Left} />
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{workflowNode.name}</p>
          <div className="mt-1">
            <Badge variant="outline">{humanizeIdentifier(workflowNode.type)}</Badge>
          </div>
        </div>
      </div>
      <Handle className="!bg-teal-700" type="source" position={Position.Right} />
    </div>
  );
}

function toReactFlowElements(definition: WorkflowDefinition, selectedNodeId?: string) {
  const levels = getNodeLevels(definition);
  const lanes = new Map<number, number>();
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
        node: workflowNode
      }
    };
  });
  const edges: Edge[] = definition.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    animated: true,
    style: {
      stroke: "#0f766e",
      strokeWidth: 2
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

function getNodeIcon(type: string) {
  if (type === "trigger.manual") {
    return Play;
  }

  if (type === "action.transform") {
    return Split;
  }

  if (type === "action.httpRequest") {
    return MousePointer2;
  }

  return WorkflowIcon;
}
