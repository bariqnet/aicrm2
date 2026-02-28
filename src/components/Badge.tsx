import { cn } from "@/lib/utils";

export function Badge({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-surface2 px-2 py-0.5 text-xs font-medium text-fg",
        className
      )}
    >
      {children}
    </span>
  );
}
