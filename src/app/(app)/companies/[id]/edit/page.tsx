"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";

type CompanyPayload = {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
};

export default function EditCompanyPage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(true);
  const companyId = params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) {
        throw new Error(
          await getResponseError(response, tr("Unable to load company", "تعذر تحميل الشركة")),
        );
      }
      const payload = (await response.json()) as CompanyPayload;
      if (cancelled) return;
      setName(payload.name ?? "");
      setDomain(payload.domain ?? "");
      setIndustry(payload.industry ?? "");
      setSize(payload.size ?? "");
      setLoading(false);
    }

    loadCompany().catch(async (error) => {
      const message =
        error instanceof Error ? error.message : tr("Unable to load company", "تعذر تحميل الشركة");
      if (!cancelled) {
        await showErrorAlert(tr("Unable to load company", "تعذر تحميل الشركة"), message);
        router.push("/companies");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [companyId, router, language]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        domain: domain || undefined,
        industry: industry || undefined,
        size: size || undefined,
      }),
    });

    if (!response.ok) {
      await showErrorAlert(
        tr("Unable to update company", "تعذر تحديث الشركة"),
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
    await showSuccessAlert(tr("Company updated", "تم تحديث الشركة"));
    router.push(`/companies/${companyId}`);
    router.refresh();
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/companies/${companyId}`} className="text-sm text-mutedfg hover:text-fg">
          {`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to company", "العودة إلى الشركة")}`}
        </Link>
        <h1 className="page-title mt-2">{tr("Edit company", "تعديل الشركة")}</h1>
        <p className="page-subtitle">
          {tr("Update core company details.", "تحديث بيانات الشركة الأساسية.")}
        </p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            {tr("Company name", "اسم الشركة")}
            <input
              className="input mt-1 w-full"
              placeholder={tr("Company name", "اسم الشركة")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label className="text-sm">
            {tr("Domain", "النطاق")}
            <input
              className="input mt-1 w-full"
              placeholder="acme.com"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              disabled={loading}
            />
          </label>
          <label className="text-sm">
            {tr("Industry", "القطاع")}
            <input
              className="input mt-1 w-full"
              placeholder={tr("Industry", "القطاع")}
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              disabled={loading}
            />
          </label>
          <label className="text-sm">
            {tr("Size", "الحجم")}
            <input
              className="input mt-1 w-full"
              placeholder="51-200"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/companies/${companyId}`} className="btn">
            {tr("Cancel", "إلغاء")}
          </Link>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? tr("Loading...", "جاري التحميل...") : tr("Save changes", "حفظ التغييرات")}
          </button>
        </div>
      </form>
    </main>
  );
}
