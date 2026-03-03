"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Company, Contact, InvoiceStatus } from "@/lib/crm-types";
import { INVOICE_STATUS_VALUES } from "@/lib/invoices";
import { buildInvoiceNotes, computeInvoiceItemsTotal, sanitizeInvoiceLineItems } from "@/lib/invoice-items";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";
import { fmtMoney } from "@/lib/utils";

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
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

export default function NewInvoicePage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRelatedType = searchParams.get("relatedType");
  const initialRelatedId = searchParams.get("relatedId");

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
  const [relatedType, setRelatedType] = useState<"" | "contact" | "company">(
    initialRelatedType === "contact" || initialRelatedType === "company" ? initialRelatedType : ""
  );
  const [relatedId, setRelatedId] = useState(initialRelatedId ?? "");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [contactsResponse, companiesResponse] = await Promise.all([
          fetch("/api/contacts"),
          fetch("/api/companies")
        ]);

        if (!cancelled && contactsResponse.ok) {
          const contactsPayload = await contactsResponse.json() as { rows?: Contact[] };
          setContacts(contactsPayload.rows ?? []);
        }
        if (!cancelled && companiesResponse.ok) {
          const companiesPayload = await companiesResponse.json() as { rows?: Company[] };
          setCompanies(companiesPayload.rows ?? []);
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    loadOptions().catch(() => {
      if (!cancelled) setLoadingOptions(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
      const response = await fetch("/api/invoices", {
        method: "POST",
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
          tr("Unable to create invoice", "تعذر إنشاء الفاتورة"),
          await getResponseError(response, tr("Please check your input and try again.", "يرجى التحقق من البيانات والمحاولة مرة أخرى."))
        );
        return;
      }

      const createdInvoice = await response.json() as { id?: string };
      await showSuccessAlert(tr("Invoice created", "تم إنشاء الفاتورة"));
      const target = (createdInvoice.id ? `/invoices/${createdInvoice.id}` : "/invoices") as Route;
      router.push(target);
      router.refresh();
    } catch {
      await showErrorAlert(
        tr("Unable to create invoice", "تعذر إنشاء الفاتورة"),
        tr("Something went wrong. Please check your connection and try again.", "حدث خطأ ما. يرجى التحقق من الاتصال والمحاولة مرة أخرى.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/invoices" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to invoices", "← العودة إلى الفواتير")}</Link>
        <h1 className="page-title mt-2">{tr("New invoice", "فاتورة جديدة")}</h1>
        <p className="page-subtitle">{tr("Create and link an invoice to a contact or company.", "أنشئ فاتورة واربطها بجهة اتصال أو شركة.")}</p>
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
              placeholder={tr("Implementation phase 1", "مرحلة التنفيذ الأولى")}
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
                            placeholder={tr("Service or product description", "وصف الخدمة أو المنتج")}
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
              placeholder={tr("Amount", "المبلغ")}
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
              placeholder="USD"
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
              placeholder={tr("Optional context for this invoice", "سياق اختياري لهذه الفاتورة")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/invoices" className="btn">{tr("Cancel", "إلغاء")}</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? tr("Creating...", "جاري الإنشاء...") : tr("Create invoice", "إنشاء الفاتورة")}
          </button>
        </div>
      </form>
    </main>
  );
}
