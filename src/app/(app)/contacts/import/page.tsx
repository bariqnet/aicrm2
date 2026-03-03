"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

const SAMPLE = "firstName,lastName,email,phone\nJane,Doe,jane@example.com,555-0100";

export default function ContactImportPage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

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
      const fallback = payload?.error ?? tr("Import failed", "فشل الاستيراد");
      setMessage(fallback);
      await showErrorAlert(tr("Import failed", "فشل الاستيراد"), fallback);
      return;
    }

    setMessage(
      tr(`Imported ${payload?.imported ?? 0} contacts.`, `تم استيراد ${payload?.imported ?? 0} جهة اتصال.`)
    );
    await showSuccessAlert(
      tr("Contacts imported", "تم استيراد جهات الاتصال"),
      tr(`Imported ${payload?.imported ?? 0} contact(s).`, `تم استيراد ${payload?.imported ?? 0} جهة اتصال.`)
    );
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/contacts" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to contacts", "← العودة إلى جهات الاتصال")}</Link>
        <h1 className="page-title mt-2">{tr("Import contacts", "استيراد جهات الاتصال")}</h1>
        <p className="page-subtitle">{tr("Paste CSV data to create contacts in bulk.", "الصق بيانات CSV لإنشاء جهات اتصال دفعة واحدة.")}</p>
      </header>

      <div className="panel max-w-3xl space-y-3 p-4">
        <textarea className="input h-auto min-h-48 w-full" value={csv} onChange={(event) => setCsv(event.target.value)} />
        <div className="flex justify-end">
          <button className="btn btn-primary" type="button" onClick={submit}>{tr("Import CSV", "استيراد CSV")}</button>
        </div>
        {message ? <p className="text-sm text-mutedfg">{message}</p> : null}
      </div>
    </main>
  );
}
