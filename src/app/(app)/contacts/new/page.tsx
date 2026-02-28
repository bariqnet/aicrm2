"use client";

import Link from "next/link";
import { Building2, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

type CompanyOption = {
  id: string;
  name: string;
};

type DealOption = {
  id: string;
  title: string;
};

export default function NewContactPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const [companiesResult, dealsResult] = await Promise.allSettled([
        fetch("/api/companies"),
        fetch("/api/deals")
      ]);

      if (cancelled) return;

      if (companiesResult.status === "fulfilled" && companiesResult.value.ok) {
        const payload = await companiesResult.value.json() as { rows?: CompanyOption[] };
        if (!cancelled) setCompanies(payload.rows ?? []);
      }

      if (dealsResult.status === "fulfilled" && dealsResult.value.ok) {
        const payload = await dealsResult.value.json() as { rows?: DealOption[] };
        if (!cancelled) setDeals(payload.rows ?? []);
      }
    }

    loadOptions().catch(() => {
      // The form still works without preloaded options.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle: jobTitle.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          companyId: companyId || undefined,
          tags: []
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          "Unable to create contact",
          await getResponseError(response, "Please check your input and try again.")
        );
        return;
      }

      const createdContact = await response.json() as { id: string };

      if (opportunityId) {
        await fetch(`/api/deals/${opportunityId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primaryContactId: createdContact.id })
        });
      }

      await showSuccessAlert("Contact created");
      router.push("/contacts");
      router.refresh();
    } catch {
      await showErrorAlert(
        "Unable to create contact",
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/contacts" className="text-sm text-mutedfg hover:text-fg">← Back to contacts</Link>
        <h1 className="page-title mt-2">New contact</h1>
        <p className="page-subtitle">Capture person details, account link, and opportunity context.</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Account
            <div className="relative mt-1">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedfg" />
              <select
                className="input w-full pl-9"
                onChange={(event) => setCompanyId(event.target.value)}
                value={companyId}
              >
                <option value="">Select account</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="text-sm">
            First name <span className="text-red-500">*</span>
            <input className="input mt-1 w-full" onChange={(event) => setFirstName(event.target.value)} placeholder="First" required value={firstName} />
          </label>

          <label className="text-sm">
            Last name <span className="text-red-500">*</span>
            <input className="input mt-1 w-full" onChange={(event) => setLastName(event.target.value)} placeholder="Last" required value={lastName} />
          </label>

          <label className="text-sm">
            Email
            <input className="input mt-1 w-full" onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" type="email" value={email} />
          </label>

          <label className="text-sm">
            Phone
            <input className="input mt-1 w-full" onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" value={phone} />
          </label>

          <label className="text-sm">
            Title (optional)
            <input className="input mt-1 w-full" onChange={(event) => setJobTitle(event.target.value)} placeholder="Co-founder, CEO" value={jobTitle} />
          </label>

          <label className="text-sm">
            Opportunity (optional)
            <div className="relative mt-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedfg" />
              <select
                className="input w-full pl-9"
                onChange={(event) => setOpportunityId(event.target.value)}
                value={opportunityId}
              >
                <option value="">No opportunity</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>{deal.title}</option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/contacts" className="btn">Cancel</Link>
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create contact"}
          </button>
        </div>
      </form>
    </main>
  );
}
