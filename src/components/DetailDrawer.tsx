"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { listActivitiesApi, listTasksApi } from "@/lib/api";
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
    let cancelled = false;

    listActivitiesApi()
      .then((data) => {
        if (cancelled) return;
        setTimeline(
          data.rows.filter(
            (activity) => activity.entityType === drawer.type && activity.entityId === drawer.id
          )
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
            (task) => task.relatedType === drawer.type && task.relatedId === drawer.id
          )
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

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-full max-w-md border-l border-border bg-surface p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{t("detail.title", { type: typeLabel })}</h2>
        <button className="btn" onClick={() => openDrawer(null)}>{t("detail.close")}</button>
      </div>
      <div className="mb-3 flex gap-2 text-sm">
        {(["overview", "timeline", "tasks"] as const).map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`btn ${tab === tabName ? "bg-muted text-fg" : ""}`}
          >
            {tabName === "overview"
              ? t("detail.tab.overview")
              : tabName === "timeline"
                ? t("detail.tab.timeline")
                : t("detail.tab.tasks")}
          </button>
        ))}
      </div>
      {tab === "overview" && <p className="text-sm text-mutedfg">{t("detail.overviewHint")}</p>}
      {tab === "timeline" && <Timeline activities={timeline} />}
      {tab === "tasks" && (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-md border border-border bg-surface2 p-2 text-sm">
              {t.title}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
