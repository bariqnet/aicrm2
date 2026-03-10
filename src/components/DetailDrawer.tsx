"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { listActivitiesApi, listTasksApi } from "@/lib/api";
import { Badge } from "@/components/Badge";
import type { Activity, Task } from "@/lib/crm-types";
import { Timeline } from "@/components/Timeline";
import { useUIStore } from "@/store/ui-store";

export function DetailDrawer() {
  const { drawer, openDrawer } = useUIStore();
  const { t } = useI18n();
  const [tab, setTab] = useState<"overview" | "timeline" | "tasks">("overview");
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!drawer) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        openDrawer(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawer, openDrawer]);

  useEffect(() => {
    if (!drawer) return;
    let cancelled = false;

    listActivitiesApi()
      .then((data) => {
        if (cancelled) return;
        setTimeline(
          data.rows.filter(
            (activity) => activity.entityType === drawer.type && activity.entityId === drawer.id,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setTimeline([]);
      });

    listTasksApi()
      .then((data) => {
        if (cancelled) return;
        setTasks(
          data.rows.filter(
            (task) => task.relatedType === drawer.type && task.relatedId === drawer.id,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });

    return () => {
      cancelled = true;
    };
  }, [drawer]);

  if (!drawer) return null;
  const typeLabel = t(`detail.type.${drawer.type}`);
  const fullHref = `/${
    drawer.type === "deal"
      ? "deals"
      : drawer.type === "task"
        ? "tasks"
        : drawer.type === "company"
          ? "companies"
          : "contacts"
  }/${drawer.id}`;

  return (
    <div
      className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] dark:bg-black/50"
      onClick={() => openDrawer(null)}
    >
      <aside
        className="absolute right-0 top-0 h-screen w-full max-w-[420px] border-l border-border bg-surface p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-black/95 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Badge tone="info">{typeLabel}</Badge>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-fg">
                {t("detail.title", { type: typeLabel })}
              </h2>
              <p className="mt-1 text-sm text-mutedfg">{drawer.id}</p>
            </div>
            <button className="btn h-9" onClick={() => openDrawer(null)}>
              {t("detail.close")}
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-border/85 bg-surface2/70 px-3 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedfg">
                {typeLabel}
              </p>
              <p className="mt-1 text-sm text-mutedfg">{t("detail.overviewHint")}</p>
            </div>
            <Link href={fullHref as Route} onClick={() => openDrawer(null)} className="btn">
              {t("detail.openRecord")}
            </Link>
          </div>

          <div className="mb-4 flex gap-2 text-sm">
            {(["overview", "timeline", "tasks"] as const).map((tabName) => (
              <button
                key={tabName}
                type="button"
                onClick={() => setTab(tabName)}
                className={
                  tab === tabName
                    ? "btn border-border/90 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
                    : "btn btn-ghost text-mutedfg hover:text-fg dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                }
              >
                {tabName === "overview"
                  ? t("detail.tab.overview")
                  : tabName === "timeline"
                    ? t("detail.tab.timeline")
                    : t("detail.tab.tasks")}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "overview" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                      {t("detail.tab.timeline")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                      {timeline.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                      {t("detail.tab.tasks")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                      {tasks.length}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-4 text-sm leading-7 text-mutedfg">
                  {t("detail.overviewHint")}
                </div>
              </div>
            ) : null}
            {tab === "timeline" ? <Timeline activities={timeline} /> : null}
            {tab === "tasks" ? (
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                    {t("command.empty")}
                  </p>
                ) : (
                  tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      onClick={() => openDrawer(null)}
                      className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 text-sm transition hover:border-fg/12 hover:bg-surface"
                    >
                      <p className="font-medium text-fg">{task.title}</p>
                      <p className="mt-1 text-xs text-mutedfg">
                        {t("detail.type.task")} · {task.id}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
