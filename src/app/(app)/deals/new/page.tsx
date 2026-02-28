"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

export default function NewDealPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [stageId, setStageId] = useState("stage_lead");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount: Number(amount), currency, stageId })
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
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/deals" className="text-sm text-mutedfg hover:text-fg">← Back to deals</Link>
        <h1 className="page-title mt-2">New deal</h1>
        <p className="page-subtitle">Create a new opportunity and assign it to a stage.</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Deal title
            <input className="input mt-1 w-full" placeholder="Deal title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="text-sm">
            Amount
            <input className="input mt-1 w-full" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" />
          </label>
          <label className="text-sm">
            Currency
            <input className="input mt-1 w-full" placeholder="USD" value={currency} onChange={(event) => setCurrency(event.target.value)} />
          </label>
          <label className="text-sm sm:col-span-2">
            Stage ID
            <input className="input mt-1 w-full" placeholder="stage_lead" value={stageId} onChange={(event) => setStageId(event.target.value)} />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/deals" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit">Create deal</button>
        </div>
      </form>
    </main>
  );
}
