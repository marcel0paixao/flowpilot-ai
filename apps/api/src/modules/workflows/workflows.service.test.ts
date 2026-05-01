import assert from "node:assert/strict";
import { test } from "node:test";

import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client/index";
import { FLOWPILOT_ROUTING_KEYS } from "@flowpilot/contracts";

import { WorkflowsService } from "./workflows.service.js";

const WORKFLOW_STATUS_DRAFT = "DRAFT";
const WORKFLOW_EXECUTION_STATUS_PENDING = "PENDING";

test("WorkflowsService creates a workflow with an initial draft version", async () => {
  const workflow = workflowFixture();
  const prisma = {
    workflow: {
      create: mockAsync(workflow)
    }
  };
  const messagingService = fakeMessagingService();
  const service = new WorkflowsService(prisma as never, messagingService);

  const result = await service.create("workspace-1", {
    name: "Lead Enrichment",
    slug: "lead-enrichment"
  }, "user-1");

  assert.equal(result.id, "workflow-1");
  assert.equal(result.status, WORKFLOW_STATUS_DRAFT);
  assert.equal(result.currentVersion.version, 1);
  assert.deepEqual(result.currentVersion.definition, { nodes: [], edges: [] });

  const createArgs = prisma.workflow.create.calls[0]?.[0] as {
    data: {
      workspaceId: string;
      status: typeof WORKFLOW_STATUS_DRAFT;
      versions: { create: { version: number; definition: unknown } };
    };
  };

  assert.equal(createArgs.data.workspaceId, "workspace-1");
  assert.equal(createArgs.data.status, WORKFLOW_STATUS_DRAFT);
  assert.equal(createArgs.data.versions.create.version, 1);
  assert.deepEqual(createArgs.data.versions.create.definition, { nodes: [], edges: [] });
  assert.equal(messagingService.publishEvent.calls[0]?.[0], FLOWPILOT_ROUTING_KEYS.workflowCreated);
  const workflowCreatedMessage = messagingService.publishEvent.calls[0]?.[1] as {
    actor: { id: string };
    payload: { workflowId: string };
  };
  assert.equal(workflowCreatedMessage.payload.workflowId, "workflow-1");
  assert.equal(workflowCreatedMessage.actor.id, "user-1");
});

test("WorkflowsService throws ConflictException for duplicate workflow slug", async () => {
  const prisma = {
    workflow: {
      create: mockReject(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "test"
        })
      )
    }
  };
  const service = new WorkflowsService(prisma as never, fakeMessagingService());

  await assert.rejects(
    () =>
      service.create("workspace-1", {
        name: "Lead Enrichment",
        slug: "lead-enrichment"
      }, "user-1"),
    ConflictException
  );
});

test("WorkflowsService lists workflows for a workspace", async () => {
  const workflows = [workflowFixture()];
  const prisma = {
    workflow: {
      findMany: mockAsync(workflows)
    }
  };
  const service = new WorkflowsService(prisma as never, fakeMessagingService());

  const result = await service.findAllForWorkspace("workspace-1");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.workspaceId, "workspace-1");

  const findManyArgs = prisma.workflow.findMany.calls[0]?.[0] as {
    where: { workspaceId: string };
    orderBy: { updatedAt: "desc" };
  };

  assert.equal(findManyArgs.where.workspaceId, "workspace-1");
  assert.equal(findManyArgs.orderBy.updatedAt, "desc");
});

test("WorkflowsService throws NotFoundException when workflow is missing", async () => {
  const prisma = {
    workflow: {
      findFirst: mockAsync(null)
    }
  };
  const service = new WorkflowsService(prisma as never, fakeMessagingService());

  await assert.rejects(() => service.findOne("workspace-1", "missing-workflow"), NotFoundException);
});

test("WorkflowsService requests a workflow execution and publishes an event", async () => {
  const workflow = workflowFixture();
  const execution = workflowExecutionFixture();
  const prisma = {
    workflow: {
      findFirst: mockAsync(workflow)
    },
    workflowExecution: {
      create: mockAsync(execution)
    }
  };
  const messagingService = fakeMessagingService();
  const service = new WorkflowsService(prisma as never, messagingService);

  const result = await service.requestExecution(
    "workspace-1",
    "workflow-1",
    {
      input: {
        leadId: "lead-1"
      }
    },
    "user-1"
  );

  assert.equal(result.id, "execution-1");
  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS_PENDING);
  assert.deepEqual(result.input, { leadId: "lead-1" });

  const createArgs = prisma.workflowExecution.create.calls[0]?.[0] as {
    data: {
      workspaceId: string;
      workflowId: string;
      workflowVersionId: string;
      requestedByUserId: string;
      status: typeof WORKFLOW_EXECUTION_STATUS_PENDING;
      input: unknown;
    };
  };

  assert.equal(createArgs.data.workspaceId, "workspace-1");
  assert.equal(createArgs.data.workflowId, "workflow-1");
  assert.equal(createArgs.data.workflowVersionId, "version-1");
  assert.equal(createArgs.data.requestedByUserId, "user-1");
  assert.equal(createArgs.data.status, WORKFLOW_EXECUTION_STATUS_PENDING);
  assert.deepEqual(createArgs.data.input, { leadId: "lead-1" });

  const [routingKey, message] = messagingService.publishEvent.calls[0] ?? [];
  assert.equal(routingKey, FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested);
  const executionMessage = message as {
    payload: {
      executionId: string;
      workflowId: string;
      workflowVersion: number;
      input: Record<string, unknown>;
    };
  };
  assert.equal(executionMessage.payload.executionId, "execution-1");
  assert.equal(executionMessage.payload.workflowId, "workflow-1");
  assert.equal(executionMessage.payload.workflowVersion, 1);
  assert.deepEqual(executionMessage.payload.input, { leadId: "lead-1" });
});

test("WorkflowsService rejects execution requests for missing workflows", async () => {
  const prisma = {
    workflow: {
      findFirst: mockAsync(null)
    }
  };
  const service = new WorkflowsService(prisma as never, fakeMessagingService());

  await assert.rejects(
    () => service.requestExecution("workspace-1", "missing-workflow", {}, "user-1"),
    NotFoundException
  );
});

function workflowFixture() {
  const now = new Date("2026-05-01T12:00:00.000Z");

  return {
    id: "workflow-1",
    workspaceId: "workspace-1",
    name: "Lead Enrichment",
    slug: "lead-enrichment",
    description: null,
    status: WORKFLOW_STATUS_DRAFT,
    createdAt: now,
    updatedAt: now,
    versions: [
      {
        id: "version-1",
        workflowId: "workflow-1",
        version: 1,
        definition: {
          nodes: [],
          edges: []
        },
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

function workflowExecutionFixture() {
  const now = new Date("2026-05-01T12:05:00.000Z");

  return {
    id: "execution-1",
    workspaceId: "workspace-1",
    workflowId: "workflow-1",
    workflowVersionId: "version-1",
    requestedByUserId: "user-1",
    status: WORKFLOW_EXECUTION_STATUS_PENDING,
    input: {
      leadId: "lead-1"
    },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function mockAsync<T>(value: T) {
  const calls: unknown[][] = [];
  const fn = async (...args: unknown[]) => {
    calls.push(args);
    return value;
  };

  return Object.assign(fn, { calls });
}

function mockReject(error: unknown) {
  const calls: unknown[][] = [];
  const fn = async (...args: unknown[]) => {
    calls.push(args);
    throw error;
  };

  return Object.assign(fn, { calls });
}

function fakeMessagingService() {
  return {
    publishEvent: mockAsync(undefined)
  };
}
