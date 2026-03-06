import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import { TaskStatusControl } from "@/components/TaskStatusControl";
import { DetailHero } from "@/components/detail/DetailHero";
import { DetailListCard } from "@/components/detail/DetailListCard";
import type { Activity, Company, Contact, Deal, Note, Task } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import {
  serverApiRequest,
  serverApiRequestOrNull,
  type ServerListResponse,
} from "@/lib/server-crm";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function taskStatusLabel(
  status: Task["status"],
  tr: (english: string, arabic: string) => string,
): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

function relatedTypeLabel(
  type: Task["relatedType"],
  tr: (english: string, arabic: string) => string,
): string {
  if (type === "contact") return tr("Contact", "جهة اتصال");
  if (type === "company") return tr("Company", "شركة");
  if (type === "deal") return tr("Deal", "صفقة");
  return tr("Task", "مهمة");
}

type RelatedEntitySummary = {
  href: string;
  label: string;
};

async function loadRelatedEntity(task: Task): Promise<RelatedEntitySummary | null> {
  if (task.relatedType === "contact") {
    const contact = await serverApiRequestOrNull<Contact>(`/contacts/${task.relatedId}`);
    if (!contact) return null;
    return {
      label: `${contact.firstName} ${contact.lastName}`.trim(),
      href: `/contacts/${contact.id}`,
    };
  }

  if (task.relatedType === "company") {
    const company = await serverApiRequestOrNull<Company>(`/companies/${task.relatedId}`);
    if (!company) return null;
    return { label: company.name, href: `/companies/${company.id}` };
  }

  if (task.relatedType === "deal") {
    const deal = await serverApiRequestOrNull<Deal>(`/deals/${task.relatedId}`);
    if (!deal) return null;
    return { label: deal.title, href: `/deals/${deal.id}` };
  }

  const relatedTask = await serverApiRequestOrNull<Task>(`/tasks/${task.relatedId}`);
  if (!relatedTask) return null;
  return { label: relatedTask.title, href: `/tasks/${relatedTask.id}` };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const task = await serverApiRequestOrNull<Task>(`/tasks/${id}`);
  if (!task) notFound();

  const [notesPayload, activityPayload, relatedEntity] = await Promise.all([
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "task", relatedId: id },
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "task", entityId: id },
    }),
    loadRelatedEntity(task),
  ]);

  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "task" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "task" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main className="app-page">
      <DetailHero
        backHref="/tasks"
        backLabel={`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to tasks", "العودة إلى المهام")}`}
        category={tr("Task detail", "تفاصيل المهمة")}
        title={task.title}
        description={tr(
          "Execution context, related record, and update history for this task item.",
          "سياق التنفيذ والسجل المرتبط وسجل التحديثات لهذه المهمة.",
        )}
        actions={<TaskStatusControl taskId={task.id} status={task.status} />}
        metrics={[
          { label: tr("Status", "الحالة"), value: taskStatusLabel(task.status, tr) },
          { label: tr("Notes", "الملاحظات"), value: notes.length },
          { label: tr("Activity", "النشاط"), value: activity.length },
          { label: tr("Relation", "الارتباط"), value: relatedTypeLabel(task.relatedType, tr) },
        ]}
        fields={[
          { label: tr("Due", "الاستحقاق"), value: fmtDateTime(task.dueAt, locale) },
          {
            label: tr("Related type", "نوع الارتباط"),
            value: relatedTypeLabel(task.relatedType, tr),
          },
          {
            label: tr("Related record", "السجل المرتبط"),
            value: relatedEntity ? (
              <Link href={relatedEntity.href as Route} className="text-accent hover:underline">
                {relatedEntity.label}
              </Link>
            ) : (
              <span className="font-mono text-xs text-mutedfg">{task.relatedId}</span>
            ),
          },
          { label: tr("Task reference", "مرجع المهمة"), value: task.id },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <div>
            <h2 className="text-sm font-semibold">{tr("Notes", "ملاحظات")}</h2>
            <p className="mt-1 text-sm text-mutedfg">
              {tr(
                "Capture updates, blockers, and context for this task.",
                "سجّل التحديثات والعوائق والسياق لهذه المهمة.",
              )}
            </p>
          </div>

          <div className="mt-3">
            <AddNoteForm relatedType="task" relatedId={id} />
          </div>

          {notes.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
              {tr("No notes yet.", "لا توجد ملاحظات بعد.")}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-2xl border border-border bg-surface2/70 px-4 py-3"
                >
                  <p className="text-sm">{note.body}</p>
                  <p className="mt-1 text-xs text-mutedfg">{fmtDateTime(note.createdAt, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <DetailListCard
          title={tr("Recent activity", "النشاط الأخير")}
          description={tr(
            "Latest system events related to this task.",
            "أحدث أحداث النظام المرتبطة بهذه المهمة.",
          )}
          emptyText={tr("No activity yet.", "لا يوجد نشاط بعد.")}
          hasItems={activity.length > 0}
        >
          <ul className="space-y-2">
            {activity.slice(0, 8).map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3"
              >
                <p className="font-medium">{entry.type}</p>
                <p className="mt-1 text-xs text-mutedfg">{fmtDateTime(entry.createdAt, locale)}</p>
              </li>
            ))}
          </ul>
        </DetailListCard>
      </section>
    </main>
  );
}
