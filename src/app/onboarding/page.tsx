"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  LoaderCircle,
  Plus,
  Trash2
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/hooks/useI18n";
import { normalizeSessionPayload, persistSession } from "@/lib/auth-flow";
import { CRM_TYPE_CONFIGS, getCrmTypeConfig } from "@/lib/crm-type";
import type { CrmTypeId, MembershipRole, Stage } from "@/lib/crm-types";
import { getResponseError, showErrorAlert, showInfoAlert, showSuccessAlert } from "@/lib/sweet-alert";
import { workspaceSchema } from "@/lib/validators";

type OnboardingStep = 1 | 2 | 3;
type StageDraft = { id: string; name: string };
type InviteDraft = { id: string; email: string; role: MembershipRole };

type UserProfile = {
  name?: string;
  email?: string;
};

const ROLE_OPTIONS: MembershipRole[] = ["MEMBER", "ADMIN", "OWNER"];

function makeLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toStageDrafts(typeId: CrmTypeId): StageDraft[] {
  return getCrmTypeConfig(typeId).stageTemplates.map((template) => ({
    id: makeLocalId("stage"),
    name: template.name
  }));
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function OnboardingPage() {
  const { t, language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const isArabic = language === "ar";
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [busyStep, setBusyStep] = useState<OnboardingStep | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [crmTypeId, setCrmTypeId] = useState<CrmTypeId>("software-company");
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});

  const [stageDrafts, setStageDrafts] = useState<StageDraft[]>(() => toStageDrafts("software-company"));
  const [stagesTouched, setStagesTouched] = useState(false);
  const [stagesReady, setStagesReady] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>("MEMBER");
  const [invites, setInvites] = useState<InviteDraft[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => null)) as
          | { user?: { name?: string; email?: string } }
          | null;
        if (cancelled || !payload?.user) return;
        setUserProfile({
          name: payload.user.name,
          email: payload.user.email
        });
      } catch {
        // Non-blocking.
      }
    }

    loadProfile().catch(() => {
      // Non-blocking.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slugTouched) return;
    setWorkspaceSlug(slugify(workspaceName));
  }, [workspaceName, slugTouched]);

  useEffect(() => {
    if (stagesTouched) return;
    setStageDrafts(toStageDrafts(crmTypeId));
  }, [crmTypeId, stagesTouched]);

  const crmTypeOptions = useMemo(
    () => Object.values(CRM_TYPE_CONFIGS).map((config) => ({ id: config.id, label: config.label })),
    []
  );

  const cleanStages = useMemo(
    () =>
      stageDrafts
        .map((draft) => draft.name.trim())
        .filter((name) => name.length > 0)
        .map((name, index) => ({ name, order: index + 1 })),
    [stageDrafts]
  );

  async function maybePersistSessionFromPayload(payload: unknown): Promise<void> {
    const normalized = normalizeSessionPayload(payload, {
      email: userProfile.email ?? "user@que.local",
      name: userProfile.name
    });
    if (normalized) {
      await persistSession(normalized);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getResponseError(response, t("signout.errorFallback")));
      }
      window.location.assign("/auth/sign-in");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("signout.errorFallback");
      await showErrorAlert(t("signout.errorTitle"), message);
    } finally {
      setSigningOut(false);
    }
  }

  async function configureWorkspace() {
    const normalizedName = workspaceName.trim();
    const normalizedSlug = slugify(workspaceSlug);

    const validated = workspaceSchema.safeParse({
      name: normalizedName,
      slug: normalizedSlug
    });
    if (!validated.success) {
      const issue = validated.error.issues[0];
      await showErrorAlert(
        t("onboarding.alert.invalidWorkspaceTitle"),
        issue ? `${issue.path}: ${issue.message}` : t("onboarding.alert.invalidWorkspaceText")
      );
      return;
    }

    setBusyStep(1);
    try {
      const onboardingResponse = await fetch("/api/onboarding/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          slug: normalizedSlug,
          crmTypeId
        })
      });

      if (onboardingResponse.ok) {
        const onboardingPayload = await onboardingResponse.json().catch(() => null);
        await maybePersistSessionFromPayload(onboardingPayload);
        setWorkspaceReady(true);
        setCurrentStep(2);
        await showSuccessAlert(
          t("onboarding.alert.workspaceConfiguredTitle"),
          t("onboarding.alert.workspaceConfiguredText")
        );
        return;
      }

      const createWorkspaceResponse = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, slug: normalizedSlug })
      });
      if (!createWorkspaceResponse.ok) {
        throw new Error(
          await getResponseError(
            createWorkspaceResponse,
            t("onboarding.alert.workspaceSetupFailedFallback")
          )
        );
      }

      const createdWorkspace = (await createWorkspaceResponse.json().catch(() => null)) as { id?: string } | null;
      if (createdWorkspace?.id) {
        const switchResponse = await fetch("/api/workspaces/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: createdWorkspace.id })
        });
        if (switchResponse.ok) {
          const switchPayload = await switchResponse.json().catch(() => null);
          await maybePersistSessionFromPayload(switchPayload);
        }
      }

      setWorkspaceReady(true);
      setCurrentStep(2);
      await showSuccessAlert(
        t("onboarding.alert.workspaceConfiguredTitle"),
        t("onboarding.alert.workspaceConfiguredText")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t("onboarding.alert.workspaceSetupFailedFallback");
      await showErrorAlert(t("onboarding.alert.workspaceSetupFailedTitle"), message);
    } finally {
      setBusyStep(null);
    }
  }

  async function syncStagesFallback(targetStages: Array<{ name: string; order: number }>) {
    const existingResponse = await fetch("/api/stages", { cache: "no-store" });
    if (!existingResponse.ok) {
      throw new Error(await getResponseError(existingResponse, t("onboarding.alert.loadStagesFailed")));
    }
    const existingPayload = (await existingResponse.json().catch(() => null)) as { rows?: Stage[] } | null;
    const existing = [...(existingPayload?.rows ?? [])].sort((a, b) => a.order - b.order);

    for (const [index, stage] of targetStages.entries()) {
      const body = JSON.stringify({ name: stage.name, order: index + 1 });
      const existingStage = existing[index];

      const response = existingStage
        ? await fetch(`/api/stages/${existingStage.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body
          })
        : await fetch("/api/stages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
          });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            t("onboarding.alert.saveStageFailed", { name: stage.name })
          )
        );
      }
    }
  }

  async function configureStages() {
    if (cleanStages.length === 0) {
      await showErrorAlert(t("onboarding.alert.noStagesTitle"), t("onboarding.alert.noStagesText"));
      return;
    }

    const uniqueNames = new Set(cleanStages.map((stage) => stage.name.toLowerCase()));
    if (uniqueNames.size !== cleanStages.length) {
      await showErrorAlert(
        t("onboarding.alert.duplicateStagesTitle"),
        t("onboarding.alert.duplicateStagesText")
      );
      return;
    }

    setBusyStep(2);
    try {
      const onboardingResponse = await fetch("/api/onboarding/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crmTypeId,
          stages: cleanStages
        })
      });

      if (!onboardingResponse.ok) {
        await syncStagesFallback(cleanStages);
      }

      setStagesReady(true);
      setCurrentStep(3);
      await showSuccessAlert(
        t("onboarding.alert.stagesConfiguredTitle"),
        t("onboarding.alert.stagesConfiguredText")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t("onboarding.alert.stageSetupFailedFallback");
      await showErrorAlert(t("onboarding.alert.stageSetupFailedTitle"), message);
    } finally {
      setBusyStep(null);
    }
  }

  function addInvite() {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) return;

    if (!isEmail(normalizedEmail)) {
      showErrorAlert(t("onboarding.alert.invalidEmailTitle"), t("onboarding.alert.invalidEmailText")).catch(() => {
        // best effort
      });
      return;
    }

    if (invites.some((invite) => invite.email.toLowerCase() === normalizedEmail)) {
      showInfoAlert(t("onboarding.alert.alreadyAddedTitle"), t("onboarding.alert.alreadyAddedText")).catch(() => {
        // best effort
      });
      return;
    }

    setInvites((previous) => [
      ...previous,
      { id: makeLocalId("invite"), email: normalizedEmail, role: inviteRole }
    ]);
    setInviteEmail("");
    setInviteRole("MEMBER");
  }

  async function sendInvitesFallback(payload: InviteDraft[]) {
    for (const invite of payload) {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.email, role: invite.role })
      });
      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            t("onboarding.alert.inviteFailed", { email: invite.email })
          )
        );
      }
    }
  }

  async function finishOnboarding(sendInvites: boolean) {
    setBusyStep(3);
    try {
      if (sendInvites && invites.length > 0) {
        const onboardingResponse = await fetch("/api/onboarding/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invites: invites.map(({ email, role }) => ({ email, role })) })
        });

        if (!onboardingResponse.ok) {
          await sendInvitesFallback(invites);
        }
      }

      await showSuccessAlert(
        t("onboarding.alert.completeTitle"),
        sendInvites && invites.length > 0
          ? t("onboarding.alert.completeWithInvitesText")
          : t("onboarding.alert.completeWithoutInvitesText")
      );
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("onboarding.alert.finishFailedFallback");
      await showErrorAlert(t("onboarding.alert.finishFailedTitle"), message);
    } finally {
      setBusyStep(null);
    }
  }

  function updateStageName(id: string, name: string) {
    setStagesTouched(true);
    setStageDrafts((previous) => previous.map((stage) => (stage.id === id ? { ...stage, name } : stage)));
  }

  function moveStage(id: string, direction: "up" | "down") {
    setStagesTouched(true);
    setStageDrafts((previous) => {
      const index = previous.findIndex((stage) => stage.id === id);
      if (index < 0) return previous;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      const current = next[index];
      next[index] = next[target] as StageDraft;
      next[target] = current as StageDraft;
      return next;
    });
  }

  function removeStage(id: string) {
    setStagesTouched(true);
    setStageDrafts((previous) => previous.filter((stage) => stage.id !== id));
  }

  function addStage() {
    setStagesTouched(true);
    setStageDrafts((previous) => [...previous, { id: makeLocalId("stage"), name: "" }]);
  }

  function resetStageTemplate() {
    setStagesTouched(false);
    setStageDrafts(toStageDrafts(crmTypeId));
  }

  const roleLabels: Record<MembershipRole, string> = {
    MEMBER: t("roles.member"),
    ADMIN: t("roles.admin"),
    OWNER: t("roles.owner")
  };

  const stepDots: OnboardingStep[] = [1, 2, 3];

  const doneSteps: Record<OnboardingStep, boolean> = {
    1: workspaceReady,
    2: stagesReady,
    3: false
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface2">
      <header className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="min-w-[120px]">
            <Image
              src="/fav.png"
              alt="Que logo"
              width={26}
              height={26}
              className="h-6 w-6 rounded-md border border-border bg-surface p-0.5"
              priority
            />
          </div>

          <div className="flex items-center gap-2">
            {stepDots.map((step) => {
              const active = currentStep === step;
              const done = doneSteps[step];
              return (
                <button
                  key={step}
                  type="button"
                  className={[
                    "h-2 w-2 rounded-full transition",
                    active ? "bg-accent" : done ? "bg-fg/55" : "bg-border",
                    step < currentStep ? "cursor-pointer" : "cursor-default"
                  ].join(" ")}
                  aria-label={t("onboarding.stepLabel", { number: step })}
                  onClick={() => {
                    if (step < currentStep) setCurrentStep(step);
                  }}
                />
              );
            })}
          </div>

          <div className="flex min-w-[120px] items-center justify-end gap-3">
            <LanguageToggle />
            {userProfile.email ? <p className="hidden text-sm text-mutedfg lg:block">{userProfile.email}</p> : null}
            <button
              type="button"
              className="text-sm font-medium text-fg transition hover:text-mutedfg"
              onClick={signOut}
              disabled={signingOut}
            >
              {signingOut ? t("signout.signingOut") : tr("Log out", "تسجيل الخروج")}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 pb-10 sm:px-6">
        <section className="mx-auto w-full max-w-[620px]">
          {currentStep === 1 ? (
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {tr("Create your workspace", "أنشئ مساحة العمل")}
              </h1>
              <p className="mt-2 text-lg text-mutedfg">{t("onboarding.step.workspace.hint")}</p>

              <div className="mt-8 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="text-mutedfg">{t("onboarding.workspace.name")}</span>
                    <input
                      className="input h-12 w-full rounded-xl border-border bg-surface px-4"
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      placeholder={t("onboarding.workspace.namePlaceholder")}
                      required
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-mutedfg">{t("onboarding.workspace.slug")}</span>
                    <input
                      className="input h-12 w-full rounded-xl border-border bg-surface px-4"
                      value={workspaceSlug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        setWorkspaceSlug(slugify(event.target.value));
                      }}
                      placeholder={t("onboarding.workspace.slugPlaceholder")}
                      required
                    />
                  </label>
                </div>

                <label className="space-y-1.5 text-sm">
                  <span className="text-mutedfg">{t("onboarding.workspace.crmTemplate")}</span>
                  <select
                    className="input h-12 w-full rounded-xl border-border bg-surface px-4"
                    value={crmTypeId}
                    onChange={(event) => setCrmTypeId(event.target.value as CrmTypeId)}
                  >
                    {crmTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-mutedfg">
                  <p className="mb-1 text-xs uppercase tracking-[0.1em]">{t("onboarding.workspace.suggestedTemplate")}</p>
                  <p>{getCrmTypeConfig(crmTypeId).stageTemplates.map((stage) => stage.name).join(" → ")}</p>
                </div>

                <button
                  className="btn btn-primary h-12 w-full rounded-xl text-base"
                  type="button"
                  onClick={configureWorkspace}
                  disabled={busyStep === 1}
                >
                  {busyStep === 1 ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      {t("onboarding.saving")}
                    </>
                  ) : (
                    <>
                      {t("onboarding.saveContinue")}
                      {isArabic ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {tr("Set your pipeline", "اضبط خط المبيعات")}
              </h1>
              <p className="mt-2 text-lg text-mutedfg">{t("onboarding.step.pipeline.hint")}</p>

              <div className="mt-8 space-y-2">
                {stageDrafts.map((stage, index) => (
                  <div key={stage.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                    <span className="w-7 text-center text-sm text-mutedfg">{index + 1}</span>
                    <input
                      className="input h-10 min-w-[180px] flex-1 rounded-lg border-border bg-surface2 px-3"
                      value={stage.name}
                      onChange={(event) => updateStageName(stage.id, event.target.value)}
                      placeholder={t("onboarding.pipeline.stagePlaceholder")}
                    />
                    <button
                      className="btn h-9 w-9 rounded-lg px-0"
                      onClick={() => moveStage(stage.id, "up")}
                      type="button"
                      aria-label={t("onboarding.pipeline.moveUp")}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="btn h-9 w-9 rounded-lg px-0"
                      onClick={() => moveStage(stage.id, "down")}
                      type="button"
                      aria-label={t("onboarding.pipeline.moveDown")}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="btn h-9 w-9 rounded-lg px-0"
                      onClick={() => removeStage(stage.id)}
                      type="button"
                      aria-label={t("onboarding.pipeline.removeStage")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn rounded-xl" type="button" onClick={addStage}>
                  <Plus size={14} />
                  {t("onboarding.pipeline.addStage")}
                </button>
                <button className="btn rounded-xl" type="button" onClick={resetStageTemplate}>
                  {t("onboarding.pipeline.resetTemplate")}
                </button>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button className="btn h-12 rounded-xl" type="button" onClick={() => setCurrentStep(1)}>
                  {t("onboarding.back")}
                </button>
                <button
                  className="btn btn-primary h-12 rounded-xl text-base"
                  type="button"
                  onClick={configureStages}
                  disabled={busyStep === 2}
                >
                  {busyStep === 2 ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      {t("onboarding.saving")}
                    </>
                  ) : (
                    <>
                      {t("onboarding.saveContinue")}
                      {isArabic ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {tr("Invite your team", "ادعُ فريقك")}
              </h1>
              <p className="mt-2 text-lg text-mutedfg">{t("onboarding.step.team.hint")}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <input
                  className="input h-12 w-full rounded-xl border-border bg-surface px-4"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder={t("onboarding.team.emailPlaceholder")}
                  type="email"
                />
                <select
                  className="input h-12 w-full rounded-xl border-border bg-surface px-4 sm:w-36"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as MembershipRole)}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role] ?? role}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn h-12 rounded-xl" onClick={addInvite}>
                  <Plus size={14} />
                  {t("onboarding.team.add")}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {invites.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-sm text-mutedfg">
                    {t("onboarding.team.noInvites")}
                  </p>
                ) : (
                  invites.map((invite) => (
                    <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm">
                      <p className="font-medium text-fg">{invite.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-mutedfg">
                          {roleLabels[invite.role] ?? invite.role}
                        </span>
                        <button
                          className="btn h-8 w-8 rounded-lg px-0"
                          type="button"
                          aria-label={t("onboarding.team.removeInvite", { email: invite.email })}
                          onClick={() => setInvites((previous) => previous.filter((item) => item.id !== invite.id))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <button className="btn h-12 rounded-xl" type="button" onClick={() => setCurrentStep(2)}>
                  {t("onboarding.back")}
                </button>
                <button
                  className="btn h-12 rounded-xl"
                  type="button"
                  onClick={() => finishOnboarding(false)}
                  disabled={busyStep === 3}
                >
                  {t("onboarding.skipNow")}
                </button>
                <button
                  className="btn btn-primary h-12 rounded-xl text-base"
                  type="button"
                  onClick={() => finishOnboarding(true)}
                  disabled={busyStep === 3}
                >
                  {busyStep === 3 ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      {t("onboarding.finishing")}
                    </>
                  ) : (
                    t("onboarding.finish")
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-zinc-100">
            <Image src="/fav.png" alt="Que logo" width={34} height={34} className="h-8 w-8 rounded-md" />
            <span className="text-2xl font-semibold tracking-tight">Que</span>
          </div>
          <p className="text-sm text-zinc-300">{tr("AI-driven CRM", "CRM مدعوم بالذكاء الاصطناعي")}</p>
        </div>
      </footer>
    </div>
  );
}
