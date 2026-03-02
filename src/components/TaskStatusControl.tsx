"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TaskStatus } from "@/lib/crm-types";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";

type TaskStatusControlProps = {
  taskId: string;
  status: TaskStatus;
};

export function TaskStatusControl({ taskId, status }: TaskStatusControlProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const nextStatus: TaskStatus = status === "DONE" ? "OPEN" : "DONE";

  async function updateStatus() {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Unable to update task status"));
      }
      await showSuccessAlert("Task updated", `Status changed to ${nextStatus}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task status";
      await showErrorAlert("Task update failed", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button className="btn" type="button" onClick={updateStatus} disabled={saving}>
      {saving ? "Updating..." : status === "DONE" ? "Re-open task" : "Mark as done"}
    </button>
  );
}
