"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
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
  status: "OPEN" | "WON" | "LOST";
  expectedCloseDate?: string | null;
};

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [stageId, setStageId] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<"OPEN" | "WON" | "LOST">("OPEN");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [loading, setLoading] = useState(true);
  const dealId = params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadDeal() {
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Unable to load deal"));
      }
      const payload = (await response.json()) as DealPayload;
      if (cancelled) return;
      setTitle(payload.title ?? "");
      setStageId(payload.stageId ?? "");
      setAmount(String(payload.amount ?? 0));
      setCurrency(payload.currency ?? "USD");
      setStatus(payload.status ?? "OPEN");
      setExpectedCloseDate(payload.expectedCloseDate ?? "");
      setLoading(false);
    }

    loadDeal().catch(async (error) => {
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

    const response = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        stageId,
        amount: Number(amount),
        currency,
        status,
        expectedCloseDate: expectedCloseDate || undefined
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
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/deals/${dealId}`} className="text-sm text-mutedfg hover:text-fg">← Back to deal</Link>
        <h1 className="page-title mt-2">Edit deal</h1>
        <p className="page-subtitle">Update opportunity details and stage.</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Deal title
            <input className="input mt-1 w-full" placeholder="Deal title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            Amount
            <input className="input mt-1 w-full" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" disabled={loading} />
          </label>
          <label className="text-sm">
            Currency
            <input className="input mt-1 w-full" placeholder="USD" value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm sm:col-span-2">
            Stage ID
            <input className="input mt-1 w-full" placeholder="Stage ID" value={stageId} onChange={(event) => setStageId(event.target.value)} disabled={loading} />
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
            Expected close date
            <input className="input mt-1 w-full" type="date" value={expectedCloseDate ? expectedCloseDate.slice(0, 10) : ""} onChange={(event) => setExpectedCloseDate(event.target.value)} disabled={loading} />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href={`/deals/${dealId}`} className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
