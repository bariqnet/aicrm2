"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
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
    <main className="panel w-full overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-fg via-mutedfg to-border" />
      <div className="p-6">
        <h1 className="page-title">Welcome back</h1>
        <p className="mt-1 text-sm text-mutedfg">Loading sign-in form...</p>
      </div>
    </main>
  );
}

function SignInPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await showSuccessAlert("Signed in", "Redirecting to your workspace");
      const nextParam = searchParams.get("next");
      const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
      window.location.assign(nextPath);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to sign in";
      setError(message);
      await showErrorAlert("Sign in failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="panel w-full overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-fg via-mutedfg to-border" />
      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between text-xs text-mutedfg">
          <span>Sign in</span>
          <span>Que workspace</span>
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back to Que</h1>
        <p className="mt-1 text-sm text-mutedfg">Access your workspace account.</p>

        {searchParams.get("next") ? (
          <p className="mt-3 rounded-md border border-border bg-surface2 px-3 py-2 text-xs text-mutedfg">
            You were redirected here because this page requires authentication.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1.5 text-sm">
            <span className="text-mutedfg">Work email</span>
            <input
              className="input w-full"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-mutedfg">Password</span>
            <div className="relative">
              <input
                className="input w-full pr-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-mutedfg hover:text-fg"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
            {!submitting ? <ArrowRight size={14} /> : null}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-mutedfg">
          <span>New to Que?</span>
          <Link className="text-accent hover:underline" href="/auth/sign-up">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
