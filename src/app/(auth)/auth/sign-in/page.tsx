"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useState } from "react";
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
    <section className="w-full animate-pulse rounded-[1.9rem] border border-black/10 bg-white p-6 shadow-[0_18px_48px_rgba(16,18,23,0.12)] sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-[#0f1218]">{tr("Welcome back", "مرحبًا بعودتك")}</h1>
      <p className="mt-2 text-sm text-black/58">{tr("Loading sign-in form...", "جاري تحميل نموذج الدخول...")}</p>
      <div className="mt-6 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
      <div className="mt-3 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
      <div className="mt-4 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
    </section>
  );
}

function SignInPageContent() {
  const { t, language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const isArabic = language === "ar";
  const searchParams = useSearchParams();
  const isExpiredSession = searchParams.get("expired") === "1";
  const fieldClass =
    "h-12 w-full rounded-2xl border border-black/12 bg-[#f8f9fb] px-4 text-sm text-[#0f1218] outline-none transition focus:border-black/25 focus:bg-white focus:shadow-[0_0_0_4px_rgba(17,19,25,0.08)]";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpiredSession) return;

    void fetch("/api/session", {
      method: "DELETE",
      keepalive: true
    }).catch(() => {
      // Clearing the cookie is best effort. Sign-in should remain available either way.
    });
  }, [isExpiredSession]);

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
    <section className="w-full rounded-[1.9rem] border border-black/10 bg-white p-6 shadow-[0_20px_52px_rgba(16,18,23,0.14)] sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/56">
          {tr("Secure sign in", "تسجيل دخول آمن")}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#0f1218]">{tr("Welcome back", "مرحبًا بعودتك")}</h1>
        <p className="mt-1 text-sm text-black/60">
          {tr("Use your username and password to access Que.", "استخدم اسم المستخدم وكلمة المرور للوصول إلى كيو.")}
        </p>
      </div>

      {isExpiredSession ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          {tr("Your session expired. Sign in again to continue.", "انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.")}
        </p>
      ) : null}

      {searchParams.get("next") ? (
        <p className="mb-4 rounded-2xl border border-black/10 bg-[#f8f9fb] px-4 py-2.5 text-sm text-black/58">
          {t("signin.redirectedInfo")}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{tr("Username", "اسم المستخدم")}</span>
          <input
            className={fieldClass}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            type="text"
            placeholder={tr("Enter username or email", "أدخل اسم المستخدم أو البريد الإلكتروني")}
            autoComplete="username"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{t("signin.password")}</span>
          <div className="relative">
            <input
              className={[fieldClass, isArabic ? "pl-11" : "pr-11"].join(" ")}
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
                "absolute inset-y-0 inline-flex w-10 items-center justify-center text-black/45 transition hover:text-black/70",
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
            className="text-sm text-black/55 transition hover:text-black"
            onClick={onForgotPassword}
            type="button"
          >
            {tr("Forgot password?", "نسيت كلمة المرور؟")}
          </button>
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#111319] px-5 text-sm font-semibold text-white transition hover:bg-[#1a1d25] disabled:cursor-not-allowed disabled:opacity-65"
          type="submit"
          disabled={submitting}
        >
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

      <p className="mt-5 text-sm text-black/58">
        {t("signin.newToQue")}{" "}
        <Link className="font-semibold text-[#0f1218] hover:underline" href="/auth/sign-up">
          {t("signin.createAccount")}
        </Link>
      </p>
    </section>
  );
}
