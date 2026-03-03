"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
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
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStageId = searchParams.get("stageId");
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
          setStageId((current) => {
            if (current) return current;
            if (requestedStageId && rows.some((stage) => stage.id === requestedStageId)) {
              return requestedStageId;
            }
            return rows[0]?.id || "";
          });
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
  }, [requestedStageId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!stageId) {
      await showErrorAlert(
        tr("Missing stage", "المرحلة مفقودة"),
        tr("Select a stage before creating the pipeline card.", "اختر مرحلة قبل إنشاء بطاقة البايبلاين.")
      );
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      await showErrorAlert(tr("Invalid amount", "مبلغ غير صالح"), tr("Amount must be a valid non-negative number.", "يجب أن يكون المبلغ رقمًا صالحًا غير سالب."));
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
          tr("Unable to create pipeline card", "تعذر إنشاء بطاقة البايبلاين"),
          await getResponseError(response, tr("Please check your input and try again.", "يرجى التحقق من البيانات والمحاولة مرة أخرى."))
        );
        return;
      }

      await showSuccessAlert(tr("Pipeline card created", "تم إنشاء بطاقة البايبلاين"));
      router.push("/deals");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to create pipeline card", "تعذر إنشاء بطاقة البايبلاين");
      await showErrorAlert(tr("Unable to create pipeline card", "تعذر إنشاء بطاقة البايبلاين"), message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/deals" className="text-sm text-mutedfg hover:text-fg">{tr("← Back to pipeline", "← العودة إلى البايبلاين")}</Link>
        <h1 className="page-title mt-2">{tr("New pipeline card", "بطاقة بايبلاين جديدة")}</h1>
        <p className="page-subtitle">{tr("Create a new card and assign it to the right stage.", "أنشئ بطاقة جديدة وعيّنها للمرحلة المناسبة.")}</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            {tr("Card title", "عنوان البطاقة")}
            <input className="input mt-1 w-full" placeholder={tr("Card title", "عنوان البطاقة")} value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="text-sm">
            {tr("Amount", "المبلغ")}
            <input className="input mt-1 w-full" placeholder={tr("Amount", "المبلغ")} value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" required />
          </label>
          <label className="text-sm">
            {tr("Currency", "العملة")}
            <input className="input mt-1 w-full" placeholder="USD" value={currency} onChange={(event) => setCurrency(event.target.value)} required />
          </label>
          <label className="text-sm">
            {tr("Stage", "المرحلة")}
            <select
              className="input mt-1 w-full"
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              disabled={loadingOptions || stages.length === 0}
              required
            >
              <option value="">{loadingOptions ? tr("Loading stages...", "جاري تحميل المراحل...") : tr("Select stage", "اختر مرحلة")}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {tr("Expected close date", "تاريخ الإغلاق المتوقع")}
            <input
              className="input mt-1 w-full"
              type="date"
              value={expectedCloseDate}
              onChange={(event) => setExpectedCloseDate(event.target.value)}
            />
          </label>
          <label className="text-sm">
            {tr("Company (optional)", "الشركة (اختياري)")}
            <select className="input mt-1 w-full" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
              <option value="">{tr("No company", "بدون شركة")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {tr("Primary contact (optional)", "جهة الاتصال الأساسية (اختياري)")}
            <select className="input mt-1 w-full" value={primaryContactId} onChange={(event) => setPrimaryContactId(event.target.value)}>
              <option value="">{tr("No primary contact", "بدون جهة اتصال أساسية")}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/deals" className="btn">{tr("Cancel", "إلغاء")}</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? tr("Creating...", "جاري الإنشاء...") : tr("Create card", "إنشاء البطاقة")}
          </button>
        </div>
      </form>
    </main>
  );
}
