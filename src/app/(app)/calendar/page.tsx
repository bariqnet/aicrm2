"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { listVisits } from "@/lib/visits-client";
import type { Visit } from "@/lib/crm-types";

const WORKSPACE_ID = "ws_default";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

type CalendarCell = {
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
};

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

function statusClasses(status: Visit["status"]): string {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
  }
  if (status === "CANCELLED") {
    return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-600/40 dark:bg-zinc-700/20 dark:text-zinc-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKeyLocal(today));

  const visits = useMemo(() => listVisits(WORKSPACE_ID), []);

  const visitsByDate = useMemo(() => {
    const grouped = new Map<string, Visit[]>();
    for (const visit of visits) {
      const existing = grouped.get(visit.date) ?? [];
      existing.push(visit);
      grouped.set(visit.date, existing);
    }

    for (const [, rows] of grouped) {
      rows.sort((a, b) => a.time.localeCompare(b.time));
    }

    return grouped;
  }, [visits]);

  const cells = useMemo(() => buildCalendarCells(cursor), [cursor]);

  const selectedDate = useMemo(() => parseDateKey(selectedDateKey), [selectedDateKey]);
  const selectedVisits = visitsByDate.get(selectedDateKey) ?? [];

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
      }).format(cursor),
    [cursor]
  );

  const selectedDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(selectedDate),
    [selectedDate]
  );

  const todayKey = toDateKeyLocal(today);

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
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Monthly view of scheduled customer visits.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => moveMonth(-1)} type="button">
            <ChevronLeft size={14} />
            Previous
          </button>
          <button className="btn" onClick={goToToday} type="button">Today</button>
          <button className="btn" onClick={() => moveMonth(1)} type="button">
            Next
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
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const rows = visitsByDate.get(cell.dateKey) ?? [];
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
                      {rows.slice(0, 2).map((visit) => (
                        <div key={visit.id} className="truncate rounded-sm bg-muted px-1.5 py-0.5 text-[11px]">
                          {visit.time} {visit.contactName}
                        </div>
                      ))}
                      {rows.length > 2 ? (
                        <div className="text-[11px] text-mutedfg">+{rows.length - 2} more</div>
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

          {selectedVisits.length === 0 ? (
            <p className="mt-3 text-sm text-mutedfg">No visits scheduled for this date.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {selectedVisits.map((visit) => (
                <article key={visit.id} className="rounded-md border border-border bg-surface2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{visit.contactName}</p>
                      <p className="mt-0.5 text-xs text-mutedfg">{visit.time} • {visit.durationMinutes} min</p>
                    </div>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${statusClasses(visit.status)}`}>
                      {visit.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-mutedfg">{visit.reason}</p>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
