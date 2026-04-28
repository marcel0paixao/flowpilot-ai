import assert from "node:assert/strict";
import { test } from "node:test";

import { NotFoundException } from "@nestjs/common";
import { WorkspaceRole } from "@prisma/client/index";

import { WorkspacesService } from "./workspaces.service.js";

test("WorkspacesService creates a workspace with an owner membership", async () => {
  const owner = {
    id: "user-1",
    email: "owner@example.test",
    displayName: "Owner Example"
  };

  const persistedWorkspace = {
    id: "workspace-1",
    name: "Example Workspace",
    slug: "example-workspace",
    members: [
      {
        role: WorkspaceRole.OWNER,
        user: owner
      }
    ]
  };

  const tx = {
    user: {
      upsert: mockAsync(owner)
    },
    workspace: {
      create: mockAsync(persistedWorkspace)
    }
  };

  const prisma = {
    $transaction: async <T>(callback: (transaction: typeof tx) => Promise<T>) => callback(tx)
  };

  const service = new WorkspacesService(prisma as never);

  const result = await service.create({
    name: "Example Workspace",
    slug: "example-workspace",
    ownerEmail: "OWNER@EXAMPLE.TEST",
    ownerDisplayName: "Owner Example"
  });

  assert.equal(result, persistedWorkspace);
  assert.deepEqual(tx.user.upsert.calls[0]?.[0], {
    where: { email: "owner@example.test" },
    create: {
      email: "owner@example.test",
      displayName: "Owner Example"
    },
    update: {
      displayName: "Owner Example"
    }
  });
  const workspaceCreateArgs = tx.workspace.create.calls[0]?.[0] as {
    data: { members: { create: { role: WorkspaceRole } } };
  };

  assert.equal(workspaceCreateArgs.data.members.create.role, WorkspaceRole.OWNER);
});

test("WorkspacesService lists workspaces newest first", async () => {
  const workspaces = [{ id: "workspace-1" }];
  const prisma = {
    workspace: {
      findMany: mockAsync(workspaces)
    }
  };

  const service = new WorkspacesService(prisma as never);

  const result = await service.findAll();

  assert.equal(result, workspaces);
  const findManyArgs = prisma.workspace.findMany.calls[0]?.[0] as {
    orderBy: { createdAt: "desc" };
  };

  assert.equal(findManyArgs.orderBy.createdAt, "desc");
});

test("WorkspacesService throws NotFoundException when a workspace does not exist", async () => {
  const prisma = {
    workspace: {
      findUnique: mockAsync(null)
    }
  };

  const service = new WorkspacesService(prisma as never);

  await assert.rejects(() => service.findOne("missing-workspace"), NotFoundException);
});

function mockAsync<T>(value: T) {
  const calls: unknown[][] = [];
  const fn = async (...args: unknown[]) => {
    calls.push(args);
    return value;
  };

  return Object.assign(fn, { calls });
}
