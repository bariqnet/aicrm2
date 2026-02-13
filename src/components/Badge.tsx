import { cn } from "@/lib/utils";

export function Badge({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={cn("rounded-full bg-muted px-2 py-0.5 text-xs", className)}>{children}</span>;
}
