import { Badge } from "@/components/Badge";
import { cn } from "@/lib/utils";

type FilterChip = {
  active?: boolean;
  count?: number;
  key: string;
  label: string;
  onClick?: () => void;
};

export function FilterChips({ chips, className }: { chips: FilterChip[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClick}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition",
            chip.active
              ? "border-border/90 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
              : "border-border bg-surface text-mutedfg hover:border-fg/12 hover:bg-surface2 hover:text-fg dark:border-white/8 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white",
          )}
        >
          <span>{chip.label}</span>
          {typeof chip.count === "number" ? (
            <Badge
              tone={chip.active ? "neutral" : "info"}
              className={cn(
                "border-0 px-2 py-0.5",
                chip.active
                  ? "bg-bg text-fg dark:bg-black/40 dark:text-white"
                  : "bg-surface2 text-fg dark:bg-white/[0.08] dark:text-zinc-200",
              )}
            >
              {chip.count}
            </Badge>
          ) : null}
        </button>
      ))}
    </div>
  );
}
