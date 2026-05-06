import type { CurrentUser, Workspace } from "@/shared/api/types";

export const demoUser: CurrentUser = {
  id: "user-owner",
  email: "owner@acme.test",
  displayName: "Acme Owner",
  createdAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-04-01T10:00:00.000Z",
  memberships: [
    {
      role: "OWNER",
      workspace: {
        id: "workspace-acme",
        name: "Acme Operations",
        slug: "acme-operations",
        createdAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z"
      }
    }
  ]
};

export const demoWorkspace: Workspace = {
  id: "workspace-acme",
  name: "Acme Operations",
  slug: "acme-operations",
  createdAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-04-01T10:00:00.000Z",
  members: [
    {
      id: "membership-owner",
      role: "OWNER",
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:00.000Z",
      user: demoUser
    }
  ]
};
