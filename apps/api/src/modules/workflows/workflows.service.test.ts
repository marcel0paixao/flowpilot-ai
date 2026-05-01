import assert from "node:assert/strict";
import { test } from "node:test";

import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, WorkflowStatus } from "@prisma/client/index";
import { FLOWPILOT_ROUTING_KEYS } from "@flowpilot/contracts";

import { WorkflowsService } from "./workflows.service.js";

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
  assert.equal(result.status, WorkflowStatus.DRAFT);
  assert.equal(result.currentVersion.version, 1);
  assert.deepEqual(result.currentVersion.definition, { nodes: [], edges: [] });

  const createArgs = prisma.workflow.create.calls[0]?.[0] as {
    data: {
      workspaceId: string;
      status: WorkflowStatus;
      versions: { create: { version: number; definition: unknown } };
    };
  };

  assert.equal(createArgs.data.workspaceId, "workspace-1");
  assert.equal(createArgs.data.status, WorkflowStatus.DRAFT);
  assert.equal(createArgs.data.versions.create.version, 1);
  assert.deepEqual(createArgs.data.versions.create.definition, { nodes: [], edges: [] });
  assert.equal(messagingService.publishEvent.calls[0]?.[0], FLOWPILOT_ROUTING_KEYS.workflowCreated);
  assert.equal(messagingService.publishEvent.calls[0]?.[1].payload.workflowId, "workflow-1");
  assert.equal(messagingService.publishEvent.calls[0]?.[1].actor.id, "user-1");
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

function workflowFixture() {
  const now = new Date("2026-05-01T12:00:00.000Z");

  return {
    id: "workflow-1",
    workspaceId: "workspace-1",
    name: "Lead Enrichment",
    slug: "lead-enrichment",
    description: null,
    status: WorkflowStatus.DRAFT,
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

function mockAsync<T>(value: T) {
  const calls: any[][] = [];
  const fn = async (...args: any[]) => {
    calls.push(args);
    return value;
  };

  return Object.assign(fn, { calls });
}

function mockReject(error: unknown) {
  const calls: any[][] = [];
  const fn = async (...args: any[]) => {
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
