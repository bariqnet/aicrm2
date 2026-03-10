import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
};

type MetricCardProps = {
  hint?: ReactNode;
  label: ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  value: ReactNode;
};

type SectionPanelProps = {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
};

type KeyValueGridProps = {
  className?: string;
  items: Array<{
    label: ReactNode;
    value: ReactNode;
  }>;
};

export function PageHeader({ actions, description, eyebrow, meta, title }: PageHeaderProps) {
  return (
    <header className="border-b border-border/70 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow || meta ? (
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {eyebrow ? <div className="muted-label">{eyebrow}</div> : null}
              {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
            </div>
          ) : null}
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-subtitle">{description}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
    </header>
  );
}

export function MetricGrid({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </section>
  );
}

export function MetricCard({ hint, label, tone = "default", value }: MetricCardProps) {
  return (
    <article
      className={cn(
        "metric-card flex items-start justify-between gap-3",
        tone === "accent" && "metric-card-accent",
        tone === "success" && "metric-card-success",
        tone === "warning" && "metric-card-warning",
        tone === "danger" && "metric-card-danger",
      )}
    >
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        {hint ? <p className="metric-hint">{hint}</p> : null}
      </div>
      <div className="metric-value shrink-0 text-right">{value}</div>
    </article>
  );
}

export function SectionPanel({
  action,
  children,
  className,
  description,
  title,
}: SectionPanelProps) {
  return (
    <section className={cn("panel p-4", className)}>
      {title || description || action ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div>
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="section-description mt-1">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function KeyValueGrid({ className, items }: KeyValueGridProps) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div
          key={String(item.label)}
          className="rounded-2xl border border-border/80 bg-surface2/78 px-4 py-3"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm font-medium text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
