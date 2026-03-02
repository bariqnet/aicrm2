"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import type { Company, Contact, Stage } from "@/lib/crm-types";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

type DealPayload = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stageId: string;
  companyId?: string | null;
  primaryContactId?: string | null;
  status: "OPEN" | "WON" | "LOST";
  expectedCloseDate?: string | null;
};

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [stageId, setStageId] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [companyId, setCompanyId] = useState("");
  const [primaryContactId, setPrimaryContactId] = useState("");
  const [status, setStatus] = useState<"OPEN" | "WON" | "LOST">("OPEN");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dealId = params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadDealAndOptions() {
      const [dealResult, stagesResult, companiesResult, contactsResult] = await Promise.allSettled([
        fetch(`/api/deals/${dealId}`),
        fetch("/api/stages"),
        fetch("/api/companies"),
        fetch("/api/contacts")
      ]);

      if (cancelled) return;

      if (dealResult.status !== "fulfilled" || !dealResult.value.ok) {
        const message =
          dealResult.status === "fulfilled"
            ? await getResponseError(dealResult.value, "Unable to load deal")
            : "Unable to load deal";
        throw new Error(message);
      }

      const dealPayload = await dealResult.value.json() as DealPayload;
      if (cancelled) return;

      setTitle(dealPayload.title ?? "");
      setStageId(dealPayload.stageId ?? "");
      setAmount(String(dealPayload.amount ?? 0));
      setCurrency(dealPayload.currency ?? "USD");
      setCompanyId(dealPayload.companyId ?? "");
      setPrimaryContactId(dealPayload.primaryContactId ?? "");
      setStatus(dealPayload.status ?? "OPEN");
      setExpectedCloseDate(dealPayload.expectedCloseDate ? dealPayload.expectedCloseDate.slice(0, 10) : "");

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

      setLoading(false);
    }

    loadDealAndOptions().catch(async (error) => {
      const message = error instanceof Error ? error.message : "Unable to load deal";
      if (!cancelled) {
        await showErrorAlert("Unable to load deal", message);
        router.push("/deals");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dealId, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      await showErrorAlert("Invalid amount", "Amount must be a valid non-negative number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          stageId,
          amount: parsedAmount,
          currency: currency.trim().toUpperCase() || "USD",
          companyId: companyId || undefined,
          primaryContactId: primaryContactId || undefined,
          status,
          expectedCloseDate: toIsoDateTime(expectedCloseDate)
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          "Unable to update deal",
          await getResponseError(response, "Please check your input and try again.")
        );
        return;
      }
      await showSuccessAlert("Deal updated");
      router.push(`/deals/${dealId}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update deal";
      await showErrorAlert("Unable to update deal", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/deals/${dealId}`} className="text-sm text-mutedfg hover:text-fg">← Back to deal</Link>
        <h1 className="page-title mt-2">Edit deal</h1>
        <p className="page-subtitle">Update opportunity details, stage, and ownership links.</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Deal title
            <input className="input mt-1 w-full" placeholder="Deal title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading} required />
          </label>
          <label className="text-sm">
            Amount
            <input className="input mt-1 w-full" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" disabled={loading} required />
          </label>
          <label className="text-sm">
            Currency
            <input className="input mt-1 w-full" placeholder="USD" value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={loading} required />
          </label>
          <label className="text-sm">
            Stage
            <select
              className="input mt-1 w-full"
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              disabled={loading || stages.length === 0}
              required
            >
              <option value="">{loading ? "Loading stages..." : "Select stage"}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Status
            <select className="input mt-1 w-full" value={status} onChange={(event) => setStatus(event.target.value as "OPEN" | "WON" | "LOST")} disabled={loading}>
              <option value="OPEN">OPEN</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
            </select>
          </label>
          <label className="text-sm">
            Company (optional)
            <select className="input mt-1 w-full" value={companyId} onChange={(event) => setCompanyId(event.target.value)} disabled={loading}>
              <option value="">No company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Primary contact (optional)
            <select className="input mt-1 w-full" value={primaryContactId} onChange={(event) => setPrimaryContactId(event.target.value)} disabled={loading}>
              <option value="">No primary contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Expected close date
            <input className="input mt-1 w-full" type="date" value={expectedCloseDate} onChange={(event) => setExpectedCloseDate(event.target.value)} disabled={loading} />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/deals/${dealId}`} className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={loading || saving}>
            {loading ? "Loading..." : saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
