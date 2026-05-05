import { cn } from "@/shared/lib/utils";

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  return (
    <pre
      className={cn(
        "max-h-72 overflow-auto rounded-md border border-border bg-muted/60 p-3 text-xs leading-5 text-foreground",
        className
      )}
    >
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}
