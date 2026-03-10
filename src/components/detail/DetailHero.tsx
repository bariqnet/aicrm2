import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailMetric = {
  label: string;
  value: ReactNode;
};

type DetailField = {
  label: string;
  value: ReactNode;
};

type DetailHeroProps = {
  actions?: ReactNode;
  backHref: string;
  backLabel: string;
  badge?: ReactNode;
  category: string;
  description?: string;
  fields?: DetailField[];
  metrics?: DetailMetric[];
  title: string;
};

export function DetailHero({
  actions,
  backHref,
  backLabel,
  badge,
  category,
  description: _description,
  fields = [],
  metrics = [],
  title,
}: DetailHeroProps) {
  const detailItems = [
    ...metrics.map((metric) => ({ label: metric.label, value: metric.value })),
    ...fields.map((field) => ({ label: field.label, value: field.value })),
  ];

  return (
    <header className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref as Route}
          className="inline-flex items-center gap-2 text-sm font-medium text-mutedfg transition hover:text-fg"
        >
          {backLabel}
        </Link>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-3 border-t border-border/70 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="muted-label">{category}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="page-title">{title}</h1>
              {badge ? <div className="shrink-0">{badge}</div> : null}
            </div>
          </div>
        </div>

        {detailItems.length > 0 ? (
          <dl
            className={cn(
              "mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4",
              detailItems.length <= 2 && "xl:grid-cols-2",
            )}
          >
            {detailItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="rounded-2xl border border-border/80 bg-surface2/72 px-3 py-2.5"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-fg">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </header>
  );
}
