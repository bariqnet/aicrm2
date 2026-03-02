"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
            ? await getResponseError(contactResult.value, "Unable to load contact")
            : "Unable to load contact";
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
      const message = error instanceof Error ? error.message : "Unable to load contact";
      if (!cancelled) {
        await showErrorAlert("Unable to load contact", message);
        router.push("/contacts");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [contactId, router]);

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
          "Unable to update contact",
          await getResponseError(response, "Please check your input and try again.")
        );
        return;
      }
      await showSuccessAlert("Contact updated");
      router.push(`/contacts/${contactId}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update contact";
      await showErrorAlert("Unable to update contact", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/contacts/${contactId}`} className="text-sm text-mutedfg hover:text-fg">← Back to contact</Link>
        <h1 className="page-title mt-2">Edit contact</h1>
        <p className="page-subtitle">Update primary contact details.</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            First name
            <input className="input mt-1 w-full" placeholder="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required disabled={loading} />
          </label>
          <label className="text-sm">
            Last name
            <input className="input mt-1 w-full" placeholder="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} required disabled={loading} />
          </label>
          <label className="text-sm">
            Job title
            <input className="input mt-1 w-full" placeholder="Job title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            Email
            <input className="input mt-1 w-full" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            Phone
            <input className="input mt-1 w-full" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            Company
            <select
              className="input mt-1 w-full"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              disabled={loading}
            >
              <option value="">No company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/contacts/${contactId}`} className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={loading || saving}>
            {loading ? "Loading..." : saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
