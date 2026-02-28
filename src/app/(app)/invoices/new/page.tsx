"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { showInfoAlert } from "@/lib/sweet-alert";

export default function NewInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await showInfoAlert(
      "Invoice draft saved locally",
      `Invoice ${invoiceNumber || "(no number)"} for ${title || "(untitled)"} is not persisted yet in this scaffold.`
    );
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/invoices" className="text-sm text-mutedfg hover:text-fg">← Back to invoices</Link>
        <h1 className="page-title mt-2">New invoice</h1>
        <p className="page-subtitle">Prepare a draft invoice record.</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Invoice number
            <input className="input mt-1 w-full" placeholder="INV-1001" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
          </label>
          <label className="text-sm sm:col-span-2">
            Title
            <input className="input mt-1 w-full" placeholder="Implementation phase 1" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="text-sm">
            Amount
            <input className="input mt-1 w-full" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/invoices" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit">Create invoice</button>
        </div>
      </form>
    </main>
  );
}
