import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InvoicePrintControls } from "@/components/InvoicePrintControls";
import type { Company, Contact, Invoice } from "@/lib/crm-types";
import { computeInvoiceItemsTotal, parseInvoiceNotes, sanitizeInvoiceLineItems } from "@/lib/invoice-items";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import {
  serverApiRequestOrNull,
  SessionInvalidError
} from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale);
}

function statusLabel(value: Invoice["status"], tr: (english: string, arabic: string) => string): string {
  if (value === "DRAFT") return tr("Draft", "مسودة");
  if (value === "SENT") return tr("Sent", "مرسلة");
  if (value === "PARTIALLY_PAID") return tr("Partially paid", "مدفوعة جزئيًا");
  if (value === "PAID") return tr("Paid", "مدفوعة");
  if (value === "OVERDUE") return tr("Overdue", "متأخرة");
  if (value === "VOID") return tr("Void", "ملغاة");
  return tr("Unknown", "غير معروف");
}

function statusClass(status: Invoice["status"]): string {
  if (status === "PAID") return "bg-green-100 text-green-800";
  if (status === "OVERDUE") return "bg-red-100 text-red-800";
  if (status === "SENT") return "bg-blue-100 text-blue-800";
  if (status === "PARTIALLY_PAID") return "bg-amber-100 text-amber-800";
  if (status === "VOID") return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-100 text-zinc-700";
}

export default async function InvoicePrintPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { id } = await params;
  const query = await searchParams;
  const autoPrint = query.autoprint === "1";
  const signInNext = `/print/invoices/${id}`;

  let invoice: Invoice | null = null;

  try {
    invoice = await serverApiRequestOrNull<Invoice>(`/invoices/${id}`);
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect(`/auth/sign-in?expired=1&next=${encodeURIComponent(signInNext)}`);
    }
    throw error;
  }

  if (!invoice) notFound();

  let relatedContact: Contact | null = null;
  let relatedCompany: Company | null = null;

  try {
    [relatedContact, relatedCompany] = await Promise.all([
      invoice.relatedType === "contact" && invoice.relatedId
        ? serverApiRequestOrNull<Contact>(`/contacts/${invoice.relatedId}`)
        : invoice.contactId
          ? serverApiRequestOrNull<Contact>(`/contacts/${invoice.contactId}`)
          : Promise.resolve(null),
      invoice.relatedType === "company" && invoice.relatedId
        ? serverApiRequestOrNull<Company>(`/companies/${invoice.relatedId}`)
        : invoice.companyId
          ? serverApiRequestOrNull<Company>(`/companies/${invoice.companyId}`)
          : Promise.resolve(null)
    ]);
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect(`/auth/sign-in?expired=1&next=${encodeURIComponent(signInNext)}`);
    }
    throw error;
  }

  const billToName = relatedCompany?.name
    ?? (relatedContact ? `${relatedContact.firstName} ${relatedContact.lastName}`.trim() : tr("Unassigned", "غير محدد"));

  const billToLines = [
    relatedCompany?.name,
    relatedContact ? `${relatedContact.firstName} ${relatedContact.lastName}`.trim() : null,
    relatedContact?.email ?? null,
    relatedContact?.phone ?? null
  ].filter(Boolean);

  const parsedInvoiceNotes = parseInvoiceNotes(invoice.notes);
  const parsedItems = sanitizeInvoiceLineItems(invoice.items ?? parsedInvoiceNotes.items);
  const invoiceItems = parsedItems.length > 0
    ? parsedItems
    : [{ description: invoice.title, quantity: 1, unitPrice: invoice.amount }];
  const subtotal = computeInvoiceItemsTotal(invoiceItems);

  return (
    <main className="min-h-screen bg-zinc-100 px-3 py-4 sm:px-6 sm:py-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:px-8 print:hidden">
          <Link href={`/invoices/${id}`} className="btn">
            {tr("Back to invoice", "العودة إلى الفاتورة")}
          </Link>
          <InvoicePrintControls autoPrint={autoPrint} />
        </header>

        <section className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <Image
                src="/fav.png"
                alt="Que"
                width={72}
                height={72}
                className="h-auto w-[72px]"
                priority
              />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{tr("From", "من")}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Que CRM</p>
                <p className="text-sm text-zinc-500">{tr("AI-driven relationship platform", "منصة علاقات مدعومة بالذكاء الاصطناعي")}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{tr("Invoice", "فاتورة")}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{invoice.invoiceNumber}</h1>
              <p className="mt-2 text-sm text-zinc-600">{invoice.title}</p>
              <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusClass(invoice.status)}`}>
                {statusLabel(invoice.status, tr)}
              </span>
            </div>
          </div>

          <div className="grid gap-6 border-y border-zinc-200 py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{tr("Bill to", "فاتورة إلى")}</p>
              <p className="mt-1 text-base font-semibold text-zinc-900">{billToName}</p>
              {billToLines.length > 0 ? (
                <div className="mt-2 space-y-1 text-zinc-600">
                  {billToLines.map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-zinc-500">{tr("No related contact or company selected.", "لم يتم اختيار جهة اتصال أو شركة مرتبطة.")}</p>
              )}
            </div>
            <dl className="space-y-2 text-zinc-600">
              <div className="flex items-center justify-between gap-4">
                <dt>{tr("Issue date", "تاريخ الإصدار")}</dt>
                <dd className="font-medium text-zinc-900">{fmtDate(invoice.issuedAt, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>{tr("Due date", "تاريخ الاستحقاق")}</dt>
                <dd className="font-medium text-zinc-900">{fmtDate(invoice.dueAt, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>{tr("Paid date", "تاريخ الدفع")}</dt>
                <dd className="font-medium text-zinc-900">{fmtDate(invoice.paidAt, locale)}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{tr("Description", "الوصف")}</th>
                  <th className="px-4 py-3 text-right">{tr("Amount", "المبلغ")}</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item, index) => (
                  <tr key={`${item.description}-${index}`} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-800">
                      <p>{item.description}</p>
                      <p className="text-xs text-zinc-500">
                        {item.quantity} × {fmtMoney(item.unitPrice, invoice.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900">
                      {fmtMoney(item.quantity * item.unitPrice, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <dl className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex items-center justify-between text-zinc-600">
                <dt>{tr("Subtotal", "الإجمالي الفرعي")}</dt>
                <dd>{fmtMoney(subtotal, invoice.currency)}</dd>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <dt>{tr("Tax", "الضريبة")}</dt>
                <dd>{fmtMoney(0, invoice.currency)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900">
                <dt>{tr("Total", "الإجمالي")}</dt>
                <dd>{fmtMoney(subtotal, invoice.currency)}</dd>
              </div>
            </dl>
          </div>

          {parsedInvoiceNotes.plainNotes ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{tr("Notes", "ملاحظات")}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{parsedInvoiceNotes.plainNotes}</p>
            </div>
          ) : null}

          <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-500">
            <p>{tr("Generated from Que CRM on", "تم الإنشاء من كيو CRM بتاريخ")} {new Date().toLocaleString(locale)}.</p>
            <p className="mt-1">{tr("Thank you for your business.", "شكرًا لتعاملكم معنا.")}</p>
          </footer>
        </section>
      </div>
    </main>
  );
}
