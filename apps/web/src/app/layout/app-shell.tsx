import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Workflow
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-provider";
import { listWorkspaces } from "@/shared/api/workspaces";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/shared/ui/dropdown-menu";
import { Separator } from "@/shared/ui/separator";

export function AppShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  const workspacesQuery = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: listWorkspaces
  });

  const currentWorkspace = workspacesQuery.data?.find((workspace) => workspace.id === workspaceId);
  const workspaceBasePath = currentWorkspace ? `/app/workspaces/${currentWorkspace.id}` : "/app/workspaces";
  const userInitials = getInitials(auth.user?.displayName ?? auth.user?.email ?? "FP");

  function signOut() {
    auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <Link className="flex h-16 items-center gap-3 px-5" to="/app/workspaces">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">FlowPilot AI</p>
            <p className="mt-1 text-xs text-muted-foreground">Workflow ops</p>
          </div>
        </Link>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          <SidebarLink icon={LayoutDashboard} to="/app/workspaces" label="Workspaces" />
          <SidebarLink
            icon={Workflow}
            to={`${workspaceBasePath}/workflows`}
            label="Workflows"
            disabled={!currentWorkspace}
          />
          <SidebarLink
            icon={Clock3}
            to={`${workspaceBasePath}/executions`}
            label="Executions"
            disabled={!currentWorkspace}
          />
          <SidebarLink
            icon={Users}
            to={`${workspaceBasePath}/members`}
            label="Members"
            disabled={!currentWorkspace}
          />
          <SidebarLink
            icon={Settings}
            to={`${workspaceBasePath}/settings`}
            label="Settings"
            disabled={!currentWorkspace}
          />
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{getBreadcrumb(location.pathname)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {currentWorkspace?.name ?? "Workspace overview"}
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="max-w-52 justify-between" variant="outline">
                  <span className="truncate">{currentWorkspace?.name ?? "Workspaces"}</span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspacesQuery.data?.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => navigate(`/app/workspaces/${workspace.id}/workflows`)}
                  >
                    <span className="truncate">{workspace.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/workspaces")}>All workspaces</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Open user menu" size="icon" variant="ghost">
                  <Avatar>
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="block truncate">{auth.user?.displayName ?? "FlowPilot User"}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {auth.user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  icon: Icon,
  to,
  label,
  disabled
}: {
  icon: typeof LayoutDashboard;
  to: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground opacity-60">
        <Icon className="size-4" />
        {label}
      </span>
    );
  }

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )
      }
      to={to}
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  );
}

function getBreadcrumb(pathname: string) {
  if (pathname.includes("/executions/")) {
    return "Execution Detail";
  }

  if (pathname.includes("/workflows/")) {
    return "Workflow Detail";
  }

  if (pathname.endsWith("/workflows")) {
    return "Workflows";
  }

  if (pathname.endsWith("/executions")) {
    return "Executions";
  }

  if (pathname.endsWith("/members")) {
    return "Members";
  }

  if (pathname.endsWith("/settings")) {
    return "Settings";
  }

  return "Workspaces";
}

function getInitials(value: string) {
  return value
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
