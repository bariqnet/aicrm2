"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

type CompanyPayload = {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
};

export default function EditCompanyPage() {
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
        throw new Error(await getResponseError(response, "Unable to load company"));
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
      const message = error instanceof Error ? error.message : "Unable to load company";
      if (!cancelled) {
        await showErrorAlert("Unable to load company", message);
        router.push("/companies");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [companyId, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        domain: domain || undefined,
        industry: industry || undefined,
        size: size || undefined
      })
    });

    if (!response.ok) {
      await showErrorAlert(
        "Unable to update company",
        await getResponseError(response, "Please check your input and try again.")
      );
      return;
    }
    await showSuccessAlert("Company updated");
    router.push(`/companies/${companyId}`);
    router.refresh();
  }

  return (
    <main className="app-page">
      <header>
        <Link href={`/companies/${companyId}`} className="text-sm text-mutedfg hover:text-fg">← Back to company</Link>
        <h1 className="page-title mt-2">Edit company</h1>
        <p className="page-subtitle">Update core company details.</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Company name
            <input className="input mt-1 w-full" placeholder="Company name" value={name} onChange={(event) => setName(event.target.value)} required disabled={loading} />
          </label>
          <label className="text-sm">
            Domain
            <input className="input mt-1 w-full" placeholder="acme.com" value={domain} onChange={(event) => setDomain(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            Industry
            <input className="input mt-1 w-full" placeholder="Industry" value={industry} onChange={(event) => setIndustry(event.target.value)} disabled={loading} />
          </label>
          <label className="text-sm">
            Size
            <input className="input mt-1 w-full" placeholder="51-200" value={size} onChange={(event) => setSize(event.target.value)} disabled={loading} />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href={`/companies/${companyId}`} className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
