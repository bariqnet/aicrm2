"use client";

import { useI18n } from "@/hooks/useI18n";
import type { Activity, Note } from "@/lib/crm-types";
import { buildRelationshipTimeline } from "@/lib/journal";

type RelationshipJournalTimelineProps = {
  notes: Note[];
  activities: Activity[];
  emptyText?: string;
};

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function sourceBadge(source: "journal" | "note" | "activity", language: "en" | "ar"): { label: string; className: string } {
  if (source === "journal") {
    return {
      label: language === "ar" ? "سجل" : "Journal",
      className: "bg-accent/10 text-accent"
    };
  }

  if (source === "activity") {
    return {
      label: language === "ar" ? "نشاط" : "Activity",
      className: "bg-muted text-fg"
    };
  }

  return {
    label: language === "ar" ? "ملاحظة" : "Note",
    className: "bg-surface text-mutedfg"
  };
}

export function RelationshipJournalTimeline({
  notes,
  activities,
  emptyText
}: RelationshipJournalTimelineProps) {
  const { language } = useI18n();
  const locale = language === "ar" ? "ar-IQ" : "en-US";
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const timeline = buildRelationshipTimeline(notes, activities);

  if (timeline.length === 0) {
    return <p className="mt-3 text-sm text-mutedfg">{emptyText ?? tr("No relationship updates yet.", "لا توجد تحديثات علاقة بعد.")}</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {timeline.map((item) => {
        const badge = sourceBadge(item.source, language);
        return (
          <li key={item.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>
                {badge.label}
              </span>
              <p className="text-xs text-mutedfg">{fmtDateTime(item.occurredAt, locale)}</p>
            </div>

            <p className="mt-2 font-medium">{item.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-mutedfg">{item.summary}</p>
            {item.details ? (
              <p className="mt-1 whitespace-pre-wrap text-xs text-mutedfg">{item.details}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
