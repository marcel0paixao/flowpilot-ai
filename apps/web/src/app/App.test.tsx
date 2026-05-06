import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { App } from "@/app/App";
import { demoUser, demoWorkspace } from "@/test/fixtures";
import { server } from "@/test/server";

const API_BASE_URL = "http://localhost:3000/api";

describe("App authentication flow", () => {
  it("redirects protected routes to login when there is no session", async () => {
    window.history.replaceState({}, "", "/app/workspaces");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "FlowPilot AI" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("signs in and loads the authenticated workspaces route", async () => {
    const user = userEvent.setup();
    const requests: Array<{ path: string; authorization: string | null }> = [];

    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        requests.push({
          path: new URL(request.url).pathname,
          authorization: request.headers.get("authorization")
        });

        await expect(request.json()).resolves.toMatchObject({
          email: "owner@acme.test",
          password: "correct horse battery staple"
        });

        return HttpResponse.json({
          accessToken: "test-access-token",
          user: {
            id: demoUser.id,
            email: demoUser.email,
            displayName: demoUser.displayName
          },
          workspace: null
        });
      }),
      http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
        requests.push({
          path: new URL(request.url).pathname,
          authorization: request.headers.get("authorization")
        });

        return HttpResponse.json({ user: demoUser });
      }),
      http.get(`${API_BASE_URL}/workspaces`, ({ request }) => {
        requests.push({
          path: new URL(request.url).pathname,
          authorization: request.headers.get("authorization")
        });

        return HttpResponse.json([demoWorkspace]);
      })
    );

    window.history.replaceState({}, "", "/login");
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Workspaces" })).toBeInTheDocument();
    expect(await screen.findByText("Acme Operations")).toBeInTheDocument();
    expect(window.localStorage.getItem("flowpilot.accessToken")).toBe("test-access-token");

    await waitFor(() => {
      expect(requests).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "/api/auth/login", authorization: null }),
          expect.objectContaining({ path: "/api/auth/me", authorization: "Bearer test-access-token" }),
          expect.objectContaining({ path: "/api/workspaces", authorization: "Bearer test-access-token" })
        ])
      );
    });
  });
});

describe("Workspaces route", () => {
  it("renders workspaces from the API for an authenticated user", async () => {
    server.use(
      http.get(`${API_BASE_URL}/auth/me`, () => HttpResponse.json({ user: demoUser })),
      http.get(`${API_BASE_URL}/workspaces`, () => HttpResponse.json([demoWorkspace]))
    );

    window.localStorage.setItem("flowpilot.accessToken", "existing-token");
    window.history.replaceState({}, "", "/app/workspaces");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Workspaces" })).toBeInTheDocument();
    expect(await screen.findByText("Acme Operations")).toBeInTheDocument();
    expect(screen.getByText("acme-operations")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New workspace" })).toBeInTheDocument();
  });
});
