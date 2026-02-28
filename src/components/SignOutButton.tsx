"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
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

export function SignOutButton({ className = "btn", label = "Sign out" }: SignOutButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    const confirmed = await confirmAlert(
      "Sign out?",
      "You will need to sign in again to continue.",
      "Sign out"
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Failed to sign out"));
      }
      await showSuccessAlert("Signed out", "See you next time");
      window.location.assign("/auth/sign-in");
    } catch (signOutError) {
      const message =
        signOutError instanceof Error ? signOutError.message : "Failed to sign out";
      setError(message);
      await showErrorAlert("Sign out failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" className={className} onClick={signOut} disabled={submitting}>
        <LogOut size={14} />
        {submitting ? "Signing out..." : label}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
