"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type {
  RelationshipIntelligenceRequest,
  RelationshipIntelligenceResponse
} from "@/lib/ai-types";
import type { Activity, Deal, Invoice, Note, Task } from "@/lib/crm-types";
import type { UserSummary } from "@/lib/users";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";
import { decodeJournalEntry } from "@/lib/journal";

type RelationshipIntelligencePanelProps = {
  entityType: "contact" | "company";
  entityId: string;
  entityName: string;
  notes: Note[];
  activities: Activity[];
  tasks: Task[];
  deals: Deal[];
  invoices: Invoice[];
};

function limitText(value: string, max = 280): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function normalizeNoteBody(body: string): string {
  const parsed = decodeJournalEntry(body);
  if (!parsed) return body.replace(/\s+/g, " ").trim();

  const parts = [
    `${parsed.interactionType.toUpperCase()} · ${parsed.subject}`,
    parsed.summary,
    parsed.nextAction ? `Next action: ${parsed.nextAction}` : ""
  ].filter(Boolean);

  return parts.join(" | ");
}

function compactMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const entries = Object.entries(metadata).slice(0, 3);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function priorityClass(priority: string): string {
  if (priority === "high") return "bg-red-100 text-red-700";
  if (priority === "low") return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

function toDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dueDateInputForPriority(priority: string): string {
  const days = priority === "high" ? 1 : priority === "low" ? 7 : 3;
  const due = new Date();
  due.setDate(due.getDate() + days);
  return toDateInputValue(due);
}

function dueIsoFromInput(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T10:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

type ActionDraft = {
  title: string;
  assigneeId: string;
  dueDate: string;
};

function userLabel(user: UserSummary): string {
  const name = user.name?.trim();
  if (name) return `${name} (${user.email})`;
  return user.email;
}

export function RelationshipIntelligencePanel({
  entityType,
  entityId,
  entityName,
  notes,
  activities,
  tasks,
  deals,
  invoices
}: RelationshipIntelligencePanelProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RelationshipIntelligenceResponse | null>(null);
  const [creatingActionIndex, setCreatingActionIndex] = useState<number | null>(null);
  const [creatingAll, setCreatingAll] = useState(false);
  const [createdActionIndexes, setCreatedActionIndexes] = useState<number[]>([]);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [actionDrafts, setActionDrafts] = useState<Record<number, ActionDraft>>({});
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (editingActionIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingActionIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingActionIndex]);

  const payload = useMemo<RelationshipIntelligenceRequest>(() => {
    const sortedNotes = [...notes].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const sortedActivities = [...activities].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const sortedTasks = [...tasks].sort((a, b) => +new Date(b.dueAt ?? "") - +new Date(a.dueAt ?? ""));

    return {
      entityType,
      entityId,
      entityName,
      notes: sortedNotes.slice(0, 30).map((note) => ({
        body: limitText(normalizeNoteBody(note.body), 520),
        createdAt: note.createdAt
      })),
      activities: sortedActivities.slice(0, 30).map((activity) => ({
        type: activity.type,
        createdAt: activity.createdAt,
        metadata: compactMetadata(activity.metadata)
      })),
      tasks: sortedTasks.slice(0, 30).map((task) => ({
        title: task.title,
        status: task.status,
        dueAt: task.dueAt
      })),
      deals: deals.slice(0, 20).map((deal) => ({
        title: deal.title,
        status: deal.status,
        amount: deal.amount,
        currency: deal.currency
      })),
      invoices: invoices.slice(0, 20).map((invoice) => ({
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt
      }))
    };
  }, [entityType, entityId, entityName, notes, activities, tasks, deals, invoices]);

  async function generateInsights() {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/ai/relationship-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, tr("Unable to generate AI insights", "تعذر إنشاء رؤى الذكاء الاصطناعي")));
      }

      const generated = (await response.json()) as RelationshipIntelligenceResponse;
      setResult(generated);
      await showSuccessAlert(tr("AI insights ready", "رؤى الذكاء الاصطناعي جاهزة"));
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to generate AI insights", "تعذر إنشاء رؤى الذكاء الاصطناعي");
      await showErrorAlert(tr("AI generation failed", "فشل إنشاء الرؤى"), message);
    } finally {
      setLoading(false);
    }
  }

  async function copyDraft() {
    if (!result?.insights.outreachDraft) return;
    try {
      await navigator.clipboard.writeText(result.insights.outreachDraft);
      await showSuccessAlert(tr("Draft copied", "تم نسخ المسودة"));
    } catch {
      await showErrorAlert(tr("Copy failed", "فشل النسخ"), tr("Your browser blocked clipboard access.", "المتصفح منع الوصول إلى الحافظة."));
    }
  }

  async function ensureUsersLoaded() {
    if (usersLoaded || loadingUsers) return;
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await getResponseError(response, tr("Unable to load users", "تعذر تحميل المستخدمين")));
      }

      const payload = (await response.json().catch(() => null)) as
        | { rows?: UserSummary[] }
        | UserSummary[]
        | null;

      const rows = Array.isArray(payload) ? payload : payload?.rows ?? [];
      setUsers(rows);
      setUsersLoaded(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to load users", "تعذر تحميل المستخدمين");
      await showErrorAlert(tr("Assignee list unavailable", "قائمة المكلّفين غير متاحة"), message);
    } finally {
      setLoadingUsers(false);
    }
  }

  function openCreateTaskForm(index: number, action: { title: string; priority: string }) {
    if (creatingAll || creatingActionIndex !== null || createdActionIndexes.includes(index)) return;
    setEditingActionIndex(index);
    setActionDrafts((previous) => ({
      ...previous,
      [index]: previous[index] ?? {
        title: action.title,
        assigneeId: "",
        dueDate: dueDateInputForPriority(action.priority)
      }
    }));
    ensureUsersLoaded().catch(() => {
      // Error feedback handled in ensureUsersLoaded.
    });
  }

  function patchDraft(index: number, patch: Partial<ActionDraft>) {
    setActionDrafts((previous) => ({
      ...previous,
      [index]: {
        title: previous[index]?.title ?? "",
        assigneeId: previous[index]?.assigneeId ?? "",
        dueDate: previous[index]?.dueDate ?? "",
        ...patch
      }
    }));
  }

  async function submitActionTask(index: number) {
    if (creatingActionIndex !== null || creatingAll) return;
    const draft = actionDrafts[index];
    if (!draft) return;

    const title = draft.title.trim();
    if (!title) {
      await showErrorAlert(tr("Missing task title", "عنوان المهمة مفقود"), tr("Task title is required.", "عنوان المهمة مطلوب."));
      return;
    }

    setCreatingActionIndex(index);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          relatedType: entityType,
          relatedId: entityId,
          assigneeId: draft.assigneeId || undefined,
          dueAt: dueIsoFromInput(draft.dueDate)
        })
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, tr("Unable to create task from recommendation", "تعذر إنشاء مهمة من التوصية")));
      }

      setCreatedActionIndexes((previous) => (previous.includes(index) ? previous : [...previous, index]));
      setEditingActionIndex(null);
      await showSuccessAlert(tr("Task created", "تم إنشاء المهمة"), title);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to create task from recommendation", "تعذر إنشاء مهمة من التوصية");
      await showErrorAlert(tr("Task creation failed", "فشل إنشاء المهمة"), message);
    } finally {
      setCreatingActionIndex(null);
    }
  }

  async function createAllActionsAsTasks() {
    if (!result || creatingActionIndex !== null || creatingAll) return;
    setCreatingAll(true);

    const failedTitles: string[] = [];
    let createdCount = 0;
    const nextCreatedIndexes = new Set(createdActionIndexes);

    try {
      for (const [index, action] of result.insights.recommendedActions.entries()) {
        if (nextCreatedIndexes.has(index)) {
          continue;
        }
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: action.title,
            relatedType: entityType,
            relatedId: entityId,
            dueAt: dueIsoFromInput(dueDateInputForPriority(action.priority))
          })
        });

        if (!response.ok) {
          failedTitles.push(action.title);
          continue;
        }

        createdCount += 1;
        nextCreatedIndexes.add(index);
      }

      setCreatedActionIndexes([...nextCreatedIndexes]);
      if (createdCount > 0) {
        await showSuccessAlert(tr("Tasks created", "تم إنشاء المهام"), `${createdCount} ${tr("recommended actions were converted to tasks.", "إجراءً موصى به تم تحويله إلى مهام.")}`);
        router.refresh();
      }

      if (failedTitles.length > 0) {
        await showErrorAlert(tr("Some tasks failed", "فشل إنشاء بعض المهام"), failedTitles.join(", "));
      }
    } finally {
      setCreatingAll(false);
    }
  }

  const modalAction =
    editingActionIndex !== null && result
      ? result.insights.recommendedActions[editingActionIndex] ?? null
      : null;
  const modalDraft = editingActionIndex !== null ? actionDrafts[editingActionIndex] ?? null : null;

  return (
    <>
      <article className="panel p-4 md:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{tr("AI relationship intelligence", "ذكاء العلاقات بالذكاء الاصطناعي")}</h2>
            <p className="mt-1 text-sm text-mutedfg">
              {tr("Analyze journal, activity, tasks, and revenue signals to guide the next best move.", "حلّل اليوميات والأنشطة والمهام وإشارات الإيراد لتحديد أفضل خطوة تالية.")}
            </p>
          </div>
          <button className="btn btn-primary" type="button" onClick={generateInsights} disabled={loading}>
            {loading ? tr("Thinking...", "جارٍ التحليل...") : result ? tr("Regenerate insights", "إعادة توليد الرؤى") : tr("Generate insights", "توليد الرؤى")}
          </button>
        </div>

        {result ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
              <div className="panel-soft p-3">
                <p className="muted-label">{tr("Health score", "مؤشر الصحة")}</p>
                <p className="mt-1 text-3xl font-semibold">{result.insights.healthScore}</p>
                <p className="mt-1 text-sm text-mutedfg">
                  {result.insights.healthLabel} · {result.insights.priority === "high" ? tr("high priority", "أولوية عالية") : result.insights.priority === "low" ? tr("low priority", "أولوية منخفضة") : tr("medium priority", "أولوية متوسطة")}
                </p>
              </div>
              <div className="panel-soft p-3">
                <p className="muted-label">{tr("Executive summary", "ملخص تنفيذي")}</p>
                <p className="mt-1 text-sm text-fg">{result.insights.summary}</p>
                <p className="mt-2 text-xs text-mutedfg">
                  {tr("Next channel:", "القناة التالية:")} {result.insights.nextBestChannel} · {tr("Generated via", "تم التوليد عبر")} {result.provider}/{result.model}
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="panel-soft p-3">
                <p className="muted-label">{tr("Key signals", "الإشارات الرئيسية")}</p>
                {result.insights.signals.length === 0 ? (
                  <p className="mt-1 text-sm text-mutedfg">{tr("No clear signals detected.", "لا توجد إشارات واضحة مكتشفة.")}</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {result.insights.signals.map((signal) => (
                      <li key={signal} className="text-mutedfg">
                        • {signal}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel-soft p-3">
                <p className="muted-label">{tr("Risks", "المخاطر")}</p>
                {result.insights.risks.length === 0 ? (
                  <p className="mt-1 text-sm text-mutedfg">{tr("No immediate risk flags.", "لا توجد مؤشرات مخاطر فورية.")}</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {result.insights.risks.map((risk) => (
                      <li key={risk} className="text-mutedfg">
                        • {risk}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="panel-soft p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="muted-label">{tr("Recommended actions", "الإجراءات الموصى بها")}</p>
                <button
                  className="btn h-8 px-2 text-xs"
                  type="button"
                  onClick={createAllActionsAsTasks}
                  disabled={creatingAll || creatingActionIndex !== null}
                >
                  {creatingAll ? tr("Creating...", "جارٍ الإنشاء...") : tr("Create all as tasks", "إنشاء الكل كمهام")}
                </button>
              </div>
              <ul className="mt-2 space-y-2">
                {result.insights.recommendedActions.map((action, index) => (
                  <li key={`${action.title}-${action.priority}`} className="rounded-md border border-border bg-surface p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{action.title}</p>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn h-8 px-2 text-xs"
                          type="button"
                          onClick={() => openCreateTaskForm(index, action)}
                          disabled={creatingAll || creatingActionIndex !== null || createdActionIndexes.includes(index)}
                        >
                          {createdActionIndexes.includes(index) ? tr("Task created", "تم إنشاء المهمة") : tr("Create task", "إنشاء مهمة")}
                        </button>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityClass(action.priority)}`}
                        >
                          {action.priority === "high" ? tr("high", "عالٍ") : action.priority === "low" ? tr("low", "منخفض") : tr("medium", "متوسط")}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-mutedfg">{action.reason}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-soft p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="muted-label">{tr("Outreach draft", "مسودة تواصل")}</p>
                <button className="btn h-8 px-2 text-xs" type="button" onClick={copyDraft}>
                  {tr("Copy", "نسخ")}
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{result.insights.outreachDraft}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-mutedfg">
            {tr("No AI output yet. Generate insights to get relationship health, risks, and recommended next actions.", "لا توجد مخرجات من الذكاء الاصطناعي بعد. ولّد رؤى للحصول على صحة العلاقة والمخاطر والإجراءات التالية الموصى بها.")}
          </p>
        )}
      </article>

      {editingActionIndex !== null && modalAction && !createdActionIndexes.includes(editingActionIndex) ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/45 p-2 sm:p-4">
          <div
            className="mx-auto my-0 flex h-auto max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl sm:my-4"
            role="dialog"
            aria-modal="true"
            aria-label={tr("Create task from recommendation", "إنشاء مهمة من التوصية")}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{tr("Create task", "إنشاء مهمة")}</p>
                <p className="text-xs text-mutedfg">{modalAction.title}</p>
              </div>
              <button
                className="btn h-8 px-2 text-xs"
                type="button"
                onClick={() => setEditingActionIndex(null)}
                disabled={creatingActionIndex === editingActionIndex}
              >
                {tr("Close", "إغلاق")}
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-mutedfg sm:col-span-2">
                  {tr("Task title", "عنوان المهمة")}
                  <input
                    className="input mt-1 h-9 w-full"
                    value={modalDraft?.title ?? ""}
                    onChange={(event) => patchDraft(editingActionIndex, { title: event.target.value })}
                  />
                </label>
                <label className="text-xs text-mutedfg">
                  {tr("Assign to", "تعيين إلى")}
                  <select
                    className="input mt-1 h-9 w-full"
                    value={modalDraft?.assigneeId ?? ""}
                    onChange={(event) => patchDraft(editingActionIndex, { assigneeId: event.target.value })}
                    disabled={loadingUsers}
                  >
                    <option value="">{loadingUsers ? tr("Loading users...", "جارٍ تحميل المستخدمين...") : tr("Unassigned", "غير مكلّف")}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {userLabel(user)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-mutedfg">
                  {tr("Due date", "تاريخ الاستحقاق")}
                  <input
                    type="date"
                    className="input mt-1 h-9 w-full"
                    value={modalDraft?.dueDate ?? ""}
                    onChange={(event) => patchDraft(editingActionIndex, { dueDate: event.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <button
                className="btn h-8 px-2 text-xs"
                type="button"
                onClick={() => setEditingActionIndex(null)}
                disabled={creatingActionIndex === editingActionIndex}
              >
                {tr("Cancel", "إلغاء")}
              </button>
              <button
                className="btn btn-primary h-8 px-2 text-xs"
                type="button"
                onClick={() => submitActionTask(editingActionIndex)}
                disabled={creatingActionIndex === editingActionIndex}
              >
                {creatingActionIndex === editingActionIndex ? tr("Creating...", "جارٍ الإنشاء...") : tr("Create task", "إنشاء مهمة")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
