"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { apiRequest } from "@/lib/crm-api";
import { normalizeSessionPayload, persistSession } from "@/lib/auth-flow";
import { showErrorAlert, showInfoAlert, showSuccessAlert } from "@/lib/sweet-alert";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInPageContent />
    </Suspense>
  );
}

function SignInFallback() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  return (
    <main className="mx-auto w-full max-w-[560px] animate-pulse">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{tr("Welcome back", "مرحبًا بعودتك")}</h1>
        <p className="mt-2 text-sm text-mutedfg">{tr("Loading sign-in form...", "جاري تحميل نموذج الدخول...")}</p>
        <div className="mt-6 h-11 rounded-xl border border-border bg-surface2" />
        <div className="mt-3 h-11 rounded-xl border border-border bg-surface2" />
        <div className="mt-4 h-11 rounded-xl border border-border bg-surface2" />
      </div>
    </main>
  );
}

function SignInPageContent() {
  const { t, language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const isArabic = language === "ar";
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanIdentifier = identifier.trim();
    if (cleanIdentifier.length < 3) {
      const message = tr("Username is too short.", "اسم المستخدم قصير جدًا.");
      setError(message);
      await showErrorAlert(t("signin.invalidDataTitle"), message);
      return;
    }

    if (password.length < 8) {
      const message = tr("Password must be at least 8 characters.", "يجب أن تكون كلمة المرور 8 أحرف على الأقل.");
      setError(message);
      await showErrorAlert(t("signin.invalidDataTitle"), message);
      return;
    }

    setSubmitting(true);
    try {
      const authPayload = await apiRequest<unknown>("/auth/login", {
        method: "POST",
        body: {
          email: cleanIdentifier,
          username: cleanIdentifier,
          login: cleanIdentifier,
          password
        }
      });

      const fallbackEmail = cleanIdentifier.includes("@") ? cleanIdentifier : `${cleanIdentifier}@que.local`;
      const sessionPayload = normalizeSessionPayload(authPayload, {
        email: fallbackEmail
      });

      if (!sessionPayload) {
        throw new Error("Login succeeded but no token was returned by API");
      }

      await persistSession(sessionPayload);
      await showSuccessAlert(t("signin.successTitle"), t("signin.successText"));
      const nextParam = searchParams.get("next");
      const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
      window.location.assign(nextPath);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t("signin.failureFallback");
      setError(message);
      await showErrorAlert(t("signin.failureTitle"), message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotPassword() {
    await showInfoAlert(
      tr("Password reset is not configured yet.", "إعادة تعيين كلمة المرور غير مفعلة بعد."),
      tr("Please contact your administrator.", "يرجى التواصل مع مسؤول النظام.")
    );
  }

  return (
    <main className="mx-auto w-full max-w-[560px]">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-mutedfg">
            {tr("Secure sign in", "تسجيل دخول آمن")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">{tr("Welcome back", "مرحبًا بعودتك")}</h1>
          <p className="mt-1 text-sm text-mutedfg">
            {tr("Use your username and password to access Que.", "استخدم اسم المستخدم وكلمة المرور للوصول إلى كيو.")}
          </p>
        </div>

        {searchParams.get("next") ? (
          <p className="mb-4 rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-mutedfg">
            {t("signin.redirectedInfo")}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{tr("Username", "اسم المستخدم")}</span>
            <input
              className="input h-11 w-full rounded-xl border-border bg-surface2 px-3"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              type="text"
              placeholder={tr("Enter username or email", "أدخل اسم المستخدم أو البريد الإلكتروني")}
              autoComplete="username"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg">{t("signin.password")}</span>
            <div className="relative">
              <input
                className={[
                  "input h-11 w-full rounded-xl border-border bg-surface2 px-3",
                  isArabic ? "pl-11" : "pr-11"
                ].join(" ")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder={t("signin.passwordPlaceholder")}
                autoComplete="current-password"
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

          <div className="flex items-center justify-end">
            <button
              className="text-sm text-mutedfg transition hover:text-fg"
              onClick={onForgotPassword}
              type="button"
            >
              {tr("Forgot password?", "نسيت كلمة المرور؟")}
            </button>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button className="btn btn-primary h-11 w-full rounded-xl text-sm font-semibold" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                {t("signin.submitting")}
              </>
            ) : (
              <>
                {t("signin.submit")}
                {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-mutedfg">
          {t("signin.newToQue")}{" "}
          <Link className="font-medium text-fg hover:underline" href="/auth/sign-up">
            {t("signin.createAccount")}
          </Link>
        </p>
      </section>
    </main>
  );
}
