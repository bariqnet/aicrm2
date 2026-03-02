"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { normalizeSessionPayload, persistSession } from "@/lib/auth-flow";
import { CRM_TYPE_CONFIGS, getCrmTypeConfig } from "@/lib/crm-type";
import type { CrmTypeId, MembershipRole, Stage } from "@/lib/crm-types";
import {
  getResponseError,
  showErrorAlert,
  showInfoAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";
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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [busyStep, setBusyStep] = useState<OnboardingStep | null>(null);

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

  async function configureWorkspace() {
    const normalizedName = workspaceName.trim();
    const normalizedSlug = slugify(workspaceSlug);

    const validated = workspaceSchema.safeParse({
      name: normalizedName,
      slug: normalizedSlug
    });
    if (!validated.success) {
      const issue = validated.error.issues[0];
      await showErrorAlert("Invalid workspace data", issue ? `${issue.path}: ${issue.message}` : "Please review workspace fields.");
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
        await showSuccessAlert("Workspace configured", "Step 1 completed.");
        return;
      }

      const createWorkspaceResponse = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, slug: normalizedSlug })
      });
      if (!createWorkspaceResponse.ok) {
        throw new Error(await getResponseError(createWorkspaceResponse, "Unable to configure workspace"));
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
      await showSuccessAlert("Workspace configured", "Step 1 completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to configure workspace";
      await showErrorAlert("Workspace setup failed", message);
    } finally {
      setBusyStep(null);
    }
  }

  async function syncStagesFallback(targetStages: Array<{ name: string; order: number }>) {
    const existingResponse = await fetch("/api/stages", { cache: "no-store" });
    if (!existingResponse.ok) {
      throw new Error(await getResponseError(existingResponse, "Unable to load existing stages"));
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
        throw new Error(await getResponseError(response, `Unable to save stage "${stage.name}"`));
      }
    }
  }

  async function configureStages() {
    if (cleanStages.length === 0) {
      await showErrorAlert("No stages configured", "Add at least one stage to continue.");
      return;
    }

    const uniqueNames = new Set(cleanStages.map((stage) => stage.name.toLowerCase()));
    if (uniqueNames.size !== cleanStages.length) {
      await showErrorAlert("Duplicate stage names", "Each stage name must be unique.");
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
      await showSuccessAlert("Stages configured", "Step 2 completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to configure stages";
      await showErrorAlert("Stage setup failed", message);
    } finally {
      setBusyStep(null);
    }
  }

  function addInvite() {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) return;

    if (!isEmail(normalizedEmail)) {
      showErrorAlert("Invalid email", "Enter a valid email before adding an invite.").catch(() => {
        // best effort
      });
      return;
    }

    if (invites.some((invite) => invite.email.toLowerCase() === normalizedEmail)) {
      showInfoAlert("Already added", "This email is already in your invite list.").catch(() => {
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
        throw new Error(await getResponseError(response, `Unable to invite ${invite.email}`));
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
        "Onboarding complete",
        sendInvites && invites.length > 0
          ? "Workspace, stages, and invites are ready."
          : "Workspace and stages are ready. You can invite teammates later."
      );
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to finish onboarding";
      await showErrorAlert("Onboarding failed", message);
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

  const stepCards = [
    {
      id: 1 as OnboardingStep,
      title: "Workspace",
      hint: "Identity and CRM template",
      done: workspaceReady
    },
    {
      id: 2 as OnboardingStep,
      title: "Pipeline",
      hint: "Stage design and priority flow",
      done: stagesReady
    },
    {
      id: 3 as OnboardingStep,
      title: "Team",
      hint: "Invite collaborators",
      done: false
    }
  ];

  return (
    <main className="app-page">
      <header className="space-y-2">
        <h1 className="page-title">Set up your Que workspace</h1>
        <p className="page-subtitle">Smart onboarding to configure your workspace, pipeline, and team in minutes.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {stepCards.map((card) => (
          <article
            key={card.id}
            className={[
              "panel p-4 transition",
              currentStep === card.id ? "border-fg/30 bg-surface" : "",
              card.done ? "ring-1 ring-green-500/25" : ""
            ].join(" ")}
          >
            <p className="muted-label">Step {card.id}</p>
            <p className="mt-1 text-base font-semibold">{card.title}</p>
            <p className="mt-1 text-sm text-mutedfg">{card.hint}</p>
          </article>
        ))}
      </section>

      {currentStep === 1 ? (
        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-mutedfg" />
            <h2 className="text-sm font-semibold">Workspace configuration</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Workspace name
              <input
                className="input mt-1 w-full"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Que Growth Team"
                required
              />
            </label>
            <label className="text-sm">
              Workspace slug
              <input
                className="input mt-1 w-full"
                value={workspaceSlug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setWorkspaceSlug(slugify(event.target.value));
                }}
                placeholder="que-growth-team"
                required
              />
            </label>
            <label className="text-sm">
              CRM template
              <select
                className="input mt-1 w-full"
                value={crmTypeId}
                onChange={(event) => setCrmTypeId(event.target.value as CrmTypeId)}
              >
                {crmTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-surface2 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-mutedfg">Suggested stage template</p>
            <p className="mt-2 text-sm text-mutedfg">
              {getCrmTypeConfig(crmTypeId).stageTemplates.map((stage) => stage.name).join(" → ")}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button className="btn btn-primary" type="button" onClick={configureWorkspace} disabled={busyStep === 1}>
              {busyStep === 1 ? "Saving..." : "Save and continue"}
            </button>
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-mutedfg" />
            <h2 className="text-sm font-semibold">Pipeline stage setup</h2>
          </div>

          <div className="space-y-2">
            {stageDrafts.map((stage, index) => (
              <div key={stage.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface2 px-2 py-2">
                <span className="w-7 text-center text-xs text-mutedfg">{index + 1}</span>
                <input
                  className="input h-9 min-w-[180px] flex-1"
                  value={stage.name}
                  onChange={(event) => updateStageName(stage.id, event.target.value)}
                  placeholder="Stage name"
                />
                <button className="btn h-9 w-9 px-0" onClick={() => moveStage(stage.id, "up")} type="button" aria-label="Move stage up">
                  <ArrowUp size={14} />
                </button>
                <button className="btn h-9 w-9 px-0" onClick={() => moveStage(stage.id, "down")} type="button" aria-label="Move stage down">
                  <ArrowDown size={14} />
                </button>
                <button className="btn h-9 w-9 px-0" onClick={() => removeStage(stage.id)} type="button" aria-label="Remove stage">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={addStage}>
              <Plus size={14} />
              Add stage
            </button>
            <button className="btn" type="button" onClick={resetStageTemplate}>
              <Sparkles size={14} />
              Reset from template
            </button>
          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <button className="btn" type="button" onClick={() => setCurrentStep(1)}>
              Back
            </button>
            <button className="btn btn-primary" type="button" onClick={configureStages} disabled={busyStep === 2}>
              {busyStep === 2 ? "Saving..." : "Save and continue"}
            </button>
          </div>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users size={16} className="text-mutedfg" />
            <h2 className="text-sm font-semibold">Invite your team</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="input w-full"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="team.member@company.com"
              type="email"
            />
            <select className="input w-full sm:w-36" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as MembershipRole)}>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button type="button" className="btn" onClick={addInvite}>
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {invites.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-surface2 px-3 py-2 text-sm text-mutedfg">
                No invites added yet. You can skip and invite teammates later.
              </p>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <p className="font-medium">{invite.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-border px-2 py-0.5 text-xs text-mutedfg">{invite.role}</span>
                    <button
                      className="btn h-8 w-8 px-0"
                      type="button"
                      aria-label={`Remove ${invite.email}`}
                      onClick={() => setInvites((previous) => previous.filter((item) => item.id !== invite.id))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <button className="btn" type="button" onClick={() => setCurrentStep(2)}>
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn"
                type="button"
                onClick={() => finishOnboarding(false)}
                disabled={busyStep === 3}
              >
                Skip for now
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => finishOnboarding(true)}
                disabled={busyStep === 3}
              >
                {busyStep === 3 ? "Finishing..." : "Finish onboarding"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
