import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { RelationshipIntelligencePanel } from "@/components/RelationshipIntelligencePanel";
import { RelationshipJournalSection } from "@/components/RelationshipJournalSection";
import type { Activity, Company, Contact, Deal, Invoice, Note, Task } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function taskStatusLabel(status: Task["status"], tr: (english: string, arabic: string) => string): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

function dealStatusLabel(status: Deal["status"], tr: (english: string, arabic: string) => string): string {
  if (status === "WON") return tr("Won", "مغلقة - ربح");
  if (status === "LOST") return tr("Lost", "مغلقة - خسارة");
  return tr("Open", "مفتوحة");
}

function invoiceStatusLabel(status: Invoice["status"], tr: (english: string, arabic: string) => string): string {
  if (status === "DRAFT") return tr("Draft", "مسودة");
  if (status === "SENT") return tr("Sent", "مرسلة");
  if (status === "PARTIALLY_PAID") return tr("Partially paid", "مدفوعة جزئيًا");
  if (status === "PAID") return tr("Paid", "مدفوعة");
  if (status === "OVERDUE") return tr("Overdue", "متأخرة");
  if (status === "VOID") return tr("Void", "ملغاة");
  return status;
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const contact = await serverApiRequestOrNull<Contact>(`/contacts/${id}`);
  if (!contact) notFound();

  const [tasksPayload, notesPayload, activityPayload, dealsPayload, invoicesPayload, company] = await Promise.all([
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "contact", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "contact", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "contact", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Deal>>("/deals", {
      query: { primaryContactId: id }
    }),
    serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
    contact.companyId ? serverApiRequestOrNull<Company>(`/companies/${contact.companyId}`) : Promise.resolve(null)
  ]);

  const tasks = (tasksPayload.rows ?? []).filter((task) => task.relatedType === "contact" && task.relatedId === id);
  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "contact" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "contact" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const deals = (dealsPayload.rows ?? []).filter((deal) => deal.primaryContactId === id);
  const invoices = (invoicesPayload.rows ?? []).filter(
    (invoice) =>
      invoice.contactId === id ||
      (invoice.relatedType === "contact" && invoice.relatedId === id)
  );

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/contacts" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to contacts", "← العودة إلى جهات الاتصال")}</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">{tr("Contact profile", "ملف جهة الاتصال")}</h1>
            <p className="page-subtitle">{tr("View related work, notes, invoices, and activity in one place.", "اعرض الأعمال والملاحظات والفواتير والنشاط المرتبط في مكان واحد.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/invoices/new?relatedType=contact&relatedId=${id}`} className="btn">{tr("New invoice", "فاتورة جديدة")}</Link>
            <Link href={`/contacts/${id}/edit`} className="btn btn-primary">{tr("Edit contact", "تعديل جهة الاتصال")}</Link>
          </div>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{contact.firstName} {contact.lastName}</p>
        <p className="mt-1 text-sm text-mutedfg">{contact.jobTitle ?? tr("No title", "بدون منصب")}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>{tr("Email", "البريد الإلكتروني")}: <span className="text-mutedfg">{contact.email ?? "-"}</span></p>
          <p>{tr("Phone", "الهاتف")}: <span className="text-mutedfg">{contact.phone ?? "-"}</span></p>
          <p>
            {tr("Company", "الشركة")}: {" "}
            {company ? (
              <Link href={`/companies/${company.id}`} className="text-accent hover:underline">{company.name}</Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
          <p>{tr("Created", "تاريخ الإنشاء")}: <span className="text-mutedfg">{fmtDateTime(contact.createdAt, locale)}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <RelationshipJournalSection
          relatedType="contact"
          relatedId={id}
          title={tr("Relationship journal", "سجل العلاقة")}
          description={tr("Track every interaction and keep a complete history with this contact.", "تتبّع كل تفاعل واحتفِظ بسجل كامل مع جهة الاتصال هذه.")}
          notes={notes}
          activities={activity}
          emptyText={tr("No notes or activities recorded for this contact yet.", "لا توجد ملاحظات أو أنشطة مسجلة لجهة الاتصال هذه بعد.")}
        />

        <RelationshipIntelligencePanel
          entityType="contact"
          entityId={id}
          entityName={`${contact.firstName} ${contact.lastName}`}
          notes={notes}
          activities={activity}
          tasks={tasks}
          deals={deals}
          invoices={invoices}
        />

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
          <h2 className="text-sm font-semibold">{tr("Deals", "الصفقات")}</h2>
          {deals.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">{tr("No linked deals.", "لا توجد صفقات مرتبطة.")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deals.map((deal) => (
                <li key={deal.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                    {deal.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">
                    {dealStatusLabel(deal.status, tr)} · {fmtMoney(deal.amount, deal.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Invoices", "الفواتير")}</h2>
          {invoices.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">{tr("No invoices linked to this contact.", "لا توجد فواتير مرتبطة بجهة الاتصال هذه.")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/invoices/${invoice.id}` as Route} className="font-medium hover:underline">
                    {invoice.invoiceNumber} · {invoice.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">
                    {invoiceStatusLabel(invoice.status, tr)} · {fmtMoney(invoice.amount, invoice.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Relationship scorecard", "بطاقة نقاط العلاقة")}</h2>
          <div className="mt-2 space-y-2 text-sm text-mutedfg">
            <p>{tr("Saved notes", "الملاحظات المحفوظة")}: {notes.length}</p>
            <p>{tr("System activities", "أنشطة النظام")}: {activity.length}</p>
            <p>{tr("Open tasks", "المهام المفتوحة")}: {tasks.filter((task) => task.status !== "DONE").length}</p>
          </div>
        </article>
      </section>
    </main>
  );
}
