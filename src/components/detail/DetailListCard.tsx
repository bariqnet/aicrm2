import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailListCardProps = {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: string;
  emptyText: string;
  hasItems: boolean;
  title: string;
};

export function DetailListCard({
  action,
  children,
  className,
  description,
  emptyText,
  hasItems,
  title,
}: DetailListCardProps) {
  return (
    <article className={cn("panel p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-fg">{title}</h2>
          {description ? <p className="section-description mt-1">{description}</p> : null}
        </div>
        {action}
      </div>

      {hasItems ? (
        <div className="mt-3">{children}</div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm leading-6 text-mutedfg">
          {emptyText}
        </p>
      )}
    </article>
  );
}
