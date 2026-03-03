import Link from "next/link";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import type { Activity, Company, Contact, Deal, Note, Stage, Task } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function dealStatusLabel(status: Deal["status"], tr: (english: string, arabic: string) => string): string {
  if (status === "WON") return tr("Won", "مغلقة - ربح");
  if (status === "LOST") return tr("Lost", "مغلقة - خسارة");
  return tr("Open", "مفتوحة");
}

function taskStatusLabel(status: Task["status"], tr: (english: string, arabic: string) => string): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const deal = await serverApiRequestOrNull<Deal>(`/deals/${id}`);
  if (!deal) notFound();

  const [notesPayload, tasksPayload, activityPayload, stagesPayload, company, primaryContact] = await Promise.all([
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "deal", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "deal", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "deal", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Stage>>("/stages"),
    deal.companyId ? serverApiRequestOrNull<Company>(`/companies/${deal.companyId}`) : Promise.resolve(null),
    deal.primaryContactId
      ? serverApiRequestOrNull<Contact>(`/contacts/${deal.primaryContactId}`)
      : Promise.resolve(null)
  ]);

  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "deal" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const tasks = (tasksPayload.rows ?? []).filter((task) => task.relatedType === "deal" && task.relatedId === id);
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "deal" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const stageName = (stagesPayload.rows ?? []).find((stage) => stage.id === deal.stageId)?.name ?? deal.stageId;

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/deals" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to pipeline", "← العودة إلى البايبلاين")}</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">{tr("Pipeline card profile", "ملف بطاقة البايبلاين")}</h1>
            <p className="page-subtitle">{tr("Opportunity context, next actions, and timeline activity.", "سياق الفرصة والإجراءات التالية والنشاط الزمني.")}</p>
          </div>
          <Link href={`/deals/${id}/edit`} className="btn btn-primary">{tr("Edit card", "تعديل البطاقة")}</Link>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{deal.title}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>{tr("Amount", "المبلغ")}: <span className="text-mutedfg">{fmtMoney(deal.amount, deal.currency)}</span></p>
          <p>{tr("Status", "الحالة")}: <span className="text-mutedfg">{dealStatusLabel(deal.status, tr)}</span></p>
          <p>{tr("Stage", "المرحلة")}: <span className="text-mutedfg">{stageName}</span></p>
          <p>{tr("Expected close", "الإغلاق المتوقع")}: <span className="text-mutedfg">{fmtDateTime(deal.expectedCloseDate, locale)}</span></p>
          <p>
            {tr("Company", "الشركة")}: {" "}
            {company ? (
              <Link href={`/companies/${company.id}`} className="text-accent hover:underline">{company.name}</Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
          <p>
            {tr("Primary contact", "جهة الاتصال الأساسية")}: {" "}
            {primaryContact ? (
              <Link href={`/contacts/${primaryContact.id}`} className="text-accent hover:underline">
                {primaryContact.firstName} {primaryContact.lastName}
              </Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Tasks", "المهام")}</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">{tr("No related tasks.", "لا توجد مهام مرتبطة.")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">{taskStatusLabel(task.status, tr)} · {tr("Due", "الاستحقاق")} {fmtDateTime(task.dueAt, locale)}</p>
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

        <article className="panel p-4 md:col-span-2">
          <h2 className="text-sm font-semibold">{tr("Notes", "ملاحظات")}</h2>
          <div className="mt-3">
            <AddNoteForm relatedType="deal" relatedId={id} />
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
      </section>
    </main>
  );
}
