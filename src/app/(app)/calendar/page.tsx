"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Task, Visit } from "@/lib/crm-types";
import { showErrorAlert } from "@/lib/sweet-alert";

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type CalendarCell = {
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
};

type VisitEntry = {
  id: string;
  kind: "visit";
  dateKey: string;
  sortMinutes: number;
  title: string;
  timeLabel: string;
  detail: string;
  status: Visit["status"];
};

type TaskEntry = {
  id: string;
  kind: "task";
  dateKey: string;
  sortMinutes: number;
  title: string;
  timeLabel: string;
  detail: string;
  status: Task["status"];
};

type CalendarEntry = VisitEntry | TaskEntry;

function toDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function parseMinutesFromTime(time: string): number {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 24 * 60;
  return Math.max(0, Math.min(23, hour)) * 60 + Math.max(0, Math.min(59, minute));
}

function buildCalendarCells(cursor: Date): CalendarCell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < leadingDays; i += 1) {
    const date = new Date(year, month, i - leadingDays + 1);
    cells.push({
      dateKey: toDateKeyLocal(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: false
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      dateKey: toDateKeyLocal(date),
      dayOfMonth: day,
      isCurrentMonth: true
    });
  }

  const trailingDays = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trailingDays; i += 1) {
    const date = new Date(year, month + 1, i);
    cells.push({
      dateKey: toDateKeyLocal(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: false
    });
  }

  return cells;
}

function visitStatusClasses(status: Visit["status"]): string {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
  }
  if (status === "CANCELLED") {
    return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-600/40 dark:bg-zinc-700/20 dark:text-zinc-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
}

function taskStatusClasses(status: Task["status"]): string {
  if (status === "DONE") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
}

function visitStatusLabel(status: Visit["status"], tr: (english: string, arabic: string) => string): string {
  if (status === "COMPLETED") return tr("Completed", "مكتملة");
  if (status === "CANCELLED") return tr("Cancelled", "ملغاة");
  return tr("Scheduled", "مجدولة");
}

function taskStatusLabel(status: Task["status"], tr: (english: string, arabic: string) => string): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

function relatedTypeLabel(type: Task["relatedType"], tr: (english: string, arabic: string) => string): string {
  if (type === "contact") return tr("Contact", "جهة اتصال");
  if (type === "company") return tr("Company", "شركة");
  if (type === "deal") return tr("Deal", "صفقة");
  return tr("Task", "مهمة");
}

