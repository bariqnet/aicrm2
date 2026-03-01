"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { apiRequest } from "@/lib/crm-api";
import { normalizeSessionPayload, persistSession } from "@/lib/auth-flow";
import { showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";
import { signInSchema } from "@/lib/validators";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInPageContent />
    </Suspense>
  );
}

function SignInFallback() {
  return (
    <main className="panel w-full p-6">
      <h1 className="page-title">Sign in</h1>
      <p className="mt-1 text-sm text-mutedfg">Loading sign-in form...</p>
    </main>
  );
}

function SignInPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validated = signInSchema.safeParse({ email, password });
    if (!validated.success) {
      const issue = validated.error.issues[0];
      const message = issue ? `${issue.path}: ${issue.message}` : "Invalid form input";
      setError(message);
      await showErrorAlert("Invalid sign-in data", message);
      return;
    }

    setSubmitting(true);
    try {
      const authPayload = await apiRequest<unknown>("/auth/login", {
        method: "POST",
        body: validated.data
      });
      const sessionPayload = normalizeSessionPayload(authPayload, {
        email: validated.data.email
      });

      if (!sessionPayload) {
        throw new Error("Login succeeded but no token was returned by API");
      }

      await persistSession(sessionPayload);
      await showSuccessAlert("Signed in", "Redirecting to your dashboard");
      const nextParam = searchParams.get("next");
      const nextPath =
        nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
      window.location.assign(nextPath);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in";
      setError(message);
      await showErrorAlert("Sign in failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="panel w-full p-6">
      <h1 className="page-title">Sign in</h1>
      <p className="mt-1 text-sm text-mutedfg">Access your workspace account.</p>

      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input
            className="input w-full"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input
            className="input w-full"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="********"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-mutedfg">
        New here?{" "}
        <Link className="text-accent hover:underline" href="/auth/sign-up">
          Create an account
        </Link>
      </p>
    </main>
  );
}
