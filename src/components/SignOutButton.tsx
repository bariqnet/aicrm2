"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  confirmAlert,
  getResponseError,
  showErrorAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({ className = "btn", label }: SignOutButtonProps) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    const confirmed = await confirmAlert(
      t("signout.confirmTitle"),
      t("signout.confirmText"),
      t("signout.confirmButton")
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getResponseError(response, t("signout.errorFallback")));
      }
      await showSuccessAlert(t("signout.successTitle"), t("signout.successText"));
      window.location.assign("/auth/sign-in");
    } catch (signOutError) {
      const message =
        signOutError instanceof Error ? signOutError.message : t("signout.errorFallback");
      setError(message);
      await showErrorAlert(t("signout.errorTitle"), message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" className={className} onClick={signOut} disabled={submitting}>
        <LogOut size={14} />
        {submitting ? t("signout.signingOut") : (label ?? t("signout.label"))}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
