"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Company, Contact, Invoice, InvoiceStatus } from "@/lib/crm-types";
import { INVOICE_STATUS_VALUES } from "@/lib/invoices";
import {
  buildInvoiceNotes,
  computeInvoiceItemsTotal,
  parseInvoiceNotes,
  sanitizeInvoiceLineItems
} from "@/lib/invoice-items";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";
import { fmtMoney } from "@/lib/utils";

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

type DraftInvoiceItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
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

export default function EditInvoicePage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<InvoiceStatus>("DRAFT");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftInvoiceItem[]>([]);
  const [issuedAt, setIssuedAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [relatedType, setRelatedType] = useState<"" | "contact" | "company">("");
  const [relatedId, setRelatedId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoiceAndOptions() {
      const [invoiceResult, contactsResult, companiesResult] = await Promise.allSettled([
        fetch(`/api/invoices/${invoiceId}`),
        fetch("/api/contacts"),
        fetch("/api/companies")
      ]);

      if (cancelled) return;

      if (invoiceResult.status !== "fulfilled" || !invoiceResult.value.ok) {
        const message =
          invoiceResult.status === "fulfilled"
            ? await getResponseError(invoiceResult.value, tr("Unable to load invoice", "تعذر تحميل الفاتورة"))
            : tr("Unable to load invoice", "تعذر تحميل الفاتورة");
        throw new Error(message);
      }

      const invoicePayload = (await invoiceResult.value.json()) as Invoice;
      if (cancelled) return;

      setInvoiceNumber(invoicePayload.invoiceNumber ?? "");
      setTitle(invoicePayload.title ?? "");
      setAmount(String(invoicePayload.amount ?? 0));
      setCurrency(invoicePayload.currency ?? "USD");
      setStatus(invoicePayload.status ?? "DRAFT");
      const parsedInvoiceNotes = parseInvoiceNotes(invoicePayload.notes);
      const sourceItems = invoicePayload.items ?? parsedInvoiceNotes.items;
      setNotes(parsedInvoiceNotes.plainNotes);
      setItems(
        sourceItems.map((item) => ({
          id: createDraftInvoiceItem().id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice)
        }))
      );
      setIssuedAt(toInputDate(invoicePayload.issuedAt));
      setDueAt(toInputDate(invoicePayload.dueAt));
      setPaidAt(toInputDate(invoicePayload.paidAt));
      const normalizedType =
        invoicePayload.relatedType === "contact" || invoicePayload.relatedType === "company"
          ? invoicePayload.relatedType
          : "";
      setRelatedType(normalizedType);
      setRelatedId(invoicePayload.relatedId ?? invoicePayload.contactId ?? invoicePayload.companyId ?? "");

      if (contactsResult.status === "fulfilled" && contactsResult.value.ok) {
        const contactsPayload = (await contactsResult.value.json()) as { rows?: Contact[] };
        if (!cancelled) setContacts(contactsPayload.rows ?? []);
      }
      if (companiesResult.status === "fulfilled" && companiesResult.value.ok) {
        const companiesPayload = (await companiesResult.value.json()) as { rows?: Company[] };
        if (!cancelled) setCompanies(companiesPayload.rows ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    loadInvoiceAndOptions().catch(async (error) => {
      const message = error instanceof Error ? error.message : tr("Unable to load invoice", "تعذر تحميل الفاتورة");
      if (!cancelled) {
        await showErrorAlert(tr("Unable to load invoice", "تعذر تحميل الفاتورة"), message);
        router.push("/invoices");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [invoiceId, router]);

  const relatedOptions = useMemo(
    () => (relatedType === "contact" ? contacts : relatedType === "company" ? companies : []),
    [relatedType, contacts, companies]
  );

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

  async function submit(event: FormEvent<HTMLFormElement>) {
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

      await showSuccessAlert(tr("Invoice updated", "تم تحديث الفاتورة"));
      router.push(`/invoices/${invoiceId}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to update invoice", "تعذر تحديث الفاتورة");
      await showErrorAlert(tr("Unable to update invoice", "تعذر تحديث الفاتورة"), message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/invoices/${invoiceId}`} className="text-sm text-mutedfg hover:text-fg">{tr("← Back to invoice", "← العودة إلى الفاتورة")}</Link>
        <h1 className="page-title mt-2">{tr("Edit invoice", "تعديل الفاتورة")}</h1>
        <p className="page-subtitle">{tr("Update billing details and related record context.", "حدّث تفاصيل الفوترة وسياق السجل المرتبط.")}</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            {tr("Invoice number", "رقم الفاتورة")}
            <input
              className="input mt-1 w-full"
              placeholder="INV-1001"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Status", "الحالة")}
            <select
              className="input mt-1 w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value as InvoiceStatus)}
              disabled={loading}
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
              placeholder={tr("Implementation phase 1", "مرحلة التنفيذ الأولى")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <section className="sm:col-span-2 rounded-xl border border-border bg-surface2/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{tr("Line items", "عناصر الفاتورة")}</p>
              <button className="btn h-8 px-2 text-xs" type="button" onClick={addItemRow} disabled={loading}>
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
                          className="text-xs text-red-600 hover:underline disabled:opacity-60"
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          disabled={loading}
                        >
                          {tr("Remove", "إزالة")}
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-12">
                        <label className="text-xs sm:col-span-6">
                          {tr("Description", "الوصف")}
                          <input
                            className="input mt-1 h-9 w-full"
                            placeholder={tr("Service or product description", "وصف الخدمة أو المنتج")}
                            value={item.description}
                            onChange={(event) => updateItemRow(item.id, "description", event.target.value)}
                            disabled={loading}
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
                            disabled={loading}
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
                            disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Issued at", "تاريخ الإصدار")}
            <input className="input mt-1 w-full" type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Due at", "تاريخ الاستحقاق")}
            <input className="input mt-1 w-full" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Paid at", "تاريخ الدفع")}
            <input className="input mt-1 w-full" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} disabled={loading} />
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
              disabled={loading}
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
              disabled={!relatedType || loading}
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
              placeholder={tr("Optional context for this invoice", "سياق اختياري لهذه الفاتورة")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/invoices/${invoiceId}`} className="btn">{tr("Cancel", "إلغاء")}</Link>
          <button className="btn btn-primary" type="submit" disabled={loading || saving}>
            {loading ? tr("Loading...", "جاري التحميل...") : saving ? tr("Saving...", "جاري الحفظ...") : tr("Save changes", "حفظ التغييرات")}
          </button>
        </div>
      </form>
    </main>
  );
}
