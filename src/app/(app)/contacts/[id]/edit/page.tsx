"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import type { Company } from "@/lib/crm-types";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

type ContactPayload = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
  tags?: string[];
};

export default function EditContactPage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const contactId = params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [contactResult, companiesResult] = await Promise.allSettled([
        fetch(`/api/contacts/${contactId}`),
        fetch("/api/companies")
      ]);

      if (cancelled) return;

      if (contactResult.status !== "fulfilled" || !contactResult.value.ok) {
        const message =
          contactResult.status === "fulfilled"
            ? await getResponseError(contactResult.value, tr("Unable to load contact", "تعذر تحميل جهة الاتصال"))
            : tr("Unable to load contact", "تعذر تحميل جهة الاتصال");
        throw new Error(message);
      }

      const contactPayload = (await contactResult.value.json()) as ContactPayload;
      if (cancelled) return;

      setFirstName(contactPayload.firstName ?? "");
      setLastName(contactPayload.lastName ?? "");
      setJobTitle(contactPayload.jobTitle ?? "");
      setEmail(contactPayload.email ?? "");
      setPhone(contactPayload.phone ?? "");
      setCompanyId(contactPayload.companyId ?? "");
      setTags(contactPayload.tags ?? []);

      if (companiesResult.status === "fulfilled" && companiesResult.value.ok) {
        const companiesPayload = await companiesResult.value.json() as { rows?: Company[] };
        if (!cancelled) setCompanies(companiesPayload.rows ?? []);
      }

      setLoading(false);
    }

    loadData().catch(async (error) => {
      const message = error instanceof Error ? error.message : tr("Unable to load contact", "تعذر تحميل جهة الاتصال");
      if (!cancelled) {
        await showErrorAlert(tr("Unable to load contact", "تعذر تحميل جهة الاتصال"), message);
        router.push("/contacts");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [contactId, router, language]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle: jobTitle || undefined,
          email: email || undefined,
          phone: phone || undefined,
          companyId: companyId || undefined,
          tags
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          tr("Unable to update contact", "تعذر تحديث جهة الاتصال"),
          await getResponseError(response, tr("Please check your input and try again.", "يرجى التحقق من البيانات والمحاولة مرة أخرى."))
        );
        return;
      }
      await showSuccessAlert(tr("Contact updated", "تم تحديث جهة الاتصال"));
      router.push(`/contacts/${contactId}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to update contact", "تعذر تحديث جهة الاتصال");
      await showErrorAlert(tr("Unable to update contact", "تعذر تحديث جهة الاتصال"), message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/contacts/${contactId}`} className="text-sm text-mutedfg hover:text-fg">{tr("← Back to contact", "← العودة إلى جهة الاتصال")}</Link>
        <h1 className="page-title mt-2">{tr("Edit contact", "تعديل جهة الاتصال")}</h1>
        <p className="page-subtitle">{tr("Update primary contact details.", "تحديث البيانات الأساسية لجهة الاتصال.")}</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            {tr("First name", "الاسم الأول")}
            <input className="input mt-1 w-full" placeholder={tr("First name", "الاسم الأول")} value={firstName} onChange={(event) => setFirstName(event.target.value)} required disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Last name", "الاسم الأخير")}
            <input className="input mt-1 w-full" placeholder={tr("Last name", "الاسم الأخير")} value={lastName} onChange={(event) => setLastName(event.target.value)} required disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Job title", "المسمى الوظيفي")}
            <input className="input mt-1 w-full" placeholder={tr("Job title", "المسمى الوظيفي")} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Email", "البريد الإلكتروني")}
            <input className="input mt-1 w-full" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Phone", "الهاتف")}
            <input className="input mt-1 w-full" placeholder={tr("Phone number", "رقم الهاتف")} value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            {tr("Company", "الشركة")}
            <select
              className="input mt-1 w-full"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              disabled={loading}
            >
              <option value="">{tr("No company", "بدون شركة")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/contacts/${contactId}`} className="btn">{tr("Cancel", "إلغاء")}</Link>
          <button className="btn btn-primary" type="submit" disabled={loading || saving}>
            {loading ? tr("Loading...", "جاري التحميل...") : saving ? tr("Saving...", "جاري الحفظ...") : tr("Save changes", "حفظ التغييرات")}
          </button>
        </div>
      </form>
    </main>
  );
}
