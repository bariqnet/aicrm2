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
    <section className="w-full animate-pulse rounded-[1.9rem] border border-black/10 bg-white p-6 shadow-[0_18px_48px_rgba(16,18,23,0.12)] sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-[#0f1218]">{tr("Create account", "إنشاء حساب")}</h1>
      <div className="mt-6 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
      <div className="mt-3 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
      <div className="mt-3 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
      <div className="mt-3 h-12 rounded-2xl border border-black/10 bg-[#f8f9fb]" />
    </section>
  );
}

function SignUpPageContent() {
  const { t, language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const isArabic = language === "ar";
  const fieldClass =
    "h-12 w-full rounded-2xl border border-black/12 bg-[#f8f9fb] px-4 text-sm text-[#0f1218] outline-none transition focus:border-black/25 focus:bg-white focus:shadow-[0_0_0_4px_rgba(17,19,25,0.08)]";

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
    <section className="w-full rounded-[1.9rem] border border-black/10 bg-white p-6 shadow-[0_20px_52px_rgba(16,18,23,0.14)] sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/56">
          {tr("Create account", "إنشاء حساب")}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#0f1218]">
          {tr("Start with your username and password", "ابدأ باسم المستخدم وكلمة المرور")}
        </h1>
        <p className="mt-1 text-sm text-black/60">
          {tr("Create your Que access and continue to onboarding.", "أنشئ حسابك في كيو ثم أكمل خطوات الإعداد.")}
        </p>
      </div>

      {inviteToken ? (
        <p className="mb-4 rounded-2xl border border-black/10 bg-[#f8f9fb] px-4 py-2.5 text-sm text-black/58">
          {t("signup.inviteDetected")}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{tr("Username", "اسم المستخدم")}</span>
          <input
            className={fieldClass}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            placeholder={tr("Choose a username", "اختر اسم المستخدم")}
            autoComplete="username"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{tr("Full name (optional)", "الاسم الكامل (اختياري)")}</span>
          <input
            className={fieldClass}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            type="text"
            placeholder={t("signup.fullNamePlaceholder")}
            autoComplete="name"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{t("signup.email")}</span>
          <input
            className={fieldClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder={tr("Work email", "بريد العمل")}
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{t("signup.password")}</span>
          <div className="relative">
            <input
              className={[fieldClass, isArabic ? "pl-11" : "pr-11"].join(" ")}
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

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#0f1218]">{tr("Confirm password", "تأكيد كلمة المرور")}</span>
          <div className="relative">
            <input
              className={[fieldClass, isArabic ? "pl-11" : "pr-11"].join(" ")}
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
                "absolute inset-y-0 inline-flex w-10 items-center justify-center text-black/45 transition hover:text-black/70",
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

      <p className="mt-5 text-sm text-black/58">
        {t("signup.hasAccount")}{" "}
        <Link className="font-semibold text-[#0f1218] hover:underline" href="/auth/sign-in">
          {t("signup.signIn")}
        </Link>
      </p>
    </section>
  );
}
