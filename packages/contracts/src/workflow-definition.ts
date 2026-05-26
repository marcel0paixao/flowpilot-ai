import { z } from "zod";

export const WORKFLOW_NODE_TYPES = {
  manualTrigger: "trigger.manual",
  transformAction: "action.transform",
  httpRequestAction: "action.httpRequest",
  aiPromptAction: "action.aiPrompt"
} as const;

export const WORKFLOW_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const workflowNodeIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, {
    message: "node ids must start with a letter or number and use letters, numbers, dots, colons, underscores, or hyphens"
  });

const workflowNodeNameSchema = z.string().min(1).max(120);

const workflowNodeBaseSchema = z.object({
  id: workflowNodeIdSchema,
  name: workflowNodeNameSchema,
  position: z
    .object({
      x: z.number().finite(),
      y: z.number().finite()
    })
    .strict()
    .optional()
});

export const manualTriggerNodeSchema = workflowNodeBaseSchema
  .extend({
    type: z.literal(WORKFLOW_NODE_TYPES.manualTrigger),
    config: z.object({}).strict()
  })
  .strict();

export const transformActionNodeSchema = workflowNodeBaseSchema
  .extend({
    type: z.literal(WORKFLOW_NODE_TYPES.transformAction),
    config: z
      .object({
        mode: z.enum(["passthrough", "pick"]),
        pick: z.array(z.string().min(1).max(120)).min(1).max(50).optional()
      })
      .strict()
      .superRefine((config, context) => {
        if (config.mode === "pick" && !config.pick) {
          context.addIssue({
            code: "custom",
            message: "pick mode requires a non-empty pick list",
            path: ["pick"]
          });
        }
      })
  })
  .strict();

