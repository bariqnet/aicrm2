"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

export default function NewCompanyPage() {
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
        "Unable to create company",
        await getResponseError(response, "Please check your input and try again.")
      );
      return;
    }
    await showSuccessAlert("Company created");
    router.push("/companies");
    router.refresh();
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/companies" className="text-sm text-mutedfg hover:text-fg">← Back to companies</Link>
        <h1 className="page-title mt-2">New company</h1>
        <p className="page-subtitle">Create an account record with core company context.</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Company name
            <input className="input mt-1 w-full" placeholder="Acme Inc." value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="text-sm">
            Domain
            <input className="input mt-1 w-full" placeholder="acme.com" value={domain} onChange={(event) => setDomain(event.target.value)} />
          </label>
          <label className="text-sm">
            Industry
            <input className="input mt-1 w-full" placeholder="Software" value={industry} onChange={(event) => setIndustry(event.target.value)} />
          </label>
          <label className="text-sm">
            Size
            <input className="input mt-1 w-full" placeholder="51-200" value={size} onChange={(event) => setSize(event.target.value)} />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/companies" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit">Create company</button>
        </div>
      </form>
    </main>
  );
}
