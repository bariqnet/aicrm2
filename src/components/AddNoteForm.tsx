"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Note } from "@/lib/crm-types";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";

type AddNoteFormProps = {
  relatedType: Note["relatedType"];
  relatedId: string;
  placeholder?: string;
};

export function AddNoteForm({
  relatedType,
  relatedId,
  placeholder = "Capture an update, call summary, or important context..."
}: AddNoteFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || saving) return;
    setSaving(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed,
          relatedType,
          relatedId
        })
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, "Unable to add note"));
      }

      setBody("");
      await showSuccessAlert("Note added");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add note";
      await showErrorAlert("Unable to add note", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        className="input h-auto min-h-24 w-full resize-y py-2"
        placeholder={placeholder}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="flex justify-end">
        <button className="btn btn-primary" type="submit" disabled={saving || body.trim().length === 0}>
          {saving ? "Saving..." : "Add note"}
        </button>
      </div>
    </form>
  );
}
