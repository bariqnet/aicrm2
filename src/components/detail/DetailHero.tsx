import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

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
  description,
  fields = [],
  metrics = [],
  title
}: DetailHeroProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref as Route} className="text-sm font-medium text-mutedfg transition hover:text-fg">
          {backLabel}
        </Link>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-black/7 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,255,0.96))] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">{category}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-7 text-black/63 sm:text-base">{description}</p>
            ) : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>

        {metrics.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-black/6 bg-white/85 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42">{metric.label}</p>
                <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-black">{metric.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {fields.length > 0 ? (
          <dl className="mt-6 grid gap-3 border-t border-black/6 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            {fields.map((field) => (
              <div key={field.label} className="rounded-2xl bg-black/[0.025] px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42">{field.label}</dt>
                <dd className="mt-2 text-sm font-medium text-black/78">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>
    </header>
  );
}
