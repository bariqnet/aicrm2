"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { encodeJournalEntry, JOURNAL_INTERACTION_TYPES, type JournalInteractionType } from "@/lib/journal";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";

type JournalEntryFormProps = {
  relatedType: "contact" | "company";
  relatedId: string;
};

function toDueIso(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T09:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toLabel(value: JournalInteractionType): string {
  return value[0].toUpperCase() + value.slice(1);
}

export function JournalEntryForm({ relatedType, relatedId }: JournalEntryFormProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const [interactionType, setInteractionType] = useState<JournalInteractionType>("call");
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const trimmedSubject = subject.trim();
    const trimmedSummary = summary.trim();
    const trimmedDetails = details.trim();
    const trimmedNextAction = nextAction.trim();

    if (!trimmedSubject || !trimmedSummary) {
      await showErrorAlert(tr("Missing fields", "حقول ناقصة"), tr("Subject and summary are required.", "الموضوع والملخص مطلوبان."));
      return;
    }

    setSaving(true);

    try {
      const noteResponse = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: encodeJournalEntry({
            interactionType,
            subject: trimmedSubject,
            summary: trimmedSummary,
            details: trimmedDetails || undefined,
            nextAction: trimmedNextAction || undefined
          }),
          relatedType,
          relatedId
        })
      });

      if (!noteResponse.ok) {
        throw new Error(await getResponseError(noteResponse, tr("Unable to save journal entry", "تعذر حفظ السجل")));
      }

      let followUpError: string | null = null;
      if (trimmedNextAction) {
        const taskResponse = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedNextAction,
            relatedType,
            relatedId,
            dueAt: toDueIso(dueDate)
          })
        });

        if (!taskResponse.ok) {
          followUpError = await getResponseError(taskResponse, tr("Unable to create follow-up task", "تعذر إنشاء مهمة متابعة"));
        }
      }

      setInteractionType("call");
      setSubject("");
      setSummary("");
      setDetails("");
      setNextAction("");
      setDueDate("");
      if (followUpError) {
        await showErrorAlert(tr("Journal saved, follow-up task failed", "تم حفظ السجل لكن فشل إنشاء مهمة المتابعة"), followUpError);
      } else {
        await showSuccessAlert(trimmedNextAction ? tr("Journal and follow-up saved", "تم حفظ السجل والمتابعة") : tr("Journal entry saved", "تم حفظ السجل"));
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to save journal entry", "تعذر حفظ السجل");
      await showErrorAlert(tr("Unable to save journal entry", "تعذر حفظ السجل"), message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-surface2 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="muted-label">{tr("Interaction", "نوع التفاعل")}</span>
          <select
            className="input w-full"
            value={interactionType}
            onChange={(event) => setInteractionType(event.target.value as JournalInteractionType)}
          >
            {JOURNAL_INTERACTION_TYPES.map((value) => (
              <option key={value} value={value}>
                {toLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="muted-label">{tr("Subject", "الموضوع")}</span>
          <input
            className="input w-full"
            placeholder={tr("Renewal call, pricing discussion, onboarding check...", "مكالمة تجديد، نقاش تسعير، متابعة تهيئة...")}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="muted-label">{tr("Summary", "الملخص")}</span>
        <textarea
          className="input h-auto min-h-24 w-full resize-y py-2"
          placeholder={tr("What happened and what matters from this interaction?", "ماذا حدث وما المهم في هذا التفاعل؟")}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </label>

      <label className="space-y-1">
        <span className="muted-label">{tr("Details (optional)", "تفاصيل (اختياري)")}</span>
        <textarea
          className="input h-auto min-h-20 w-full resize-y py-2"
          placeholder={tr("Extra context, blockers, personal notes, decision history...", "سياق إضافي، عوائق، ملاحظات شخصية، تاريخ القرار...")}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
        <label className="space-y-1">
          <span className="muted-label">{tr("Next action (optional)", "الإجراء التالي (اختياري)")}</span>
          <input
            className="input w-full"
            placeholder={tr("Send proposal, book next call, update contract...", "إرسال عرض، حجز مكالمة قادمة، تحديث العقد...")}
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="muted-label">{tr("Due date", "تاريخ الاستحقاق")}</span>
          <input
            type="date"
            className="input w-full"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? tr("Saving...", "جاري الحفظ...") : tr("Save journal entry", "حفظ السجل")}
        </button>
      </div>
    </form>
  );
}
