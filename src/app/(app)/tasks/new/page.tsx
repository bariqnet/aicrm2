"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Company, Contact, Deal, Task } from "@/lib/crm-types";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

type RelatedType = "contact" | "company" | "deal" | "task";

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [relatedType, setRelatedType] = useState<RelatedType>("contact");
  const [relatedId, setRelatedId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [contactsResult, companiesResult, dealsResult, tasksResult] = await Promise.allSettled([
          fetch("/api/contacts"),
          fetch("/api/companies"),
          fetch("/api/deals"),
          fetch("/api/tasks")
        ]);

        if (cancelled) return;

        if (contactsResult.status === "fulfilled" && contactsResult.value.ok) {
          const payload = await contactsResult.value.json() as { rows?: Contact[] };
          setContacts(payload.rows ?? []);
        }
        if (companiesResult.status === "fulfilled" && companiesResult.value.ok) {
          const payload = await companiesResult.value.json() as { rows?: Company[] };
          setCompanies(payload.rows ?? []);
        }
        if (dealsResult.status === "fulfilled" && dealsResult.value.ok) {
          const payload = await dealsResult.value.json() as { rows?: Deal[] };
          setDeals(payload.rows ?? []);
        }
        if (tasksResult.status === "fulfilled" && tasksResult.value.ok) {
          const payload = await tasksResult.value.json() as { rows?: Task[] };
          setTasks(payload.rows ?? []);
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
  }, []);

  const relatedOptions = useMemo(() => {
    if (relatedType === "contact") {
      return contacts.map((contact) => ({
        id: contact.id,
        label: `${contact.firstName} ${contact.lastName}`.trim()
      }));
    }
    if (relatedType === "company") {
      return companies.map((company) => ({ id: company.id, label: company.name }));
    }
    if (relatedType === "deal") {
      return deals.map((deal) => ({ id: deal.id, label: deal.title }));
    }
    return tasks.map((task) => ({ id: task.id, label: task.title }));
  }, [relatedType, contacts, companies, deals, tasks]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const trimmedRelatedId = relatedId.trim();
    if (!trimmedRelatedId) {
      await showErrorAlert("Missing related ID", "Select or enter the related record ID.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          relatedType,
          relatedId: trimmedRelatedId,
          dueAt: toIsoDateTime(dueAt)
        })
      });

      if (!response.ok) {
        await showErrorAlert(
          "Unable to create task",
          await getResponseError(response, "Please check your input and try again.")
        );
        return;
      }
      await showSuccessAlert("Task created");
      router.push("/tasks");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create task";
      await showErrorAlert("Unable to create task", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/tasks" className="text-sm text-mutedfg hover:text-fg">← Back to tasks</Link>
        <h1 className="page-title mt-2">New task</h1>
        <p className="page-subtitle">Create a follow-up tied to a record in the workspace.</p>
      </header>

      <form className="panel max-w-3xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Task title
            <input className="input mt-1 w-full" placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="text-sm">
            Related type
            <select
              className="input mt-1 w-full"
              value={relatedType}
              onChange={(event) => {
                setRelatedType(event.target.value as RelatedType);
                setRelatedId("");
              }}
            >
              <option value="contact">Contact</option>
              <option value="company">Company</option>
              <option value="deal">Deal</option>
              <option value="task">Task</option>
            </select>
          </label>
          <label className="text-sm">
            Due date (optional)
            <input className="input mt-1 w-full" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </label>
          <label className="text-sm sm:col-span-2">
            Related record
            <select
              className="input mt-1 w-full"
              value={relatedId}
              onChange={(event) => setRelatedId(event.target.value)}
              disabled={loadingOptions}
              required
            >
              <option value="">
                {loadingOptions ? "Loading records..." : `Select ${relatedType}`}
              </option>
              {relatedOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Or paste related ID
            <input
              className="input mt-1 w-full"
              placeholder="Paste ID if not listed"
              value={relatedId}
              onChange={(event) => setRelatedId(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/tasks" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create task"}
          </button>
        </div>
      </form>
    </main>
  );
}
