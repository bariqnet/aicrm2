"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import type { Company, Contact, Stage } from "@/lib/crm-types";
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

export default function NewDealPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [stageId, setStageId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [primaryContactId, setPrimaryContactId] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [stagesResult, companiesResult, contactsResult] = await Promise.allSettled([
          fetch("/api/stages"),
          fetch("/api/companies"),
          fetch("/api/contacts")
        ]);

        if (cancelled) return;

        if (stagesResult.status === "fulfilled" && stagesResult.value.ok) {
          const payload = await stagesResult.value.json() as { rows?: Stage[] };
          const rows = payload.rows ?? [];
          setStages(rows);
          setStageId((current) => current || rows[0]?.id || "");
        }
        if (companiesResult.status === "fulfilled" && companiesResult.value.ok) {
          const payload = await companiesResult.value.json() as { rows?: Company[] };
          setCompanies(payload.rows ?? []);
        }
        if (contactsResult.status === "fulfilled" && contactsResult.value.ok) {
          const payload = await contactsResult.value.json() as { rows?: Contact[] };
          setContacts(payload.rows ?? []);
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!stageId) {
      await showErrorAlert("Missing stage", "Select a stage before creating the deal.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      await showErrorAlert("Invalid amount", "Amount must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          currency: currency.trim().toUpperCase() || "USD",
          stageId,
          companyId: companyId || undefined,
          primaryContactId: primaryContactId || undefined,
          expectedCloseDate: toIsoDateTime(expectedCloseDate)
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          "Unable to create deal",
          await getResponseError(response, "Please check your input and try again.")
        );
        return;
      }

      await showSuccessAlert("Deal created");
      router.push("/deals");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create deal";
      await showErrorAlert("Unable to create deal", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/deals" className="text-sm text-mutedfg hover:text-fg">← Back to deals</Link>
        <h1 className="page-title mt-2">New deal</h1>
        <p className="page-subtitle">Create a new opportunity and assign it to the right stage.</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Deal title
            <input className="input mt-1 w-full" placeholder="Deal title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="text-sm">
            Amount
            <input className="input mt-1 w-full" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" required />
          </label>
          <label className="text-sm">
            Currency
            <input className="input mt-1 w-full" placeholder="USD" value={currency} onChange={(event) => setCurrency(event.target.value)} required />
          </label>
          <label className="text-sm">
            Stage
            <select
              className="input mt-1 w-full"
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              disabled={loadingOptions || stages.length === 0}
              required
            >
              <option value="">{loadingOptions ? "Loading stages..." : "Select stage"}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Expected close date
            <input
              className="input mt-1 w-full"
              type="date"
              value={expectedCloseDate}
              onChange={(event) => setExpectedCloseDate(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Company (optional)
            <select className="input mt-1 w-full" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
              <option value="">No company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Primary contact (optional)
            <select className="input mt-1 w-full" value={primaryContactId} onChange={(event) => setPrimaryContactId(event.target.value)}>
              <option value="">No primary contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/deals" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create deal"}
          </button>
        </div>
      </form>
    </main>
  );
}
