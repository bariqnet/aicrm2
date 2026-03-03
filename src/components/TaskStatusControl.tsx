"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { TaskStatus } from "@/lib/crm-types";
import { getResponseError, showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";

type TaskStatusControlProps = {
  taskId: string;
  status: TaskStatus;
};

export function TaskStatusControl({ taskId, status }: TaskStatusControlProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const nextStatus: TaskStatus = status === "DONE" ? "OPEN" : "DONE";
  const statusLabel = (value: TaskStatus) => (value === "DONE" ? tr("Done", "مكتملة") : tr("Open", "مفتوحة"));

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
        throw new Error(await getResponseError(response, tr("Unable to update task status", "تعذر تحديث حالة المهمة")));
      }
      await showSuccessAlert(tr("Task updated", "تم تحديث المهمة"), `${tr("Status changed to", "تم تغيير الحالة إلى")} ${statusLabel(nextStatus)}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to update task status", "تعذر تحديث حالة المهمة");
      await showErrorAlert(tr("Task update failed", "فشل تحديث المهمة"), message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button className="btn" type="button" onClick={updateStatus} disabled={saving}>
      {saving
        ? tr("Updating...", "جاري التحديث...")
        : status === "DONE"
          ? tr("Re-open task", "إعادة فتح المهمة")
          : tr("Mark as done", "تحديد كمكتملة")}
    </button>
  );
}
