import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { RelationshipIntelligencePanel } from "@/components/RelationshipIntelligencePanel";
import { RelationshipJournalSection } from "@/components/RelationshipJournalSection";
import { DetailHero } from "@/components/detail/DetailHero";
import { DetailListCard } from "@/components/detail/DetailListCard";
import type { Activity, Company, Contact, Deal, Invoice, Note, Task } from "@/lib/crm-types";
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

function taskStatusLabel(
  status: Task["status"],
  tr: (english: string, arabic: string) => string,
): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

function dealStatusLabel(
  status: Deal["status"],
  tr: (english: string, arabic: string) => string,
): string {
  if (status === "WON") return tr("Won", "مغلقة - ربح");
  if (status === "LOST") return tr("Lost", "مغلقة - خسارة");
  return tr("Open", "مفتوحة");
}

function invoiceStatusLabel(
  status: Invoice["status"],
  tr: (english: string, arabic: string) => string,
): string {
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

  const [tasksPayload, notesPayload, activityPayload, dealsPayload, invoicesPayload, company] =
    await Promise.all([
      serverApiRequest<ServerListResponse<Task>>("/tasks", {
        query: { relatedType: "contact", relatedId: id },
      }),
      serverApiRequest<ServerListResponse<Note>>("/notes", {
        query: { relatedType: "contact", relatedId: id },
      }),
      serverApiRequest<ServerListResponse<Activity>>("/activities", {
        query: { entityType: "contact", entityId: id },
      }),
      serverApiRequest<ServerListResponse<Deal>>("/deals", {
        query: { primaryContactId: id },
      }),
      serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
      contact.companyId
        ? serverApiRequestOrNull<Company>(`/companies/${contact.companyId}`)
        : Promise.resolve(null),
    ]);

  const tasks = (tasksPayload.rows ?? []).filter(
    (task) => task.relatedType === "contact" && task.relatedId === id,
  );
  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "contact" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "contact" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const deals = (dealsPayload.rows ?? []).filter((deal) => deal.primaryContactId === id);
  const invoices = (invoicesPayload.rows ?? []).filter(
    (invoice) =>
      invoice.contactId === id || (invoice.relatedType === "contact" && invoice.relatedId === id),
  );
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const activeDeals = deals.filter((deal) => deal.status === "OPEN");

  return (
    <main className="app-page">
      <DetailHero
        backHref="/contacts"
        backLabel={`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to contacts", "العودة إلى جهات الاتصال")}`}
        category={tr("Contact profile", "ملف جهة الاتصال")}
        title={`${contact.firstName} ${contact.lastName}`.trim()}
        description={tr(
          "Primary relationship context, current commitments, and commercial activity around this person.",
          "سياق العلاقة الأساسي والالتزامات الحالية والنشاط التجاري المرتبط بهذا الشخص.",
        )}
        actions={
          <>
            <Link
              href={`/invoices/new?relatedType=contact&relatedId=${id}` as Route}
              className="btn"
            >
              {tr("New invoice", "فاتورة جديدة")}
            </Link>
            <Link href={`/contacts/${id}/edit` as Route} className="btn btn-primary">
              {tr("Edit contact", "تعديل جهة الاتصال")}
            </Link>
          </>
        }
        metrics={[
          { label: tr("Open tasks", "المهام المفتوحة"), value: openTasks.length },
          { label: tr("Active deals", "الصفقات النشطة"), value: activeDeals.length },
          { label: tr("Invoices", "الفواتير"), value: invoices.length },
          { label: tr("Saved notes", "الملاحظات المحفوظة"), value: notes.length },
        ]}
        fields={[
          { label: tr("Role", "المنصب"), value: contact.jobTitle ?? tr("No title", "بدون منصب") },
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
          { label: tr("Email", "البريد الإلكتروني"), value: contact.email ?? "-" },
          { label: tr("Phone", "الهاتف"), value: contact.phone ?? "-" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-2">
        <RelationshipJournalSection
          relatedType="contact"
          relatedId={id}
          title={tr("Relationship journal", "سجل العلاقة")}
          description={tr(
            "Track every interaction and keep a complete history with this contact.",
            "تتبّع كل تفاعل واحتفِظ بسجل كامل مع جهة الاتصال هذه.",
          )}
          notes={notes}
          activities={activity}
          emptyText={tr(
            "No notes or activities recorded for this contact yet.",
            "لا توجد ملاحظات أو أنشطة مسجلة لجهة الاتصال هذه بعد.",
          )}
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

        <DetailListCard
          title={tr("Tasks", "المهام")}
          description={tr(
            "Open follow-ups currently linked to this person.",
            "المتابعات المفتوحة المرتبطة حاليًا بهذا الشخص.",
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
          title={tr("Deals", "الصفقات")}
          description={tr(
            "Commercial work where this person is the primary contact.",
            "العمل التجاري الذي تُعد فيه هذه الجهة جهة الاتصال الأساسية.",
          )}
          emptyText={tr("No linked deals.", "لا توجد صفقات مرتبطة.")}
          hasItems={deals.length > 0}
        >
          <ul className="space-y-2">
            {deals.map((deal) => (
              <li
                key={deal.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-black/10 hover:bg-white"
              >
                <Link href={`/deals/${deal.id}` as Route} className="font-medium hover:underline">
                  {deal.title}
                </Link>
                <p className="mt-1 text-xs text-mutedfg">
                  {dealStatusLabel(deal.status, tr)} · {fmtMoney(deal.amount, deal.currency)}
                </p>
              </li>
            ))}
          </ul>
        </DetailListCard>

        <DetailListCard
          title={tr("Invoices", "الفواتير")}
          description={tr(
            "Billing documents attached directly to this contact.",
            "مستندات الفوترة المرتبطة مباشرةً بجهة الاتصال هذه.",
          )}
          emptyText={tr(
            "No invoices linked to this contact.",
            "لا توجد فواتير مرتبطة بجهة الاتصال هذه.",
          )}
          hasItems={invoices.length > 0}
        >
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-black/10 hover:bg-white"
              >
                <Link
                  href={`/invoices/${invoice.id}` as Route}
                  className="font-medium hover:underline"
                >
                  {invoice.invoiceNumber} · {invoice.title}
                </Link>
                <p className="mt-1 text-xs text-mutedfg">
                  {invoiceStatusLabel(invoice.status, tr)} ·{" "}
                  {fmtMoney(invoice.amount, invoice.currency)}
                </p>
              </li>
            ))}
          </ul>
        </DetailListCard>

        <DetailListCard
          title={tr("Relationship snapshot", "ملخص العلاقة")}
          description={tr(
            "Quick counts for communication and execution around this contact.",
            "أرقام سريعة للتواصل والتنفيذ حول جهة الاتصال هذه.",
          )}
          emptyText=""
          hasItems
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface2/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                {tr("System activities", "أنشطة النظام")}
              </p>
              <p className="mt-2 text-lg font-semibold">{activity.length}</p>
            </div>
            <div className="rounded-2xl bg-surface2/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                {tr("Created", "تاريخ الإنشاء")}
              </p>
              <p className="mt-2 text-sm font-semibold">{fmtDateTime(contact.createdAt, locale)}</p>
            </div>
          </div>
        </DetailListCard>
      </section>
    </main>
  );
}
