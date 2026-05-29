import { PrismaClient, WorkspaceRole } from "@prisma/client/index";
import { WORKFLOW_NODE_TYPES, type WorkflowDefinition } from "@flowpilot/contracts";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: new URL("../../../.env", import.meta.url), quiet: true });

process.env.DATABASE_URL ??= "postgresql://flowpilot:flowpilot@localhost:5432/flowpilot";

const prisma = new PrismaClient();

const demoPassword = "correct horse battery staple";
const leadEnrichmentDefinition = {
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
        mode: "mock",
        method: "POST",
        url: "https://example.com/api/enrich-lead",
        headers: {
          "content-type": "application/json"
        },
        body: {
          source: "flowpilot-demo"
        },
        timeoutMs: 5000
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
} satisfies WorkflowDefinition;
const demoUsers = [
  {
    email: "owner@acme.test",
    displayName: "Acme Owner",
    role: WorkspaceRole.OWNER
  },
  {
    email: "admin@acme.test",
    displayName: "Acme Admin",
    role: WorkspaceRole.ADMIN
  },
  {
    email: "member@acme.test",
    displayName: "Acme Member",
    role: WorkspaceRole.MEMBER
  },
  {
    email: "viewer@acme.test",
    displayName: "Acme Viewer",
    role: WorkspaceRole.VIEWER
  }
] as const;

async function main() {
  const passwordHash = await hash(demoPassword, 12);
  const workspace = await prisma.workspace.upsert({
    where: {
      slug: "acme-automation"
    },
    create: {
      name: "Acme Automation",
      slug: "acme-automation"
    },
    update: {
      name: "Acme Automation"
    }
  });

  const seededUsers = await Promise.all(
    demoUsers.map(async (demoUser) => {
      const user = await prisma.user.upsert({
        where: {
          email: demoUser.email
        },
        create: {
          email: demoUser.email,
          displayName: demoUser.displayName,
          passwordHash
        },
        update: {
          displayName: demoUser.displayName,
          passwordHash
        }
      });

      const membership = await prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: user.id
          }
        },
        create: {
          workspaceId: workspace.id,
          userId: user.id,
          role: demoUser.role
        },
        update: {
          role: demoUser.role
        }
      });

      return {
        user,
        membership
      };
    })
  );
  const workflow = await prisma.workflow.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "lead-enrichment"
      }
    },
    create: {
      workspaceId: workspace.id,
      name: "Lead Enrichment",
      slug: "lead-enrichment",
      description: "Demo workflow for testing workspace-scoped workflow APIs.",
      versions: {
        create: {
          version: 1,
          definition: leadEnrichmentDefinition
        }
      }
    },
    update: {
      name: "Lead Enrichment",
      description: "Demo workflow for testing workspace-scoped workflow APIs."
    }
  });

  await prisma.workflowVersion.upsert({
    where: {
      workflowId_version: {
        workflowId: workflow.id,
        version: 1
      }
    },
    create: {
      workflowId: workflow.id,
      version: 1,
      definition: leadEnrichmentDefinition
    },
    update: {
      definition: leadEnrichmentDefinition
    }
  });

  console.log("Demo seed completed");
  console.log("");
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`Workspace slug: ${workspace.slug}`);
  console.log(`Workflow: ${workflow.name}`);
  console.log(`Workflow ID: ${workflow.id}`);
  console.log(`Workflow slug: ${workflow.slug}`);
  console.log("");
  console.log("Demo credentials:");

  for (const { user, membership } of seededUsers) {
    console.log(`- ${membership.role}: ${user.email} / ${demoPassword}`);
  }

  console.log("");
  console.log("Example login:");
  console.log(
    `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"owner@acme.test","password":"${demoPassword}","workspaceId":"${workspace.id}"}'`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
