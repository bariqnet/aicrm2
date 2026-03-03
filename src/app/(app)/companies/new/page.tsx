"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

export default function NewCompanyPage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain, industry, size })
    });

    if (!response.ok) {
      await showErrorAlert(
        tr("Unable to create company", "تعذر إنشاء الشركة"),
        await getResponseError(response, tr("Please check your input and try again.", "يرجى التحقق من البيانات والمحاولة مرة أخرى."))
      );
      return;
    }
    await showSuccessAlert(tr("Company created", "تم إنشاء الشركة"));
    router.push("/companies");
    router.refresh();
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/companies" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to companies", "← العودة إلى الشركات")}</Link>
        <h1 className="page-title mt-2">{tr("New company", "شركة جديدة")}</h1>
        <p className="page-subtitle">{tr("Create an account record with core company context.", "أنشئ سجل حساب مع سياق الشركة الأساسي.")}</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            {tr("Company name", "اسم الشركة")}
            <input className="input mt-1 w-full" placeholder="Acme Inc." value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="text-sm">
            {tr("Domain", "النطاق")}
            <input className="input mt-1 w-full" placeholder="acme.com" value={domain} onChange={(event) => setDomain(event.target.value)} />
          </label>
          <label className="text-sm">
            {tr("Industry", "القطاع")}
            <input className="input mt-1 w-full" placeholder={tr("Software", "برمجيات")} value={industry} onChange={(event) => setIndustry(event.target.value)} />
          </label>
          <label className="text-sm">
            {tr("Size", "الحجم")}
            <input className="input mt-1 w-full" placeholder="51-200" value={size} onChange={(event) => setSize(event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/companies" className="btn">{tr("Cancel", "إلغاء")}</Link>
          <button className="btn btn-primary" type="submit">{tr("Create company", "إنشاء الشركة")}</button>
        </div>
      </form>
    </main>
  );
}
