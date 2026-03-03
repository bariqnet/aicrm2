"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Company, Contact, Invoice, InvoiceStatus } from "@/lib/crm-types";
import {
  buildInvoiceNotes,
  computeInvoiceItemsTotal,
  parseInvoiceNotes,
  sanitizeInvoiceLineItems
} from "@/lib/invoice-items";
import { INVOICE_STATUS_VALUES } from "@/lib/invoices";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";
import { fmtMoney } from "@/lib/utils";

type DraftInvoiceItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceInlineEditorProps = {
  invoiceId: string;
  initialInvoice: Invoice;
  initialRelatedContact: Contact | null;
  initialRelatedCompany: Company | null;
};

function createDraftInvoiceItem(): DraftInvoiceItem {
  const idSeed = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
  return {
    id: idSeed,
    description: "",
    quantity: "",
    unitPrice: ""
  };
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function toInputDate(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function fmtDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

export function InvoiceInlineEditor({
  invoiceId,
  initialInvoice,
  initialRelatedContact,
  initialRelatedCompany
}: InvoiceInlineEditorProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const locale = language === "ar" ? "ar-IQ" : "en-US";

  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<InvoiceStatus>("DRAFT");
  const [notes, setNotes] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [relatedType, setRelatedType] = useState<"" | "contact" | "company">("");
  const [relatedId, setRelatedId] = useState("");
  const [items, setItems] = useState<DraftInvoiceItem[]>([]);

  const parsedViewNotes = useMemo(() => parseInvoiceNotes(invoice.notes), [invoice.notes]);
  const viewItems = useMemo(
    () => sanitizeInvoiceLineItems(invoice.items ?? parsedViewNotes.items),
    [invoice.items, parsedViewNotes.items]
  );
  const viewItemsTotal = useMemo(() => computeInvoiceItemsTotal(viewItems), [viewItems]);
  const hasViewItems = viewItems.length > 0;
  const displayAmount = hasViewItems ? viewItemsTotal : invoice.amount;

  const filledItemRows = useMemo(
    () =>
      items.filter((item) =>
        item.description.trim() || item.quantity.trim() || item.unitPrice.trim()
      ),
    [items]
  );

  const normalizedItems = useMemo(
    () =>
      sanitizeInvoiceLineItems(
        filledItemRows.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      ),
    [filledItemRows]
  );

  const itemsTotal = useMemo(() => computeInvoiceItemsTotal(normalizedItems), [normalizedItems]);
  const usingItemsTotal = filledItemRows.length > 0;

  const relatedOptions = useMemo(
    () => (relatedType === "contact" ? contacts : relatedType === "company" ? companies : []),
    [relatedType, contacts, companies]
  );

  const contactNameById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, `${contact.firstName} ${contact.lastName}`.trim()])),
    [contacts]
  );
  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies]
  );

  const currentContactId = invoice.relatedType === "contact"
    ? invoice.relatedId
    : invoice.contactId;
  const currentCompanyId = invoice.relatedType === "company"
    ? invoice.relatedId
    : invoice.companyId;

  const currentContactName = currentContactId
    ? contactNameById.get(currentContactId)
      ?? (initialRelatedContact?.id === currentContactId ? `${initialRelatedContact.firstName} ${initialRelatedContact.lastName}`.trim() : null)
    : null;

  const currentCompanyName = currentCompanyId
    ? companyNameById.get(currentCompanyId)
      ?? (initialRelatedCompany?.id === currentCompanyId ? initialRelatedCompany.name : null)
    : null;

  useEffect(() => {
    setInvoice(initialInvoice);
  }, [initialInvoice]);

  async function loadOptions() {
    if (contacts.length > 0 || companies.length > 0) return;
    setLoadingOptions(true);
    try {
      const [contactsResponse, companiesResponse] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/companies")
      ]);

      if (contactsResponse.ok) {
        const contactsPayload = await contactsResponse.json() as { rows?: Contact[] };
        setContacts(contactsPayload.rows ?? []);
      }
      if (companiesResponse.ok) {
        const companiesPayload = await companiesResponse.json() as { rows?: Company[] };
        setCompanies(companiesPayload.rows ?? []);
      }
    } finally {
      setLoadingOptions(false);
    }
  }

  function hydrateEditState(source: Invoice) {
    const parsedNotes = parseInvoiceNotes(source.notes);
    const sourceItems = sanitizeInvoiceLineItems(source.items ?? parsedNotes.items);

    setInvoiceNumber(source.invoiceNumber ?? "");
    setTitle(source.title ?? "");
    setAmount(String(sourceItems.length > 0 ? computeInvoiceItemsTotal(sourceItems) : source.amount ?? 0));
    setCurrency(source.currency ?? "USD");
    setStatus(source.status ?? "DRAFT");
    setNotes(parsedNotes.plainNotes);
    setIssuedAt(toInputDate(source.issuedAt));
    setDueAt(toInputDate(source.dueAt));
    setPaidAt(toInputDate(source.paidAt));
    const normalizedType =
      source.relatedType === "contact" || source.relatedType === "company"
        ? source.relatedType
        : "";
    setRelatedType(normalizedType);
    setRelatedId(source.relatedId ?? source.contactId ?? source.companyId ?? "");
    setItems(
      sourceItems.map((item) => ({
        id: createDraftInvoiceItem().id,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice)
      }))
    );
  }

  async function startInlineEdit() {
    await loadOptions();
    hydrateEditState(invoice);
    setEditing(true);
  }

  function cancelInlineEdit() {
    hydrateEditState(invoice);
    setEditing(false);
  }

  function addItemRow() {
    setItems((current) => [...current, createDraftInvoiceItem()]);
  }

  function updateItemRow(id: string, field: "description" | "quantity" | "unitPrice", value: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function removeItemRow(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function submitInlineEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (relatedType && !relatedId) {
      await showErrorAlert(tr("Missing related record", "السجل المرتبط مفقود"), tr("Select a related record or clear the related type.", "اختر سجلًا مرتبطًا أو امسح نوع الارتباط."));
      return;
    }

    if (filledItemRows.length !== normalizedItems.length) {
      await showErrorAlert(
        tr("Invalid line item", "عنصر فاتورة غير صالح"),
        tr("Each line item must include description, quantity greater than 0, and unit price 0 or higher.", "كل عنصر يجب أن يحتوي على وصف وكمية أكبر من 0 وسعر وحدة يساوي 0 أو أكثر.")
      );
      return;
    }

    const parsedAmount = usingItemsTotal ? itemsTotal : Number(amount);
    if (!usingItemsTotal && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      await showErrorAlert(tr("Invalid amount", "مبلغ غير صالح"), tr("Amount must be a valid non-negative number when no items are provided.", "يجب أن يكون المبلغ رقمًا صالحًا غير سالب عند عدم إضافة عناصر."));
      return;
    }

    setSaving(true);
    try {
      const encodedNotes = buildInvoiceNotes(notes, normalizedItems);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim(),
          title: title.trim(),
          amount: parsedAmount,
          currency: currency.trim().toUpperCase() || "USD",
          status,
          notes: encodedNotes,
          relatedType: relatedType || undefined,
          relatedId: relatedId || undefined,
          issuedAt: toIsoDateTime(issuedAt),
          dueAt: toIsoDateTime(dueAt),
          paidAt: toIsoDateTime(paidAt) ?? (status === "PAID" ? new Date().toISOString() : undefined)
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          tr("Unable to update invoice", "تعذر تحديث الفاتورة"),
          await getResponseError(response, tr("Please check your input and try again.", "يرجى التحقق من البيانات والمحاولة مرة أخرى."))
        );
        return;
      }

      const updatedInvoice = await response.json() as Invoice;
      setInvoice({
        ...invoice,
        ...updatedInvoice,
        amount: parsedAmount,
        notes: updatedInvoice.notes ?? encodedNotes ?? null,
        items: normalizedItems.length > 0 ? normalizedItems : null,
        relatedType: relatedType || null,
        relatedId: relatedId || null
      });
      setEditing(false);
      await showSuccessAlert(tr("Invoice updated", "تم تحديث الفاتورة"));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to update invoice", "تعذر تحديث الفاتورة");
      await showErrorAlert(tr("Unable to update invoice", "تعذر تحديث الفاتورة"), message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <section className="panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button className="btn" type="button" onClick={startInlineEdit}>
            {tr("Inline edit", "تعديل مباشر")}
          </button>
          <Link href={`/invoices/${invoiceId}/edit` as Route} className="btn">
            {tr("Full edit page", "صفحة التعديل الكاملة")}
          </Link>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>{tr("Invoice", "الفاتورة")}: <span className="font-medium">{invoice.invoiceNumber}</span></p>
          <p>{tr("Title", "العنوان")}: <span className="text-mutedfg">{invoice.title}</span></p>
          <p>{tr("Amount", "المبلغ")}: <span className="text-mutedfg">{fmtMoney(displayAmount, invoice.currency)}</span></p>
          <p>{tr("Issued", "الإصدار")}: <span className="text-mutedfg">{fmtDateTime(invoice.issuedAt, locale)}</span></p>
          <p>{tr("Due", "الاستحقاق")}: <span className="text-mutedfg">{fmtDateTime(invoice.dueAt, locale)}</span></p>
          <p>{tr("Paid", "الدفع")}: <span className="text-mutedfg">{fmtDateTime(invoice.paidAt, locale)}</span></p>
          <p>
            {tr("Related contact", "جهة الاتصال المرتبطة")}:{" "}
            {currentContactId ? (
              <Link href={`/contacts/${currentContactId}` as Route} className="text-accent hover:underline">
                {currentContactName ?? currentContactId}
              </Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
          <p>
            {tr("Related company", "الشركة المرتبطة")}:{" "}
            {currentCompanyId ? (
              <Link href={`/companies/${currentCompanyId}` as Route} className="text-accent hover:underline">
                {currentCompanyName ?? currentCompanyId}
              </Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
        </div>

        {hasViewItems ? (
          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface2 text-xs uppercase tracking-[0.08em] text-mutedfg">
                <tr>
                  <th className="px-3 py-2">{tr("Description", "الوصف")}</th>
                  <th className="px-3 py-2 text-right">{tr("Qty", "الكمية")}</th>
                  <th className="px-3 py-2 text-right">{tr("Unit price", "سعر الوحدة")}</th>
                  <th className="px-3 py-2 text-right">{tr("Line total", "إجمالي السطر")}</th>
                </tr>
              </thead>
              <tbody>
                {viewItems.map((item, index) => (
                  <tr key={`${item.description}-${index}`} className="border-t border-border">
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right text-mutedfg">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-mutedfg">{fmtMoney(item.unitPrice, invoice.currency)}</td>
                    <td className="px-3 py-2 text-right font-medium">{fmtMoney(item.quantity * item.unitPrice, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface2/60">
                  <td colSpan={3} className="px-3 py-2 text-right font-medium">{tr("Subtotal", "الإجمالي الفرعي")}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fmtMoney(viewItemsTotal, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}

        {parsedViewNotes.plainNotes ? (
          <div className="mt-3 rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
            <p className="muted-label">{tr("Notes", "ملاحظات")}</p>
            <p className="mt-1 whitespace-pre-wrap">{parsedViewNotes.plainNotes}</p>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <form className="space-y-4" onSubmit={submitInlineEdit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            {tr("Invoice number", "رقم الفاتورة")}
            <input
              className="input mt-1 w-full"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Status", "الحالة")}
            <select
              className="input mt-1 w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value as InvoiceStatus)}
            >
              {INVOICE_STATUS_VALUES.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusValue === "DRAFT"
                    ? tr("Draft", "مسودة")
                    : statusValue === "SENT"
                      ? tr("Sent", "مرسلة")
                      : statusValue === "PARTIALLY_PAID"
                        ? tr("Partially paid", "مدفوعة جزئيًا")
                        : statusValue === "PAID"
                          ? tr("Paid", "مدفوعة")
                          : statusValue === "OVERDUE"
                            ? tr("Overdue", "متأخرة")
                            : statusValue === "VOID"
                              ? tr("Void", "ملغاة")
                              : statusValue}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            {tr("Title", "العنوان")}
            <input
              className="input mt-1 w-full"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <section className="sm:col-span-2 rounded-xl border border-border bg-surface2/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{tr("Line items", "عناصر الفاتورة")}</p>
              <button className="btn h-8 px-2 text-xs" type="button" onClick={addItemRow}>
                {tr("Add item", "إضافة عنصر")}
              </button>
            </div>

            {items.length === 0 ? (
              <p className="mt-3 text-sm text-mutedfg">{tr("No items yet. Add at least one line item for invoice breakdown.", "لا توجد عناصر بعد. أضف عنصرًا واحدًا على الأقل لتفصيل الفاتورة.")}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {items.map((item, index) => {
                  const quantity = Number(item.quantity);
                  const unitPrice = Number(item.unitPrice);
                  const lineTotal = Number.isFinite(quantity) && Number.isFinite(unitPrice)
                    ? Math.max(0, quantity) * Math.max(0, unitPrice)
                    : 0;

                  return (
                    <div key={item.id} className="rounded-lg border border-border bg-surface p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-mutedfg">{tr("Item", "عنصر")} {index + 1}</p>
                        <button
                          className="text-xs text-red-600 hover:underline"
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                        >
                          {tr("Remove", "إزالة")}
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-12">
                        <label className="text-xs sm:col-span-6">
                          {tr("Description", "الوصف")}
                          <input
                            className="input mt-1 h-9 w-full"
                            value={item.description}
                            onChange={(event) => updateItemRow(item.id, "description", event.target.value)}
                          />
                        </label>
                        <label className="text-xs sm:col-span-2">
                          {tr("Qty", "الكمية")}
                          <input
                            className="input mt-1 h-9 w-full"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) => updateItemRow(item.id, "quantity", event.target.value)}
                          />
                        </label>
                        <label className="text-xs sm:col-span-2">
                          {tr("Unit price", "سعر الوحدة")}
                          <input
                            className="input mt-1 h-9 w-full"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) => updateItemRow(item.id, "unitPrice", event.target.value)}
                          />
                        </label>
                        <div className="text-xs sm:col-span-2">
                          {tr("Line total", "إجمالي السطر")}
                          <p className="mt-1 h-9 rounded-md border border-border bg-surface2 px-2 py-2 text-sm">
                            {fmtMoney(lineTotal, currency.trim().toUpperCase() || "USD")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="font-medium">{tr("Items subtotal", "إجمالي العناصر الفرعي")}</span>
              <span className="font-semibold">{fmtMoney(itemsTotal, currency.trim().toUpperCase() || "USD")}</span>
            </div>
          </section>

          <label className="text-sm">
            {tr("Amount", "المبلغ")}
            <input
              className="input mt-1 w-full"
              value={usingItemsTotal ? String(itemsTotal) : amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              readOnly={usingItemsTotal}
              required
            />
            {usingItemsTotal ? (
              <p className="mt-1 text-xs text-mutedfg">{tr("Amount is auto-calculated from line items.", "يتم حساب المبلغ تلقائيًا من عناصر الفاتورة.")}</p>
            ) : null}
          </label>
          <label className="text-sm">
            {tr("Currency", "العملة")}
            <input
              className="input mt-1 w-full"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              maxLength={8}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Issued at", "تاريخ الإصدار")}
            <input className="input mt-1 w-full" type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} />
          </label>
          <label className="text-sm">
            {tr("Due at", "تاريخ الاستحقاق")}
            <input className="input mt-1 w-full" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </label>
          <label className="text-sm">
            {tr("Paid at", "تاريخ الدفع")}
            <input className="input mt-1 w-full" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
          </label>
          <label className="text-sm">
            {tr("Related type", "نوع الارتباط")}
            <select
              className="input mt-1 w-full"
              value={relatedType}
              onChange={(event) => {
                const value = event.target.value as "" | "contact" | "company";
                setRelatedType(value);
                setRelatedId("");
              }}
              disabled={loadingOptions}
            >
              <option value="">{tr("None", "بدون")}</option>
              <option value="contact">{tr("Contact", "جهة اتصال")}</option>
              <option value="company">{tr("Company", "شركة")}</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            {tr("Related record", "السجل المرتبط")}
            <select
              className="input mt-1 w-full"
              value={relatedId}
              onChange={(event) => setRelatedId(event.target.value)}
              disabled={!relatedType || loadingOptions}
            >
              <option value="">
                {relatedType
                  ? `${tr("Select", "اختر")} ${relatedType === "contact" ? tr("Contact", "جهة اتصال") : tr("Company", "شركة")}`
                  : tr("Choose related type first", "اختر نوع الارتباط أولًا")}
              </option>
              {relatedOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {"firstName" in option ? `${option.firstName} ${option.lastName}`.trim() : option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            {tr("Notes", "ملاحظات")}
            <textarea
              className="input mt-1 h-auto min-h-24 w-full py-2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn" type="button" onClick={cancelInlineEdit} disabled={saving}>
            {tr("Cancel", "إلغاء")}
          </button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? tr("Saving...", "جاري الحفظ...") : tr("Save changes", "حفظ التغييرات")}
          </button>
        </div>
      </form>
    </section>
  );
}
