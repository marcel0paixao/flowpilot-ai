import { cn } from "@/shared/lib/utils";

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  return (
    <pre
      className={cn(
        "liquid-field block max-h-[28rem] min-w-0 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/60 p-3 text-xs leading-5 text-foreground",
        className
      )}
    >
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}
