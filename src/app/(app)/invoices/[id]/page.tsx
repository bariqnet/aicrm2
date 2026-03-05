import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InvoiceDetailActions } from "@/components/InvoiceDetailActions";
import { InvoiceInlineEditor } from "@/components/InvoiceInlineEditor";
import type { Activity, Company, Contact, Invoice } from "@/lib/crm-types";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import {
  serverApiRequest,
  serverApiRequestOrNull,
  SessionInvalidError,
  type ServerListResponse
} from "@/lib/server-crm";

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function statusClass(status: Invoice["status"]): string {
  if (status === "PAID") return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300";
  if (status === "OVERDUE") return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
  if (status === "SENT") return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  if (status === "PARTIALLY_PAID") return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  if (status === "VOID") return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/30 dark:text-zinc-300";
  return "bg-surface2 text-mutedfg";
}

function statusLabel(status: Invoice["status"], tr: (english: string, arabic: string) => string): string {
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
        query: { entityType: "invoice", entityId: id }
      })
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
      <header className="space-y-2">
        <Link href="/invoices" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to invoices", "← العودة إلى الفواتير")}</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">{tr("Invoice detail", "تفاصيل الفاتورة")}</h1>
            <p className="page-subtitle">{tr("Billing context, status, and linked records.", "سياق الفوترة والحالة والسجلات المرتبطة.")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(invoice.status)}`}>
              {statusLabel(invoice.status, tr)}
            </span>
            <InvoiceDetailActions invoiceId={id} />
          </div>
        </div>
      </header>

      <InvoiceInlineEditor
        invoiceId={id}
        initialInvoice={invoice}
        initialRelatedContact={relatedContact}
        initialRelatedCompany={relatedCompany}
      />

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">{tr("Recent activity", "آخر الأنشطة")}</h2>
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
      </section>
    </main>
  );
}
