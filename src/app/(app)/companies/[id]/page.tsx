import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { RelationshipIntelligencePanel } from "@/components/RelationshipIntelligencePanel";
import { RelationshipJournalSection } from "@/components/RelationshipJournalSection";
import type { Activity, Company, Contact, Deal, Invoice, Note, Task } from "@/lib/crm-types";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

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

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const company = await serverApiRequestOrNull<Company>(`/companies/${id}`);
  if (!company) notFound();

  const [contactsPayload, dealsPayload, notesPayload, activityPayload, invoicesPayload, tasksPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Contact>>("/contacts", { query: { companyId: id } }),
    serverApiRequest<ServerListResponse<Deal>>("/deals", { query: { companyId: id } }),
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "company", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "company", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "company", relatedId: id }
    })
  ]);

  const contacts = (contactsPayload.rows ?? []).filter((contact) => contact.companyId === id);
  const deals = (dealsPayload.rows ?? []).filter((deal) => deal.companyId === id);
  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "company" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "company" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const invoices = (invoicesPayload.rows ?? []).filter(
    (invoice) =>
      invoice.companyId === id ||
      (invoice.relatedType === "company" && invoice.relatedId === id)
  );
  const tasks = (tasksPayload.rows ?? []).filter((task) => task.relatedType === "company" && task.relatedId === id);

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/companies" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to companies", "← العودة إلى الشركات")}</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">{tr("Company profile", "ملف الشركة")}</h1>
            <p className="page-subtitle">{tr("Account context, contacts, deals, and billing touchpoints.", "سياق الحساب وجهات الاتصال والصفقات ونقاط الفوترة.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/invoices/new?relatedType=company&relatedId=${id}`} className="btn">{tr("New invoice", "فاتورة جديدة")}</Link>
            <Link href={`/companies/${id}/edit`} className="btn btn-primary">{tr("Edit company", "تعديل الشركة")}</Link>
          </div>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{company.name}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>{tr("Industry", "القطاع")}: <span className="text-mutedfg">{company.industry ?? "-"}</span></p>
          <p>{tr("Domain", "النطاق")}: <span className="text-mutedfg">{company.domain ?? "-"}</span></p>
          <p>{tr("Size", "الحجم")}: <span className="text-mutedfg">{company.size ?? "-"}</span></p>
          <p>{tr("ID", "المعرّف")}: <span className="font-mono text-xs text-mutedfg">{company.id}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <RelationshipJournalSection
          relatedType="company"
          relatedId={id}
          title={tr("Relationship journal", "سجل العلاقة")}
          description={tr("Keep every account interaction in one production-ready timeline.", "احتفِظ بكل تفاعل للحساب داخل خط زمني واحد جاهز للإنتاج.")}
          notes={notes}
          activities={activity}
          emptyText={tr("No notes or activities recorded for this company yet.", "لا توجد ملاحظات أو أنشطة مسجلة لهذه الشركة بعد.")}
        />

        <RelationshipIntelligencePanel
          entityType="company"
          entityId={id}
          entityName={company.name}
          notes={notes}
          activities={activity}
          tasks={tasks}
          deals={deals}
          invoices={invoices}
        />

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Contacts", "جهات الاتصال")}</h2>
          {contacts.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">{tr("No linked contacts.", "لا توجد جهات اتصال مرتبطة.")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {contacts.map((contact) => (
                <li key={contact.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                    {contact.firstName} {contact.lastName}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">{contact.email ?? tr("No email", "بدون بريد")}</p>
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
            <p className="mt-2 text-sm text-mutedfg">{tr("No invoices linked to this company.", "لا توجد فواتير مرتبطة بهذه الشركة.")}</p>
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
            <p>{tr("Linked contacts", "جهات الاتصال المرتبطة")}: {contacts.length}</p>
            <p>{tr("Open tasks", "المهام المفتوحة")}: {tasks.filter((task) => task.status === "OPEN").length}</p>
          </div>
        </article>
      </section>
    </main>
  );
}