export const httpRequestActionNodeSchema = workflowNodeBaseSchema
  .extend({
    type: z.literal(WORKFLOW_NODE_TYPES.httpRequestAction),
    config: z
      .object({
        method: z.enum(WORKFLOW_HTTP_METHODS),
        url: z.string().url(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.record(z.string(), z.unknown()).optional()
      })
      .strict()
  })
  .strict();

export const aiPromptActionNodeSchema = workflowNodeBaseSchema
  .extend({
    type: z.literal(WORKFLOW_NODE_TYPES.aiPromptAction),
    config: z
      .object({
        prompt: z.string().min(1).max(2_000),
        systemPrompt: z.string().min(1).max(2_000).optional(),
        provider: z.string().min(1).max(80).default("deterministic"),
        credentialId: z.string().min(1).max(120).optional(),
        model: z.string().min(1).max(120).default("mock-flowpilot-llm"),
        temperature: z.number().min(0).max(2).default(0.2)
      })
      .strict()
  })
  .strict();

export const workflowNodeSchema = z.discriminatedUnion("type", [
  manualTriggerNodeSchema,
  transformActionNodeSchema,
  httpRequestActionNodeSchema,
  aiPromptActionNodeSchema
]);

export const workflowEdgeSchema = z
  .object({
    id: workflowNodeIdSchema,
    sourceNodeId: workflowNodeIdSchema,
    targetNodeId: workflowNodeIdSchema
  })
  .strict();

export const workflowDefinitionSchema = z
  .object({
    nodes: z.array(workflowNodeSchema).min(1).max(100),
    edges: z.array(workflowEdgeSchema).max(200)
  })
  .strict()
  .superRefine((definition, context) => {
    const nodeIds = new Set<string>();
    const triggerNodeIds = new Set<string>();

    for (const [index, node] of definition.nodes.entries()) {
      if (nodeIds.has(node.id)) {
        context.addIssue({
          code: "custom",
          message: "node ids must be unique",
          path: ["nodes", index, "id"]
        });
      }

      nodeIds.add(node.id);

      if (node.type === WORKFLOW_NODE_TYPES.manualTrigger) {
        triggerNodeIds.add(node.id);
      }
    }

    if (triggerNodeIds.size === 0) {
      context.addIssue({
        code: "custom",
        message: "workflow definition must include at least one manual trigger node",
        path: ["nodes"]
      });
    }

    const edgeIds = new Set<string>();
    const edgePairs = new Set<string>();
    const outgoingEdges = new Map<string, string[]>();
    const incomingCounts = new Map<string, number>();

    for (const [index, edge] of definition.edges.entries()) {
      if (edgeIds.has(edge.id)) {
        context.addIssue({
          code: "custom",
          message: "edge ids must be unique",
          path: ["edges", index, "id"]
        });
      }

      edgeIds.add(edge.id);

      if (!nodeIds.has(edge.sourceNodeId)) {
        context.addIssue({
          code: "custom",
          message: "edge sourceNodeId must reference an existing node",
          path: ["edges", index, "sourceNodeId"]
        });
      }

      if (!nodeIds.has(edge.targetNodeId)) {
        context.addIssue({
          code: "custom",
          message: "edge targetNodeId must reference an existing node",
          path: ["edges", index, "targetNodeId"]
        });
      }

      if (edge.sourceNodeId === edge.targetNodeId) {
        context.addIssue({
          code: "custom",
          message: "edges cannot point a node to itself",
          path: ["edges", index]
        });
      }

      const pairKey = `${edge.sourceNodeId}->${edge.targetNodeId}`;
      if (edgePairs.has(pairKey)) {
        context.addIssue({
          code: "custom",
          message: "duplicate edges between the same source and target are not allowed",
          path: ["edges", index]
        });
      }

      edgePairs.add(pairKey);
      outgoingEdges.set(edge.sourceNodeId, [
        ...(outgoingEdges.get(edge.sourceNodeId) ?? []),
        edge.targetNodeId
      ]);
      incomingCounts.set(edge.targetNodeId, (incomingCounts.get(edge.targetNodeId) ?? 0) + 1);
    }

    for (const triggerNodeId of triggerNodeIds) {
      if ((incomingCounts.get(triggerNodeId) ?? 0) > 0) {
        context.addIssue({
          code: "custom",
          message: "manual trigger nodes cannot have incoming edges",
          path: ["edges"]
        });
      }
    }

    validateReachability(definition.nodes.map((node) => node.id), triggerNodeIds, outgoingEdges, context);
    validateAcyclicGraph(definition.nodes.map((node) => node.id), outgoingEdges, context);
  });

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[keyof typeof WORKFLOW_NODE_TYPES];
export type WorkflowHttpMethod = (typeof WORKFLOW_HTTP_METHODS)[number];
export type ManualTriggerNode = z.infer<typeof manualTriggerNodeSchema>;
export type TransformActionNode = z.infer<typeof transformActionNodeSchema>;
export type HttpRequestActionNode = z.infer<typeof httpRequestActionNodeSchema>;
export type AiPromptActionNode = z.infer<typeof aiPromptActionNodeSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

export const DEFAULT_WORKFLOW_DEFINITION = {
  nodes: [
    {
      id: "manual-trigger",
      type: WORKFLOW_NODE_TYPES.manualTrigger,
      name: "Manual Trigger",
      config: {}
    }
  ],
  edges: []
} satisfies WorkflowDefinition;

function validateReachability(
  nodeIds: string[],
  triggerNodeIds: Set<string>,
  outgoingEdges: Map<string, string[]>,
  context: z.RefinementCtx
) {
  const reachableNodeIds = new Set<string>();
  const queue = [...triggerNodeIds];

  while (queue.length > 0) {
    const nodeId = queue.shift();

    if (!nodeId || reachableNodeIds.has(nodeId)) {
      continue;
    }

    reachableNodeIds.add(nodeId);

    for (const nextNodeId of outgoingEdges.get(nodeId) ?? []) {
      queue.push(nextNodeId);
    }
  }

  for (const nodeId of nodeIds) {
    if (!reachableNodeIds.has(nodeId)) {
      context.addIssue({
        code: "custom",
        message: "all nodes must be reachable from a manual trigger",
        path: ["nodes"]
      });
      return;
    }
  }
}

function validateAcyclicGraph(
  nodeIds: string[],
  outgoingEdges: Map<string, string[]>,
  context: z.RefinementCtx
) {
  const visitedNodeIds = new Set<string>();
  const visitingNodeIds = new Set<string>();

  const visit = (nodeId: string): boolean => {
    if (visitingNodeIds.has(nodeId)) {
      return false;
    }

    if (visitedNodeIds.has(nodeId)) {
      return true;
    }

    visitingNodeIds.add(nodeId);

    for (const nextNodeId of outgoingEdges.get(nodeId) ?? []) {
      if (!visit(nextNodeId)) {
        return false;
      }
    }

    visitingNodeIds.delete(nodeId);
    visitedNodeIds.add(nodeId);
    return true;
  };

  for (const nodeId of nodeIds) {
    if (!visit(nodeId)) {
      context.addIssue({
        code: "custom",
        message: "workflow definition must be acyclic",
        path: ["edges"]
      });
      return;
    }
  }
}
