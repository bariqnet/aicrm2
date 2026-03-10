import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export function Badge({
  className,
  children,
  tone = "neutral",
}: React.PropsWithChildren<{ className?: string; tone?: BadgeTone }>) {
  return (
    <span
      className={cn(
        "badge",
        tone === "neutral" && "badge-neutral",
        tone === "info" && "badge-info",
        tone === "success" && "badge-success",
        tone === "warning" && "badge-warning",
        tone === "danger" && "badge-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}
