"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Company, Contact, Stage } from "@/lib/crm-types";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";

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
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

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
        fetch("/api/contacts"),
      ]);

      if (cancelled) return;

      if (dealResult.status !== "fulfilled" || !dealResult.value.ok) {
        const message =
          dealResult.status === "fulfilled"
            ? await getResponseError(
                dealResult.value,
                tr("Unable to load card", "تعذر تحميل البطاقة"),
              )
            : tr("Unable to load card", "تعذر تحميل البطاقة");
        throw new Error(message);
      }

      const dealPayload = (await dealResult.value.json()) as DealPayload;
      if (cancelled) return;

      setTitle(dealPayload.title ?? "");
      setStageId(dealPayload.stageId ?? "");
      setAmount(String(dealPayload.amount ?? 0));
      setCurrency(dealPayload.currency ?? "USD");
      setCompanyId(dealPayload.companyId ?? "");
      setPrimaryContactId(dealPayload.primaryContactId ?? "");
      setStatus(dealPayload.status ?? "OPEN");
      setExpectedCloseDate(
        dealPayload.expectedCloseDate ? dealPayload.expectedCloseDate.slice(0, 10) : "",
      );

      if (stagesResult.status === "fulfilled" && stagesResult.value.ok) {
        const payload = (await stagesResult.value.json()) as { rows?: Stage[] };
        const rows = payload.rows ?? [];
        setStages(rows);
        setStageId((current) => current || rows[0]?.id || "");
      }

      if (companiesResult.status === "fulfilled" && companiesResult.value.ok) {
        const payload = (await companiesResult.value.json()) as { rows?: Company[] };
        setCompanies(payload.rows ?? []);
      }

      if (contactsResult.status === "fulfilled" && contactsResult.value.ok) {
        const payload = (await contactsResult.value.json()) as { rows?: Contact[] };
        setContacts(payload.rows ?? []);
      }

      setLoading(false);
    }

    loadDealAndOptions().catch(async (error) => {
      const message =
        error instanceof Error ? error.message : tr("Unable to load card", "تعذر تحميل البطاقة");
      if (!cancelled) {
        await showErrorAlert(tr("Unable to load card", "تعذر تحميل البطاقة"), message);
        router.push("/deals");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dealId, router, language]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      await showErrorAlert(
        tr("Invalid amount", "مبلغ غير صالح"),
        tr(
          "Amount must be a valid non-negative number.",
          "يجب أن يكون المبلغ رقمًا صالحًا غير سالب.",
        ),
      );
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
          expectedCloseDate: toIsoDateTime(expectedCloseDate),
        }),
      });

      if (!response.ok) {
        await showErrorAlert(
          tr("Unable to update card", "تعذر تحديث البطاقة"),
          await getResponseError(
            response,
            tr(
              "Please check your input and try again.",
              "يرجى التحقق من البيانات والمحاولة مرة أخرى.",
            ),
          ),
        );
        return;
      }
      await showSuccessAlert(tr("Card updated", "تم تحديث البطاقة"));
      router.push(`/deals/${dealId}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tr("Unable to update card", "تعذر تحديث البطاقة");
      await showErrorAlert(tr("Unable to update card", "تعذر تحديث البطاقة"), message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/deals/${dealId}`} className="text-sm text-mutedfg hover:text-fg">
          {`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to card", "العودة إلى البطاقة")}`}
        </Link>
        <h1 className="page-title mt-2">
          {tr("Edit pipeline card", "تعديل بطاقة في خط المبيعات")}
        </h1>
        <p className="page-subtitle">
          {tr(
            "Update card details, stage, and ownership links.",
            "تحديث تفاصيل البطاقة والمرحلة وروابط المسؤولية.",
          )}
        </p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            {tr("Card title", "عنوان البطاقة")}
            <input
              className="input mt-1 w-full"
              placeholder={tr("Card title", "عنوان البطاقة")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Amount", "المبلغ")}
            <input
              className="input mt-1 w-full"
              placeholder={tr("Amount", "المبلغ")}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              min="0"
              disabled={loading}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Currency", "العملة")}
            <input
              className="input mt-1 w-full"
              placeholder="USD"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label className="text-sm">
            {tr("Stage", "المرحلة")}
            <select
              className="input mt-1 w-full"
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              disabled={loading || stages.length === 0}
              required
            >
              <option value="">
                {loading
                  ? tr("Loading stages...", "جاري تحميل المراحل...")
                  : tr("Select stage", "اختر مرحلة")}
              </option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {tr("Status", "الحالة")}
            <select
              className="input mt-1 w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value as "OPEN" | "WON" | "LOST")}
              disabled={loading}
            >
              <option value="OPEN">{tr("OPEN", "مفتوحة")}</option>
              <option value="WON">{tr("WON", "مربوحة")}</option>
              <option value="LOST">{tr("LOST", "مفقودة")}</option>
            </select>
          </label>
          <label className="text-sm">
            {tr("Company (optional)", "الشركة (اختياري)")}
            <select
              className="input mt-1 w-full"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              disabled={loading}
            >
              <option value="">{tr("No company", "بدون شركة")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {tr("Primary contact (optional)", "جهة الاتصال الأساسية (اختياري)")}
            <select
              className="input mt-1 w-full"
              value={primaryContactId}
              onChange={(event) => setPrimaryContactId(event.target.value)}
              disabled={loading}
            >
              <option value="">{tr("No primary contact", "بدون جهة اتصال أساسية")}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            {tr("Expected close date", "تاريخ الإغلاق المتوقع")}
            <input
              className="input mt-1 w-full"
              type="date"
              value={expectedCloseDate}
              onChange={(event) => setExpectedCloseDate(event.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/deals/${dealId}`} className="btn">
            {tr("Cancel", "إلغاء")}
          </Link>
          <button className="btn btn-primary" type="submit" disabled={loading || saving}>
            {loading
              ? tr("Loading...", "جاري التحميل...")
              : saving
                ? tr("Saving...", "جاري الحفظ...")
                : tr("Save changes", "حفظ التغييرات")}
          </button>
        </div>
      </form>
    </main>
  );
}
