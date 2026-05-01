import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { PrismaClient } from "@prisma/client/index";

import { createTestApp } from "../../test/create-test-app.js";

process.env.DATABASE_URL ??= "postgresql://flowpilot:flowpilot@localhost:5432/flowpilot_test";

const prisma = new PrismaClient();
let app: Awaited<ReturnType<typeof createTestApp>>;

before(async () => {
  app = await createTestApp();
});

beforeEach(async () => {
  await prisma.workflowExecution.deleteMany();
  await prisma.workflowVersion.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test("workspace HTTP flow enforces auth, membership, and member management", async () => {
  const owner = await register("owner@example.test", "Owner Example");
  assert.equal(owner.statusCode, 201);

  const ownerLogin = await login("owner@example.test");
  assert.equal(ownerLogin.statusCode, 200);
  const ownerSession = ownerLogin.json<{
    accessToken: string;
    workspace: null;
  }>();

  const unauthorizedList = await app.inject({
    method: "GET",
    url: "/api/workspaces"
  });
  assert.equal(unauthorizedList.statusCode, 401);

  const workspaceResponse = await app.inject({
    method: "POST",
    url: "/api/workspaces",
    headers: bearer(ownerSession.accessToken),
    payload: {
      name: "Integration Workspace",
      slug: "integration-workspace"
    }
  });
  assert.equal(workspaceResponse.statusCode, 201);

  const workspace = workspaceResponse.json<{
    id: string;
    members: Array<{ id: string; role: string; user: { email: string } }>;
  }>();
  assert.equal(workspace.members[0]?.role, "OWNER");
  assert.equal(workspace.members[0]?.user.email, "owner@example.test");

  const member = await register("member@example.test", "Member Example");
  assert.equal(member.statusCode, 201);

  const createdMemberResponse = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspace.id}/members`,
    headers: bearer(ownerSession.accessToken),
    payload: {
      email: "member@example.test",
      role: "VIEWER"
    }
  });
  assert.equal(createdMemberResponse.statusCode, 201);

  const createdMember = createdMemberResponse.json<{ id: string; role: string }>();
  assert.equal(createdMember.role, "VIEWER");

  const updatedMemberResponse = await app.inject({
    method: "PATCH",
    url: `/api/workspaces/${workspace.id}/members/${createdMember.id}`,
    headers: bearer(ownerSession.accessToken),
    payload: {
      role: "MEMBER"
    }
  });
  assert.equal(updatedMemberResponse.statusCode, 200);
  assert.equal(updatedMemberResponse.json<{ role: string }>().role, "MEMBER");

  const memberLogin = await login("member@example.test", workspace.id);
  assert.equal(memberLogin.statusCode, 200);
  const memberSession = memberLogin.json<{ accessToken: string }>();

  const forbiddenAdd = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspace.id}/members`,
    headers: bearer(memberSession.accessToken),
    payload: {
      email: "blocked@example.test",
      role: "VIEWER"
    }
  });
  assert.equal(forbiddenAdd.statusCode, 403);

  const membersResponse = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspace.id}/members`,
    headers: bearer(ownerSession.accessToken)
  });
  assert.equal(membersResponse.statusCode, 200);
  assert.equal(membersResponse.json<unknown[]>().length, 2);

  const removeResponse = await app.inject({
    method: "DELETE",
    url: `/api/workspaces/${workspace.id}/members/${createdMember.id}`,
    headers: bearer(ownerSession.accessToken)
  });
  assert.equal(removeResponse.statusCode, 200);
  assert.deepEqual(removeResponse.json(), { removed: true });
});

test("workflow HTTP flow creates, lists, details, and enforces workspace roles", async () => {
  await register("owner@example.test", "Owner Example");
  const ownerLogin = await login("owner@example.test");
  const ownerToken = ownerLogin.json<{ accessToken: string }>().accessToken;
  const workspace = await app.inject({
    method: "POST",
    url: "/api/workspaces",
    headers: bearer(ownerToken),
    payload: {
      name: "Workflow Workspace",
      slug: "workflow-workspace"
    }
  });
  const workspaceId = workspace.json<{ id: string }>().id;

  const invalidWorkflowResponse = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/workflows`,
    headers: bearer(ownerToken),
    payload: {}
  });
  assert.equal(invalidWorkflowResponse.statusCode, 400);

  const createWorkflowResponse = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/workflows`,
    headers: bearer(ownerToken),
    payload: {
      name: "Lead Enrichment",
      slug: "lead-enrichment",
      definition: {
        nodes: [],
        edges: []
      }
    }
  });
  assert.equal(createWorkflowResponse.statusCode, 201);

  const workflow = createWorkflowResponse.json<{
    id: string;
    status: string;
    currentVersion: {
      id: string;
      version: number;
      definition: { nodes: unknown[]; edges: unknown[] };
    };
  }>();
  assert.equal(workflow.status, "DRAFT");
  assert.equal(workflow.currentVersion.version, 1);
  assert.deepEqual(workflow.currentVersion.definition, { nodes: [], edges: [] });

  const listResponse = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}/workflows`,
    headers: bearer(ownerToken)
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json<unknown[]>().length, 1);

  const detailResponse = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}`,
    headers: bearer(ownerToken)
  });
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.json<{ id: string }>().id, workflow.id);

  const invalidExecutionResponse = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions`,
    headers: bearer(ownerToken),
    payload: {
      input: "not-an-object"
    }
  });
  assert.equal(invalidExecutionResponse.statusCode, 400);

  const executionResponse = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions`,
    headers: bearer(ownerToken),
    payload: {
      input: {
        leadId: "lead-1"
      }
    }
  });
  assert.equal(executionResponse.statusCode, 201);

  const execution = executionResponse.json<{
    id: string;
    workflowId: string;
    workflowVersionId: string;
    requestedByUserId: string;
    status: string;
    input: { leadId: string };
  }>();
  assert.equal(execution.workflowId, workflow.id);
  assert.equal(execution.workflowVersionId, workflow.currentVersion.id);
  assert.equal(execution.status, "PENDING");
  assert.equal(execution.input.leadId, "lead-1");

  const executionListResponse = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions`,
    headers: bearer(ownerToken)
  });
  assert.equal(executionListResponse.statusCode, 200);
  assert.equal(executionListResponse.json<{ id: string }[]>()[0]?.id, execution.id);

  const executionDetailResponse = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions/${execution.id}`,
    headers: bearer(ownerToken)
  });
  assert.equal(executionDetailResponse.statusCode, 200);
  assert.equal(executionDetailResponse.json<{ id: string }>().id, execution.id);

  const missingExecutionResponse = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions/00000000-0000-0000-0000-000000000000`,
    headers: bearer(ownerToken)
  });
  assert.equal(missingExecutionResponse.statusCode, 404);

  await register("viewer@example.test", "Viewer Example");
  const viewerMember = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/members`,
    headers: bearer(ownerToken),
    payload: {
      email: "viewer@example.test",
      role: "VIEWER"
    }
  });
  assert.equal(viewerMember.statusCode, 201);

  const viewerLogin = await login("viewer@example.test", workspaceId);
  const viewerToken = viewerLogin.json<{ accessToken: string }>().accessToken;
  const forbiddenCreate = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/workflows`,
    headers: bearer(viewerToken),
    payload: {
      name: "Blocked Workflow",
      slug: "blocked-workflow"
    }
  });

  assert.equal(forbiddenCreate.statusCode, 403);

  const viewerExecutionList = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions`,
    headers: bearer(viewerToken)
  });
  assert.equal(viewerExecutionList.statusCode, 200);

  const forbiddenExecution = await app.inject({
    method: "POST",
    url: `/api/workspaces/${workspaceId}/workflows/${workflow.id}/executions`,
    headers: bearer(viewerToken),
    payload: {
      input: {}
    }
  });

  assert.equal(forbiddenExecution.statusCode, 403);
});

test("workspace detail rejects cross-tenant access", async () => {
  await register("owner-a@example.test", "Owner A");
  const ownerALogin = await login("owner-a@example.test");
  const ownerAToken = ownerALogin.json<{ accessToken: string }>().accessToken;
  const workspace = await app.inject({
    method: "POST",
    url: "/api/workspaces",
    headers: bearer(ownerAToken),
    payload: {
      name: "Tenant A",
      slug: "tenant-a"
    }
  });
  const workspaceId = workspace.json<{ id: string }>().id;

  await register("owner-b@example.test", "Owner B");
  const ownerBLogin = await login("owner-b@example.test");
  const ownerBToken = ownerBLogin.json<{ accessToken: string }>().accessToken;

  const response = await app.inject({
    method: "GET",
    url: `/api/workspaces/${workspaceId}`,
    headers: bearer(ownerBToken)
  });

  assert.equal(response.statusCode, 403);
});

async function register(email: string, displayName: string) {
  return app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: {
      email,
      displayName,
      password: "correct horse battery staple"
    }
  });
}

async function login(email: string, workspaceId?: string) {
  return app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email,
      password: "correct horse battery staple",
      workspaceId
    }
  });
}

function bearer(accessToken: string) {
  return {
    authorization: `Bearer ${accessToken}`
  };
}
