"use client";

import Link from "next/link";
import { useState } from "react";
import {
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

const SAMPLE = "firstName,lastName,email,phone\nJane,Doe,jane@example.com,555-0100";

export default function ContactImportPage() {
  const [csv, setCsv] = useState(SAMPLE);
  const [message, setMessage] = useState("");

  async function submit() {
    const response = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv })
    });

    const payload = (await response.json().catch(() => null)) as { imported?: number; error?: string } | null;
    if (!response.ok) {
      const fallback = payload?.error ?? "Import failed";
      setMessage(fallback);
      await showErrorAlert("Import failed", fallback);
      return;
    }

    setMessage(`Imported ${payload?.imported ?? 0} contacts.`);
    await showSuccessAlert(
      "Contacts imported",
      `Imported ${payload?.imported ?? 0} contact(s).`
    );
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/contacts" className="text-sm text-mutedfg hover:text-fg">← Back to contacts</Link>
        <h1 className="page-title mt-2">Import contacts</h1>
        <p className="page-subtitle">Paste CSV data to create contacts in bulk.</p>
      </header>

      <div className="panel max-w-3xl space-y-3 p-4">
        <textarea className="input min-h-48 w-full" value={csv} onChange={(event) => setCsv(event.target.value)} />
        <div className="flex justify-end">
          <button className="btn btn-primary" type="button" onClick={submit}>Import CSV</button>
        </div>
        {message ? <p className="text-sm text-mutedfg">{message}</p> : null}
      </div>
    </main>
  );
}
