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

function taskStatusLabel(
  status: Task["status"],
  tr: (english: string, arabic: string) => string,
): string {
  return status === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة");
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const company = await serverApiRequestOrNull<Company>(`/companies/${id}`);
  if (!company) notFound();

  const [
    contactsPayload,
    dealsPayload,
    notesPayload,
    activityPayload,
    invoicesPayload,
    tasksPayload,
  ] = await Promise.all([
    serverApiRequest<ServerListResponse<Contact>>("/contacts", { query: { companyId: id } }),
    serverApiRequest<ServerListResponse<Deal>>("/deals", { query: { companyId: id } }),
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "company", relatedId: id },
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "company", entityId: id },
    }),
    serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "company", relatedId: id },
    }),
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
      invoice.companyId === id || (invoice.relatedType === "company" && invoice.relatedId === id),
  );
  const tasks = (tasksPayload.rows ?? []).filter(
    (task) => task.relatedType === "company" && task.relatedId === id,
  );
  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const outstandingInvoices = invoices.filter(
    (invoice) => invoice.status !== "PAID" && invoice.status !== "VOID",
  );

  return (
    <main className="app-page">
      <DetailHero
        backHref="/companies"
        backLabel={`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to companies", "العودة إلى الشركات")}`}
        category={tr("Company profile", "ملف الشركة")}
        title={company.name}
        description={tr(
          "Account health, linked people, billing exposure, and current pipeline in one operational view.",
          "صحة الحساب والأشخاص المرتبطون والتعرّض للفوترة وخط المبيعات الحالي في عرض تشغيلي واحد.",
        )}
        actions={
          <>
            <Link
              href={`/invoices/new?relatedType=company&relatedId=${id}` as Route}
              className="btn"
            >
              {tr("New invoice", "فاتورة جديدة")}
            </Link>
            <Link href={`/companies/${id}/edit` as Route} className="btn btn-primary">
              {tr("Edit company", "تعديل الشركة")}
            </Link>
          </>
        }
        metrics={[
          { label: tr("Linked contacts", "جهات الاتصال المرتبطة"), value: contacts.length },
          { label: tr("Open deals", "الصفقات المفتوحة"), value: openDeals.length },
          { label: tr("Open tasks", "المهام المفتوحة"), value: openTasks.length },
          {
            label: tr("Outstanding invoices", "الفواتير المستحقة"),
            value: outstandingInvoices.length,
          },
        ]}
        fields={[
          { label: tr("Industry", "القطاع"), value: company.industry ?? "-" },
          { label: tr("Domain", "النطاق"), value: company.domain ?? "-" },
          { label: tr("Size", "الحجم"), value: company.size ?? "-" },
          { label: tr("Saved notes", "الملاحظات المحفوظة"), value: notes.length },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <RelationshipJournalSection
          className="xl:min-h-[420px]"
          relatedType="company"
          relatedId={id}
          title={tr("Relationship journal", "سجل العلاقة")}
          description={tr(
            "Keep every account interaction in one production-ready timeline.",
            "احتفِظ بكل تفاعل للحساب داخل خط زمني واحد جاهز للإنتاج.",
          )}
          notes={notes}
          activities={activity}
          emptyText={tr(
            "No notes or activities recorded for this company yet.",
            "لا توجد ملاحظات أو أنشطة مسجلة لهذه الشركة بعد.",
          )}
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

        <DetailListCard
          title={tr("Contacts", "جهات الاتصال")}
          description={tr(
            "People currently mapped to this account.",
            "الأشخاص المرتبطون حاليًا بهذا الحساب.",
          )}
          emptyText={tr("No linked contacts.", "لا توجد جهات اتصال مرتبطة.")}
          hasItems={contacts.length > 0}
        >
          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface dark:hover:border-white/12 dark:hover:bg-white/[0.04]"
              >
                <Link
                  href={`/contacts/${contact.id}` as Route}
                  className="font-medium hover:underline"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
                <p className="mt-1 text-xs text-mutedfg">
                  {contact.email ?? tr("No email", "بدون بريد")}
                </p>
              </li>
            ))}
          </ul>
        </DetailListCard>

        <DetailListCard
          title={tr("Deals", "الصفقات")}
          description={tr(
            "Pipeline cards tied to this company.",
            "بطاقات خط المبيعات المرتبطة بهذه الشركة.",
          )}
          emptyText={tr("No linked deals.", "لا توجد صفقات مرتبطة.")}
          hasItems={deals.length > 0}
        >
          <ul className="space-y-2">
            {deals.map((deal) => (
              <li
                key={deal.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface dark:hover:border-white/12 dark:hover:bg-white/[0.04]"
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
            "Billing items currently associated with this account.",
            "عناصر الفوترة المرتبطة حاليًا بهذا الحساب.",
          )}
          emptyText={tr(
            "No invoices linked to this company.",
            "لا توجد فواتير مرتبطة بهذه الشركة.",
          )}
          hasItems={invoices.length > 0}
        >
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface dark:hover:border-white/12 dark:hover:bg-white/[0.04]"
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
          title={tr("Tasks", "المهام")}
          description={tr(
            "Follow-ups that still need action on this account.",
            "المتابعات التي ما زالت تحتاج إجراء على هذا الحساب.",
          )}
          emptyText={tr("No related tasks.", "لا توجد مهام مرتبطة.")}
          hasItems={tasks.length > 0}
        >
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-2xl border border-border bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface dark:hover:border-white/12 dark:hover:bg-white/[0.04]"
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
      </section>
    </main>
  );
}
