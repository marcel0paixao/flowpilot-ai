import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_WORKFLOW_DEFINITION,
  WORKFLOW_NODE_TYPES,
  workflowDefinitionSchema
} from "./index.js";

test("default workflow definition is executable from a manual trigger", () => {
  const result = workflowDefinitionSchema.safeParse(DEFAULT_WORKFLOW_DEFINITION);

  assert.equal(result.success, true);
});

test("workflow definition accepts the initial demo node types", () => {
  const result = workflowDefinitionSchema.safeParse({
    nodes: [
      {
        id: "manual-trigger",
        type: WORKFLOW_NODE_TYPES.manualTrigger,
        name: "Manual Trigger",
        config: {}
      },
      {
        id: "normalize-lead",
        type: WORKFLOW_NODE_TYPES.transformAction,
        name: "Normalize Lead",
        config: {
          mode: "pick",
          pick: ["leadId", "email"]
        }
      },
      {
        id: "enrichment-request",
        type: WORKFLOW_NODE_TYPES.httpRequestAction,
        name: "Request Enrichment",
        config: {
          method: "POST",
          url: "https://example.com/api/enrich-lead",
          headers: {
            "content-type": "application/json"
          },
          body: {
            source: "flowpilot-demo"
          }
        }
      }
    ],
    edges: [
      {
        id: "edge-manual-to-normalize",
        sourceNodeId: "manual-trigger",
        targetNodeId: "normalize-lead"
      },
      {
        id: "edge-normalize-to-enrichment",
        sourceNodeId: "normalize-lead",
        targetNodeId: "enrichment-request"
      }
    ]
  });

  assert.equal(result.success, true);
});

test("workflow definition rejects broken edges and unreachable nodes", () => {
  const result = workflowDefinitionSchema.safeParse({
    nodes: [
      {
        id: "manual-trigger",
        type: WORKFLOW_NODE_TYPES.manualTrigger,
        name: "Manual Trigger",
        config: {}
      },
      {
        id: "orphan-transform",
        type: WORKFLOW_NODE_TYPES.transformAction,
        name: "Orphan Transform",
        config: {
          mode: "passthrough"
        }
      }
    ],
    edges: [
      {
        id: "edge-to-missing-node",
        sourceNodeId: "manual-trigger",
        targetNodeId: "missing-node"
      }
    ]
  });

  assert.equal(result.success, false);
});