export default function CalendarPage() {
  const { language } = useI18n();
  const locale = language === "ar" ? "ar-IQ" : "en-US";
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKeyLocal(today));
  const [visits, setVisits] = useState<Visit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function loadCalendarData() {
      const [visitsResult, tasksResult] = await Promise.allSettled([
        fetch("/api/visits", { cache: "no-store" }),
        fetch("/api/tasks", { cache: "no-store" })
      ]);

      let visitsError: string | null = null;
      let tasksError: string | null = null;

      if (visitsResult.status === "fulfilled") {
        const payload = (await visitsResult.value.json().catch(() => null)) as
          | { rows?: Visit[]; error?: string }
          | null;
        if (visitsResult.value.ok) {
          setVisits(payload?.rows ?? []);
        } else {
          visitsError = payload?.error ?? tr("Unable to load visits", "تعذر تحميل الزيارات");
        }
      } else {
        visitsError = tr("Unable to load visits", "تعذر تحميل الزيارات");
      }

      if (tasksResult.status === "fulfilled") {
        const payload = (await tasksResult.value.json().catch(() => null)) as
          | { rows?: Task[]; error?: string }
          | null;
        if (tasksResult.value.ok) {
          setTasks(payload?.rows ?? []);
        } else {
          tasksError = payload?.error ?? tr("Unable to load tasks", "تعذر تحميل المهام");
        }
      } else {
        tasksError = tr("Unable to load tasks", "تعذر تحميل المهام");
      }

      if (visitsError || tasksError) {
        const message = [visitsError, tasksError].filter(Boolean).join(" • ");
        await showErrorAlert(tr("Calendar load failed", "فشل تحميل التقويم"), message);
      }
    }

    loadCalendarData().catch(() => {
      // handled above
    });
  }, [language]);

  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEntry[]>();

    for (const visit of visits) {
      const entry: VisitEntry = {
        id: visit.id,
        kind: "visit",
        dateKey: visit.date,
        sortMinutes: parseMinutesFromTime(visit.time),
        title: visit.contactName,
        timeLabel: visit.time,
        detail: `${visit.durationMinutes} ${tr("min", "د") } • ${visit.reason}`,
        status: visit.status
      };
      const rows = grouped.get(entry.dateKey) ?? [];
      rows.push(entry);
      grouped.set(entry.dateKey, rows);
    }

    for (const task of tasks) {
      if (!task.dueAt) continue;
      const dueDate = new Date(task.dueAt);
      if (Number.isNaN(dueDate.getTime())) continue;
      const dateKey = toDateKeyLocal(dueDate);
      const hasExplicitTime = !(dueDate.getHours() === 0 && dueDate.getMinutes() === 0);
      const entry: TaskEntry = {
        id: task.id,
        kind: "task",
        dateKey,
        sortMinutes: hasExplicitTime ? dueDate.getHours() * 60 + dueDate.getMinutes() : 24 * 60 + 1,
        title: task.title,
        timeLabel: hasExplicitTime
          ? dueDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
          : tr("Due", "استحقاق"),
        detail: `${relatedTypeLabel(task.relatedType, tr)} • ${taskStatusLabel(task.status, tr)}`,
        status: task.status
      };
      const rows = grouped.get(entry.dateKey) ?? [];
      rows.push(entry);
      grouped.set(entry.dateKey, rows);
    }

    for (const [, rows] of grouped) {
      rows.sort((a, b) => a.sortMinutes - b.sortMinutes);
    }

    return grouped;
  }, [visits, tasks, language]);

  const tasksWithoutDueDate = useMemo(
    () => tasks.filter((task) => !task.dueAt),
    [tasks]
  );

  const cells = useMemo(() => buildCalendarCells(cursor), [cursor]);
  const selectedDate = useMemo(() => parseDateKey(selectedDateKey), [selectedDateKey]);
  const selectedEntries = entriesByDate.get(selectedDateKey) ?? [];

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric"
      }).format(cursor),
    [cursor, locale]
  );

  const selectedDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(selectedDate),
    [selectedDate, locale]
  );

  const todayKey = toDateKeyLocal(today);
  const weekdays = language === "ar" ? WEEKDAYS_AR : WEEKDAYS_EN;

  function moveMonth(direction: -1 | 1) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function goToToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(todayKey);
  }

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{tr("Calendar", "التقويم")}</h1>
          <p className="page-subtitle">{tr("Monthly view of visits and task due dates.", "عرض شهري للزيارات وتواريخ استحقاق المهام.")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => moveMonth(-1)} type="button">
            <ChevronLeft size={14} />
            {tr("Previous", "السابق")}
          </button>
          <button className="btn" onClick={goToToday} type="button">{tr("Today", "اليوم")}</button>
          <button className="btn" onClick={() => moveMonth(1)} type="button">
            {tr("Next", "التالي")}
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">{monthLabel}</h2>
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-surface2 text-xs uppercase tracking-[0.08em] text-mutedfg">
            {weekdays.map((day) => (
              <div key={day} className="px-2 py-2 text-center">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const rows = entriesByDate.get(cell.dateKey) ?? [];
              const isToday = cell.dateKey === todayKey;
              const isSelected = cell.dateKey === selectedDateKey;

              return (
                <button
                  key={cell.dateKey}
                  className={[
                    "min-h-24 border-b border-r border-border px-2 py-2 text-left align-top transition",
                    "last:border-r-0 hover:bg-muted/45",
                    !cell.isCurrentMonth ? "bg-surface2/45 text-mutedfg" : "bg-surface",
                    isSelected ? "bg-muted" : "",
                    isToday ? "outline outline-1 outline-accent/45" : ""
                  ].join(" ")}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span className={isToday ? "font-semibold text-accent" : "text-sm"}>{cell.dayOfMonth}</span>
                    {rows.length > 0 ? (
                      <span className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 text-[11px] text-mutedfg">
                        {rows.length}
                      </span>
                    ) : null}
                  </div>

                  {rows.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {rows.slice(0, 2).map((row) => (
                        <div key={`${row.kind}-${row.id}`} className="truncate rounded-sm bg-muted px-1.5 py-0.5 text-[11px]">
                          {row.kind === "visit" ? tr("Visit", "زيارة") : tr("Task", "مهمة")}: {row.timeLabel} {row.title}
                        </div>
                      ))}
                      {rows.length > 2 ? (
                        <div className="text-[11px] text-mutedfg">+{rows.length - 2} {tr("more", "أكثر")}</div>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel p-4">
          <h2 className="text-sm font-semibold">{selectedDateLabel}</h2>

          {selectedEntries.length === 0 ? (
            <p className="mt-3 text-sm text-mutedfg">{tr("No tasks or visits scheduled for this date.", "لا توجد مهام أو زيارات مجدولة لهذا التاريخ.")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {selectedEntries.map((entry) => (
                <article key={`${entry.kind}-${entry.id}`} className="rounded-md border border-border bg-surface2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="mt-0.5 text-xs text-mutedfg">
                        {entry.kind === "visit" ? tr("Visit", "زيارة") : tr("Task", "مهمة")} • {entry.timeLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                        entry.kind === "visit"
                          ? visitStatusClasses(entry.status)
                          : taskStatusClasses(entry.status)
                      }`}
                    >
                      {entry.kind === "visit"
                        ? visitStatusLabel(entry.status, tr)
                        : taskStatusLabel(entry.status, tr)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-mutedfg">{entry.detail}</p>
                  {entry.kind === "task" ? (
                    <Link href={`/tasks/${entry.id}`} className="mt-2 inline-flex text-xs text-accent hover:underline">
                      {tr("Open task", "فتح المهمة")}
                    </Link>
                  ) : (
                    <Link href="/visits" className="mt-2 inline-flex text-xs text-accent hover:underline">
                      {tr("Open visits", "فتح الزيارات")}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}

          {tasksWithoutDueDate.length > 0 ? (
            <section className="mt-5 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-mutedfg">
                {tr("Tasks without due date", "مهام بدون تاريخ استحقاق")} ({tasksWithoutDueDate.length})
              </h3>
              <div className="mt-2 space-y-1.5">
                {tasksWithoutDueDate.slice(0, 8).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-md border border-border bg-surface px-2 py-1.5 text-xs hover:bg-muted/45"
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
