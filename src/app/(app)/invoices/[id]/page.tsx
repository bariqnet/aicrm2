import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { InvoiceDetailActions } from "@/components/InvoiceDetailActions";
import { InvoiceInlineEditor } from "@/components/InvoiceInlineEditor";
import { DetailHero } from "@/components/detail/DetailHero";
import { DetailListCard } from "@/components/detail/DetailListCard";
import type { Activity, Company, Contact, Invoice } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";
import {
  serverApiRequest,
  serverApiRequestOrNull,
  SessionInvalidError,
  type ServerListResponse,
} from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function statusClass(status: Invoice["status"]): string {
  if (status === "PAID") return "border-green-200 bg-green-50 text-green-700";
  if (status === "OVERDUE") return "border-red-200 bg-red-50 text-red-700";
  if (status === "SENT") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "PARTIALLY_PAID") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "VOID") return "border-zinc-200 bg-zinc-100 text-zinc-700";
  return "border-border bg-surface2 text-mutedfg";
}

function statusLabel(
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

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  let invoice: Invoice | null = null;

  try {
    invoice = await serverApiRequestOrNull<Invoice>(`/invoices/${id}`);
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect(`/auth/sign-in?expired=1&next=/invoices/${id}`);
    }
    throw error;
  }

  if (!invoice) notFound();

  let relatedContact: Contact | null = null;
  let relatedCompany: Company | null = null;
  let activityPayload: ServerListResponse<Activity>;

  try {
    [relatedContact, relatedCompany, activityPayload] = await Promise.all([
      invoice.relatedType === "contact" && invoice.relatedId
        ? serverApiRequestOrNull<Contact>(`/contacts/${invoice.relatedId}`)
        : invoice.contactId
          ? serverApiRequestOrNull<Contact>(`/contacts/${invoice.contactId}`)
          : Promise.resolve(null),
      invoice.relatedType === "company" && invoice.relatedId
        ? serverApiRequestOrNull<Company>(`/companies/${invoice.relatedId}`)
        : invoice.companyId
          ? serverApiRequestOrNull<Company>(`/companies/${invoice.companyId}`)
          : Promise.resolve(null),
      serverApiRequest<ServerListResponse<Activity>>("/activities", {
        query: { entityType: "invoice", entityId: id },
      }),
    ]);
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect(`/auth/sign-in?expired=1&next=/invoices/${id}`);
    }
    throw error;
  }

  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "invoice" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main className="app-page">
      <DetailHero
        backHref="/invoices"
        backLabel={`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to invoices", "العودة إلى الفواتير")}`}
        category={tr("Invoice detail", "تفاصيل الفاتورة")}
        title={invoice.invoiceNumber}
        description={invoice.title}
        actions={<InvoiceDetailActions invoiceId={id} />}
        badge={
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(invoice.status)}`}
          >
            {statusLabel(invoice.status, tr)}
          </span>
        }
        metrics={[
          { label: tr("Total", "الإجمالي"), value: fmtMoney(invoice.amount, invoice.currency) },
          { label: tr("Activity", "النشاط"), value: activity.length },
          { label: tr("Issued", "الإصدار"), value: fmtDateTime(invoice.issuedAt, locale) },
          { label: tr("Due", "الاستحقاق"), value: fmtDateTime(invoice.dueAt, locale) },
        ]}
        fields={[
          {
            label: tr("Company", "الشركة"),
            value: relatedCompany ? (
              <Link
                href={`/companies/${relatedCompany.id}` as Route}
                className="text-accent hover:underline"
              >
                {relatedCompany.name}
              </Link>
            ) : (
              "-"
            ),
          },
          {
            label: tr("Contact", "جهة الاتصال"),
            value: relatedContact ? (
              <Link
                href={`/contacts/${relatedContact.id}` as Route}
                className="text-accent hover:underline"
              >
                {relatedContact.firstName} {relatedContact.lastName}
              </Link>
            ) : (
              "-"
            ),
          },
          { label: tr("Currency", "العملة"), value: invoice.currency },
          { label: tr("Paid at", "تاريخ الدفع"), value: fmtDateTime(invoice.paidAt, locale) },
        ]}
      />

      <InvoiceInlineEditor
        invoiceId={id}
        initialInvoice={invoice}
        initialRelatedContact={relatedContact}
        initialRelatedCompany={relatedCompany}
      />

      <DetailListCard
        title={tr("Recent activity", "آخر الأنشطة")}
        description={tr(
          "Latest billing and workflow events tied to this invoice.",
          "أحدث أحداث الفوترة وسير العمل المرتبطة بهذه الفاتورة.",
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
    </main>
  );
}
