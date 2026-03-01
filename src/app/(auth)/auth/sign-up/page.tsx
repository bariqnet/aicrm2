"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { apiRequest } from "@/lib/crm-api";
import { normalizeSessionPayload, persistSession } from "@/lib/auth-flow";
import { showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";
import { signUpSchema } from "@/lib/validators";

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpPageContent />
    </Suspense>
  );
}

function SignUpFallback() {
  return (
    <main className="panel w-full p-6">
      <h1 className="page-title">Create account</h1>
      <p className="mt-1 text-sm text-mutedfg">Loading sign-up form...</p>
    </main>
  );
}

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validated = signUpSchema.safeParse({ name, email, password });
    if (!validated.success) {
      const issue = validated.error.issues[0];
      const message = issue ? `${issue.path}: ${issue.message}` : "Invalid form input";
      setError(message);
      await showErrorAlert("Invalid sign-up data", message);
      return;
    }

    setSubmitting(true);
    try {
      const inviteTokenParam = inviteToken ?? undefined;
      const registerPayload = await apiRequest<unknown>("/auth/register", {
        method: "POST",
        body: {
          ...validated.data,
          ...(inviteTokenParam ? { inviteToken: inviteTokenParam } : {})
        }
      });

      let sessionPayload = normalizeSessionPayload(registerPayload, {
        email: validated.data.email,
        name: validated.data.name
      });

      if (!sessionPayload) {
        const loginPayload = await apiRequest<unknown>("/auth/login", {
          method: "POST",
          body: { email: validated.data.email, password: validated.data.password }
        });
        sessionPayload = normalizeSessionPayload(loginPayload, {
          email: validated.data.email,
          name: validated.data.name
        });
      }

      if (!sessionPayload) {
        throw new Error("Account created but login token was not returned by API");
      }

      await persistSession(sessionPayload);
      await showSuccessAlert("Account created", "Welcome to AI CRM");
      router.replace("/onboarding");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account";
      setError(message);
      await showErrorAlert("Sign up failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="panel w-full p-6">
      <h1 className="page-title">Create account</h1>
      <p className="mt-1 text-sm text-mutedfg">Get started with your CRM workspace.</p>
      {inviteToken ? (
        <p className="mt-2 rounded-md border bg-muted/20 px-3 py-2 text-xs text-mutedfg">
          Invite token detected. Your account will be linked to the invited workspace.
        </p>
      ) : null}

      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm">Full name</label>
          <input
            className="input w-full"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />
        </div>
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
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-mutedfg">
        Already have an account?{" "}
        <Link className="text-accent hover:underline" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </main>
  );
}
