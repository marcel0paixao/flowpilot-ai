import { cn } from "@/shared/lib/utils";

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  return (
    <pre
      className={cn(
        "liquid-field block overflow-x-auto! max-h-full min-w-0 max-w-full rounded-md border border-border bg-muted/60 p-3 text-xs leading-5 text-foreground",
        className
      )}
    >
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}
