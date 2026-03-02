"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Company, Contact, InvoiceStatus } from "@/lib/crm-types";
import { INVOICE_STATUS_VALUES } from "@/lib/invoices";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export default function NewInvoicePage() {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (relatedType && !relatedId) {
      await showErrorAlert("Missing related record", "Select a related record or clear the related type.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      await showErrorAlert("Invalid amount", "Amount must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim(),
          title: title.trim(),
          amount: parsedAmount,
          currency: currency.trim().toUpperCase() || "USD",
          status,
          notes: notes.trim() || undefined,
          relatedType: relatedType || undefined,
          relatedId: relatedId || undefined,
          issuedAt: toIsoDateTime(issuedAt),
          dueAt: toIsoDateTime(dueAt),
          paidAt: toIsoDateTime(paidAt) ?? (status === "PAID" ? new Date().toISOString() : undefined)
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          "Unable to create invoice",
          await getResponseError(response, "Please check your input and try again.")
        );
        return;
      }

      const createdInvoice = await response.json() as { id?: string };
      await showSuccessAlert("Invoice created");
      const target = (createdInvoice.id ? `/invoices/${createdInvoice.id}` : "/invoices") as Route;
      router.push(target);
      router.refresh();
    } catch {
      await showErrorAlert(
        "Unable to create invoice",
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/invoices" className="text-sm text-mutedfg hover:text-fg">← Back to invoices</Link>
        <h1 className="page-title mt-2">New invoice</h1>
        <p className="page-subtitle">Create and link an invoice to a contact or company.</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Invoice number
            <input
              className="input mt-1 w-full"
              placeholder="INV-1001"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Status
            <select
              className="input mt-1 w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value as InvoiceStatus)}
            >
              {INVOICE_STATUS_VALUES.map((statusValue) => (
                <option key={statusValue} value={statusValue}>{statusValue}</option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Title
            <input
              className="input mt-1 w-full"
              placeholder="Implementation phase 1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Amount
            <input
              className="input mt-1 w-full"
              placeholder="Amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              required
            />
          </label>
          <label className="text-sm">
            Currency
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
            Issued at
            <input className="input mt-1 w-full" type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} />
          </label>
          <label className="text-sm">
            Due at
            <input className="input mt-1 w-full" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </label>
          <label className="text-sm">
            Paid at
            <input className="input mt-1 w-full" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
          </label>
          <label className="text-sm">
            Related type
            <select
              className="input mt-1 w-full"
              value={relatedType}
              onChange={(event) => {
                const value = event.target.value as "" | "contact" | "company";
                setRelatedType(value);
                setRelatedId("");
              }}
            >
              <option value="">None</option>
              <option value="contact">Contact</option>
              <option value="company">Company</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Related record
            <select
              className="input mt-1 w-full"
              value={relatedId}
              onChange={(event) => setRelatedId(event.target.value)}
              disabled={!relatedType || loadingOptions}
            >
              <option value="">
                {relatedType ? `Select ${relatedType}` : "Choose related type first"}
              </option>
              {relatedOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {"firstName" in option ? `${option.firstName} ${option.lastName}`.trim() : option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Notes
            <textarea
              className="input mt-1 h-auto min-h-24 w-full py-2"
              placeholder="Optional context for this invoice"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/invoices" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create invoice"}
          </button>
        </div>
      </form>
    </main>
  );
}
