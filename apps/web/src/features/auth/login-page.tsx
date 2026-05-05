import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/features/auth/auth-provider";
import { login } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const DEMO_WORKSPACE_ID = "5197de4a-7a9a-4795-b455-e4ab877aba9b";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  workspaceId: z.string().uuid().optional().or(z.literal(""))
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "owner@acme.test",
      password: "correct horse battery staple",
      workspaceId: DEMO_WORKSPACE_ID
    }
  });

  if (auth.isAuthenticated) {
    return <Navigate to="/app/workspaces" replace />;
  }

  const error = form.formState.errors.root?.message;
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  async function onSubmit(values: LoginForm) {
    form.clearErrors("root");

    try {
      const response = await login({
        email: values.email,
        password: values.password,
        workspaceId: values.workspaceId || undefined
      });
      auth.signIn(response.accessToken);
      navigate(response.workspace ? `/app/workspaces/${response.workspace.id}/workflows` : fromPath ?? "/app/workspaces", {
        replace: true
      });
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof ApiError ? submitError.message : "Login failed"
      });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </div>
          <CardTitle className="text-xl">FlowPilot AI</CardTitle>
          <CardDescription>Sign in to your workflow workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceId">Workspace</Label>
              <Input id="workspaceId" {...form.register("workspaceId")} />
              {form.formState.errors.workspaceId ? (
                <p className="text-xs text-destructive">{form.formState.errors.workspaceId.message}</p>
              ) : null}
            </div>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
