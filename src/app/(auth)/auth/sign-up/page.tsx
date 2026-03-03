"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
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
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  return (
    <main className="mx-auto w-full max-w-[560px] animate-pulse">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{tr("Create account", "إنشاء حساب")}</h1>
        <div className="mt-6 h-11 rounded-xl border border-border bg-surface2" />
        <div className="mt-3 h-11 rounded-xl border border-border bg-surface2" />
        <div className="mt-3 h-11 rounded-xl border border-border bg-surface2" />
        <div className="mt-3 h-11 rounded-xl border border-border bg-surface2" />
      </div>
    </main>
  );
}

function SignUpPageContent() {
  const { t, language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const isArabic = language === "ar";

  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanName = fullName.trim() || cleanUsername;
    const cleanEmail = email.trim();

    if (cleanUsername.length < 3) {
      const message = tr("Username must be at least 3 characters.", "يجب أن يكون اسم المستخدم 3 أحرف على الأقل.");
      setError(message);
      await showErrorAlert(t("signup.invalidDataTitle"), message);
      return;
    }

    if (password !== confirmPassword) {
      const message = tr("Password confirmation does not match.", "تأكيد كلمة المرور غير متطابق.");
      setError(message);
      await showErrorAlert(t("signup.invalidDataTitle"), message);
      return;
    }

    const validated = signUpSchema.safeParse({ name: cleanName, email: cleanEmail, password });
    if (!validated.success) {
      const issue = validated.error.issues[0];
      const message = issue ? `${issue.path}: ${issue.message}` : t("signup.invalidInput");
      setError(message);
      await showErrorAlert(t("signup.invalidDataTitle"), message);
      return;
    }

    setSubmitting(true);
    try {
      const inviteTokenParam = inviteToken ?? undefined;
      const registerPayload = await apiRequest<unknown>("/auth/register", {
        method: "POST",
        body: {
          ...validated.data,
          username: cleanUsername,
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
          body: { email: validated.data.email, username: cleanUsername, password: validated.data.password }
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
      await showSuccessAlert(t("signup.successTitle"), t("signup.successText"));
      router.replace("/onboarding");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t("signup.failureFallback");
      setError(message);
      await showErrorAlert(t("signup.failureTitle"), message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[560px]">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-mutedfg">
            {tr("Create account", "إنشاء حساب")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">
            {tr("Start with your username and password", "ابدأ باسم المستخدم وكلمة المرور")}
          </h1>
          <p className="mt-1 text-sm text-mutedfg">
            {tr("Create your Que access and continue to onboarding.", "أنشئ حسابك في كيو ثم أكمل خطوات الإعداد.")}
          </p>
        </div>

        {inviteToken ? (
          <p className="mb-4 rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-mutedfg">
            {t("signup.inviteDetected")}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{tr("Username", "اسم المستخدم")}</span>
            <input
              className="input h-11 w-full rounded-xl border-border bg-surface2 px-3"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              placeholder={tr("Choose a username", "اختر اسم المستخدم")}
              autoComplete="username"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{tr("Full name (optional)", "الاسم الكامل (اختياري)")}</span>
            <input
              className="input h-11 w-full rounded-xl border-border bg-surface2 px-3"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
              placeholder={t("signup.fullNamePlaceholder")}
              autoComplete="name"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{t("signup.email")}</span>
            <input
              className="input h-11 w-full rounded-xl border-border bg-surface2 px-3"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder={tr("Work email", "بريد العمل")}
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{t("signup.password")}</span>
            <div className="relative">
              <input
                className={[
                  "input h-11 w-full rounded-xl border-border bg-surface2 px-3",
                  isArabic ? "pl-11" : "pr-11"
                ].join(" ")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder={t("signup.passwordPlaceholder")}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={[
                  "absolute inset-y-0 inline-flex w-10 items-center justify-center text-mutedfg transition hover:text-fg",
                  isArabic ? "left-0" : "right-0"
                ].join(" ")}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("signin.hidePassword") : t("signin.showPassword")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{tr("Confirm password", "تأكيد كلمة المرور")}</span>
            <div className="relative">
              <input
                className={[
                  "input h-11 w-full rounded-xl border-border bg-surface2 px-3",
                  isArabic ? "pl-11" : "pr-11"
                ].join(" ")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showConfirmPassword ? "text" : "password"}
                placeholder={tr("Repeat password", "أعد إدخال كلمة المرور")}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={[
                  "absolute inset-y-0 inline-flex w-10 items-center justify-center text-mutedfg transition hover:text-fg",
                  isArabic ? "left-0" : "right-0"
                ].join(" ")}
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? t("signin.hidePassword") : t("signin.showPassword")}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button className="btn btn-primary h-11 w-full rounded-xl text-sm font-semibold" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                {t("signup.submitting")}
              </>
            ) : (
              <>
                {t("signup.submit")}
                {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-mutedfg">
          {t("signup.hasAccount")}{" "}
          <Link className="font-medium text-fg hover:underline" href="/auth/sign-in">
            {t("signup.signIn")}
          </Link>
        </p>
      </section>
    </main>
  );
}
