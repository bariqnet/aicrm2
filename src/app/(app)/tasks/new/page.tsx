"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [relatedType, setRelatedType] = useState<"contact" | "company" | "deal" | "task">("contact");
  const [relatedId, setRelatedId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, relatedType, relatedId })
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
  }

  return (
    <main className="app-page">
      <header>
        <Link href="/tasks" className="text-sm text-mutedfg hover:text-fg">← Back to tasks</Link>
        <h1 className="page-title mt-2">New task</h1>
        <p className="page-subtitle">Create a follow-up tied to a record in the workspace.</p>
      </header>

      <form className="panel max-w-2xl space-y-4 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Task title
            <input className="input mt-1 w-full" placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="text-sm">
            Related type
            <select className="input mt-1 w-full" value={relatedType} onChange={(event) => setRelatedType(event.target.value as typeof relatedType)}>
              <option value="contact">Contact</option>
              <option value="company">Company</option>
              <option value="deal">Deal</option>
              <option value="task">Task</option>
            </select>
          </label>
          <label className="text-sm">
            Related ID
            <input className="input mt-1 w-full" placeholder="Related ID" value={relatedId} onChange={(event) => setRelatedId(event.target.value)} required />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/tasks" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit">Create task</button>
        </div>
      </form>
    </main>
  );
}
