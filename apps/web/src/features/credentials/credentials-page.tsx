import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  createCredential,
  deleteCredential,
  listCredentials,
  type CreateCredentialRequest
} from "@/shared/api/credentials";
import { queryKeys } from "@/shared/api/query-keys";
import type { CredentialKind, CredentialType } from "@/shared/api/types";
import { formatDateTime } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const CREDENTIAL_TYPES: Array<{ value: CredentialType; label: string; kind: CredentialKind }> = [
  { value: "openrouter", label: "OpenRouter", kind: "llm" },
  { value: "ollama", label: "Ollama", kind: "llm" },
  { value: "openai", label: "OpenAI", kind: "llm" }
];

export function CredentialsPage() {
  const { workspaceId = "" } = useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCredentialRequest>({
    name: "",
    type: "openrouter",
    kind: "llm",
    value: ""
  });
  const credentialsQuery = useQuery({
    queryKey: queryKeys.credentials(workspaceId),
    queryFn: () => listCredentials(workspaceId),
    enabled: Boolean(workspaceId)
  });
  const canSubmit = useMemo(
    () => form.name.trim().length > 0 && form.value.trim().length > 0,
    [form.name, form.value]
  );
  const createMutation = useMutation({
    mutationFn: () =>
      createCredential(workspaceId, {
        name: form.name.trim(),
        type: form.type,
        kind: getCredentialTypeKind(form.type),
        value: form.value
      }),
    onSuccess: async () => {
      setForm({ name: "", type: "openrouter", kind: "llm", value: "" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.credentials(workspaceId) });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (credentialId: string) => deleteCredential(workspaceId, credentialId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.credentials(workspaceId) });
    }
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Credentials</h1>
        <p className="mt-1 text-sm text-muted-foreground">Integration keys used by workflow nodes.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          {credentialsQuery.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentialsQuery.data?.map((credential) => (
                  <TableRow key={credential.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <KeyRound className="size-4 text-muted-foreground" />
                        {credential.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{credential.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{credential.kind}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-64 flex-wrap gap-1">
                        {credential.capabilities.map((capability) => (
                          <Badge key={capability} variant="outline">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {credential.lastUsedAt ? formatDateTime(credential.lastUsedAt) : "Never"}
                    </TableCell>
                    <TableCell>{formatDateTime(credential.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        aria-label={`Delete ${credential.name}`}
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(credential.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {credentialsQuery.data?.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-sm text-muted-foreground" colSpan={7}>
                      No credentials yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add key</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="credential-type">Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="credential-type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as CredentialType,
                    kind: getCredentialTypeKind(event.target.value as CredentialType)
                  }))
                }
              >
                {CREDENTIAL_TYPES.map((credentialType) => (
                  <option key={credentialType.value} value={credentialType.value}>
                    {credentialType.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credential-name">Name</Label>
              <Input
                id="credential-name"
                maxLength={120}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credential-value">Key</Label>
              <Input
                autoComplete="off"
                id="credential-value"
                type="password"
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
              />
            </div>
            <Button
              disabled={!canSubmit || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Plus />
              Add credential
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function getCredentialTypeKind(type: CredentialType): CredentialKind {
  return CREDENTIAL_TYPES.find((item) => item.value === type)?.kind ?? "llm";
}
