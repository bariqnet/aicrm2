"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { JournalEntryForm } from "@/components/JournalEntryForm";
import { RelationshipJournalTimeline } from "@/components/RelationshipJournalTimeline";
import type { Activity, Note } from "@/lib/crm-types";
import { cn } from "@/lib/utils";

type RelationshipJournalSectionProps = {
  className?: string;
  relatedType: "contact" | "company";
  relatedId: string;
  title: string;
  description: string;
  notes: Note[];
  activities: Activity[];
  emptyText: string;
};

export function RelationshipJournalSection({
  className,
  relatedType,
  relatedId,
  title,
  description: _description,
  notes,
  activities,
  emptyText,
}: RelationshipJournalSectionProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <article className={cn("panel p-4", className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-fg">{title}</h2>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
            {tr("Add new journal", "إضافة سجل جديد")}
          </button>
        </div>

        <RelationshipJournalTimeline notes={notes} activities={activities} emptyText={emptyText} />
      </article>

      {open ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/45 p-2 sm:p-4">
          <div
            className={cn(
              "mx-auto my-0 flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl sm:my-4",
              fullScreen ? "h-full max-w-none" : "h-auto max-h-[92vh] max-w-4xl",
            )}
            role="dialog"
            aria-modal="true"
            aria-label={tr("Add journal entry", "إضافة سجل")}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">
                  {tr("Add relationship journal entry", "إضافة سجل علاقة")}
                </p>
                <p className="text-xs text-mutedfg">
                  {tr(
                    "Capture conversation context, outcomes, and next steps.",
                    "سجّل سياق المحادثة والنتائج والخطوات التالية.",
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn h-8 px-2 text-xs"
                  type="button"
                  onClick={() => setFullScreen((value) => !value)}
                >
                  {fullScreen ? tr("Windowed", "نافذة") : tr("Full screen", "ملء الشاشة")}
                </button>
                <button
                  className="btn h-8 px-2 text-xs"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {tr("Close", "إغلاق")}
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4">
              <JournalEntryForm relatedType={relatedType} relatedId={relatedId} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
