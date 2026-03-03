import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import { TaskStatusControl } from "@/components/TaskStatusControl";
import type { Activity, Company, Contact, Deal, Note, Task } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
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

type RelatedEntitySummary = {
  label: string;
  href: string;
};

async function loadRelatedEntity(task: Task): Promise<RelatedEntitySummary | null> {
  if (task.relatedType === "contact") {
    const contact = await serverApiRequestOrNull<Contact>(`/contacts/${task.relatedId}`);
    if (!contact) return null;
    return {
      label: `${contact.firstName} ${contact.lastName}`.trim(),
      href: `/contacts/${contact.id}`
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
      query: { relatedType: "task", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "task", entityId: id }
    }),
    loadRelatedEntity(task)
  ]);

  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "task" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "task" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/tasks" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to tasks", "← العودة إلى المهام")}</Link>
        <h1 className="page-title">{tr("Task detail", "تفاصيل المهمة")}</h1>
        <p className="page-subtitle">{tr("Context and updates related to this task item.", "السياق والتحديثات المرتبطة بهذه المهمة.")}</p>
      </header>

      <section className="panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{task.title}</p>
            <p className="mt-1 text-sm text-mutedfg">{tr("Status", "الحالة")}: {taskStatusLabel(task.status, tr)}</p>
          </div>
          <TaskStatusControl taskId={task.id} status={task.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>{tr("Due", "الاستحقاق")}: <span className="text-mutedfg">{fmtDateTime(task.dueAt, locale)}</span></p>
          <p>{tr("Related type", "نوع الارتباط")}: <span className="text-mutedfg">{relatedTypeLabel(task.relatedType, tr)}</span></p>
          <p>
            {tr("Related record", "السجل المرتبط")}: {" "}
            {relatedEntity ? (
              <Link href={relatedEntity.href as Route} className="text-accent hover:underline">{relatedEntity.label}</Link>
            ) : (
              <span className="font-mono text-xs text-mutedfg">{task.relatedId}</span>
            )}
          </p>
          <p>{tr("Task ID", "معرّف المهمة")}: <span className="font-mono text-xs text-mutedfg">{task.id}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Notes", "ملاحظات")}</h2>
          <div className="mt-3">
            <AddNoteForm relatedType="task" relatedId={id} />
          </div>
          {notes.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">{tr("No notes yet.", "لا توجد ملاحظات بعد.")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <p>{note.body}</p>
                  <p className="mt-1 text-xs text-mutedfg">{fmtDateTime(note.createdAt, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Recent activity", "النشاط الأخير")}</h2>
          {activity.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">{tr("No activity yet.", "لا يوجد نشاط بعد.")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {activity.slice(0, 8).map((entry) => (
                <li key={entry.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <p className="font-medium">{entry.type}</p>
                  <p className="text-xs text-mutedfg">{fmtDateTime(entry.createdAt, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
