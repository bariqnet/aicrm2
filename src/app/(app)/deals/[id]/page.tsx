import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import { DetailHero } from "@/components/detail/DetailHero";
import { DetailListCard } from "@/components/detail/DetailListCard";
import type { Activity, Company, Contact, Deal, Note, Stage, Task } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import {
  serverApiRequest,
  serverApiRequestOrNull,
  type ServerListResponse,
} from "@/lib/server-crm";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function dealStatusLabel(
  status: Deal["status"],
  tr: (english: string, arabic: string) => string,
): string {
  if (status === "WON") return tr("Won", "مغلقة - ربح");
  if (status === "LOST") return tr("Lost", "مغلقة - خسارة");
  return tr("Open", "مفتوحة");
}

function dealStatusClass(status: Deal["status"]): string {
  if (status === "WON") return "border-green-200 bg-green-50 text-green-700";
  if (status === "LOST") return "border-red-200 bg-red-50 text-red-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function taskStatusLabel(
  status: Task["status"],
  tr: (english: string, arabic: string) => string,
): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const deal = await serverApiRequestOrNull<Deal>(`/deals/${id}`);
  if (!deal) notFound();

  const [notesPayload, tasksPayload, activityPayload, stagesPayload, company, primaryContact] =
    await Promise.all([
      serverApiRequest<ServerListResponse<Note>>("/notes", {
        query: { relatedType: "deal", relatedId: id },
      }),
      serverApiRequest<ServerListResponse<Task>>("/tasks", {
        query: { relatedType: "deal", relatedId: id },
      }),
      serverApiRequest<ServerListResponse<Activity>>("/activities", {
        query: { entityType: "deal", entityId: id },
      }),
      serverApiRequest<ServerListResponse<Stage>>("/stages"),
      deal.companyId
        ? serverApiRequestOrNull<Company>(`/companies/${deal.companyId}`)
        : Promise.resolve(null),
      deal.primaryContactId
        ? serverApiRequestOrNull<Contact>(`/contacts/${deal.primaryContactId}`)
        : Promise.resolve(null),
    ]);

  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "deal" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const tasks = (tasksPayload.rows ?? []).filter(
    (task) => task.relatedType === "deal" && task.relatedId === id,
  );
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "deal" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const stageName =
    (stagesPayload.rows ?? []).find((stage) => stage.id === deal.stageId)?.name ?? deal.stageId;
  const openTasks = tasks.filter((task) => task.status !== "DONE");

  return (
    <main className="app-page">
      <DetailHero
        backHref="/deals"
        backLabel={`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to pipeline", "العودة إلى خط المبيعات")}`}
        category={tr("Pipeline card profile", "تفاصيل بطاقة خط المبيعات")}
        title={deal.title}
        description={tr(
          "Opportunity value, deal context, and next-step execution in a single working view.",
          "قيمة الفرصة وسياق الصفقة وتنفيذ الخطوات التالية في عرض عمل واحد.",
        )}
        actions={
          <Link href={`/deals/${id}/edit` as Route} className="btn btn-primary">
            {tr("Edit card", "تعديل البطاقة")}
          </Link>
        }
        badge={
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${dealStatusClass(deal.status)}`}
          >
            {dealStatusLabel(deal.status, tr)}
          </span>
        }
        metrics={[
          {
            label: tr("Pipeline value", "قيمة الفرصة"),
            value: fmtMoney(deal.amount, deal.currency),
          },
          { label: tr("Open tasks", "المهام المفتوحة"), value: openTasks.length },
          { label: tr("Notes", "الملاحظات"), value: notes.length },
          { label: tr("Activity", "النشاط"), value: activity.length },
        ]}
        fields={[
          { label: tr("Stage", "المرحلة"), value: stageName },
          {
            label: tr("Expected close", "الإغلاق المتوقع"),
            value: fmtDateTime(deal.expectedCloseDate, locale),
          },
          {
            label: tr("Company", "الشركة"),
            value: company ? (
              <Link
                href={`/companies/${company.id}` as Route}
                className="text-accent hover:underline"
              >
                {company.name}
              </Link>
            ) : (
              "-"
            ),
          },
          {
            label: tr("Primary contact", "جهة الاتصال الأساسية"),
            value: primaryContact ? (
              <Link
                href={`/contacts/${primaryContact.id}` as Route}
                className="text-accent hover:underline"
              >
                {primaryContact.firstName} {primaryContact.lastName}
              </Link>
            ) : (
              "-"
            ),
          },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-2">
        <DetailListCard
          title={tr("Tasks", "المهام")}
          description={tr(
            "Execution work currently tied to this opportunity.",
            "أعمال التنفيذ المرتبطة حاليًا بهذه الفرصة.",
          )}
          emptyText={tr("No related tasks.", "لا توجد مهام مرتبطة.")}
          hasItems={tasks.length > 0}
        >
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-black/10 hover:bg-white"
              >
                <Link href={`/tasks/${task.id}` as Route} className="font-medium hover:underline">
                  {task.title}
                </Link>
                <p className="mt-1 text-xs text-mutedfg">
                  {taskStatusLabel(task.status, tr)} · {tr("Due", "الاستحقاق")}{" "}
                  {fmtDateTime(task.dueAt, locale)}
                </p>
              </li>
            ))}
          </ul>
        </DetailListCard>

        <DetailListCard
          title={tr("Recent activity", "النشاط الأخير")}
          description={tr(
            "Latest system events around this deal.",
            "أحدث أحداث النظام حول هذه الصفقة.",
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

        <article className="panel p-4 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{tr("Notes", "ملاحظات")}</h2>
              <p className="mt-1 text-sm text-mutedfg">
                {tr(
                  "Capture decision points, blockers, and the next move for this opportunity.",
                  "سجّل نقاط القرار والعوائق والخطوة التالية لهذه الفرصة.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <AddNoteForm relatedType="deal" relatedId={id} />
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
      </section>
    </main>
  );
}
