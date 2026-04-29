import { PrismaClient, WorkspaceRole } from "@prisma/client/index";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: new URL("../../../.env", import.meta.url), quiet: true });

process.env.DATABASE_URL ??= "postgresql://flowpilot:flowpilot@localhost:5432/flowpilot";

const prisma = new PrismaClient();

const demoPassword = "correct horse battery staple";
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

  console.log("Demo seed completed");
  console.log("");
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`Workspace slug: ${workspace.slug}`);
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
