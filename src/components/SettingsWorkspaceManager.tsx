"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { getDateLocale } from "@/lib/locale";
import {
  confirmAlert,
  getResponseError,
  showErrorAlert,
  showSuccessAlert,
} from "@/lib/sweet-alert";

type SettingsWorkspaceManagerProps = {
  workspaceId?: string | null;
};

type StageItem = {
  id: string;
  name: string;
  order: number;
  workspaceId?: string;
};

type InviteItem = {
  id: string;
  email: string;
  role: string;
  workspaceId?: string;
  expiresAt?: string | null;
  acceptedAt?: string | null;
};

type MembershipItem = {
  id: string;
  userId: string;
  workspaceId?: string;
  role: string;
  createdAt?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

type WorkspaceItem = {
  id: string;
  name: string;
  slug?: string | null;
};

const ROLE_OPTIONS = ["MEMBER", "ADMIN", "OWNER"] as const;

function rowsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.rows)) return source.rows;
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.data)) return source.data;
  return [];
}

function toStageItems(payload: unknown): StageItem[] {
  const mapped: Array<StageItem | null> = rowsFromPayload(payload).map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") return null;
    const orderValue = typeof row.order === "number" ? row.order : Number(row.order ?? 0);
    return {
      id: row.id,
      name: row.name,
      order: Number.isFinite(orderValue) ? orderValue : 0,
      workspaceId: typeof row.workspaceId === "string" ? row.workspaceId : undefined,
    };
  });

  return mapped
    .filter((item): item is StageItem => item !== null)
    .sort((a, b) => a.order - b.order);
}

function toInviteItems(payload: unknown): InviteItem[] {
  const mapped: Array<InviteItem | null> = rowsFromPayload(payload).map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.email !== "string") return null;
    return {
      id: row.id,
      email: row.email,
      role: typeof row.role === "string" ? row.role : "MEMBER",
      workspaceId: typeof row.workspaceId === "string" ? row.workspaceId : undefined,
      expiresAt: typeof row.expiresAt === "string" ? row.expiresAt : null,
      acceptedAt: typeof row.acceptedAt === "string" ? row.acceptedAt : null,
    };
  });

  return mapped.filter((item): item is InviteItem => item !== null);
}

function toMembershipItems(payload: unknown): MembershipItem[] {
  const mapped: Array<MembershipItem | null> = rowsFromPayload(payload).map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.userId !== "string") return null;

    const userSource = row.user;
    const user =
      userSource && typeof userSource === "object"
        ? {
            id:
              typeof (userSource as Record<string, unknown>).id === "string"
                ? ((userSource as Record<string, unknown>).id as string)
                : undefined,
            name:
              typeof (userSource as Record<string, unknown>).name === "string"
                ? ((userSource as Record<string, unknown>).name as string)
                : undefined,
            email:
              typeof (userSource as Record<string, unknown>).email === "string"
                ? ((userSource as Record<string, unknown>).email as string)
                : undefined,
          }
        : undefined;

    return {
      id: row.id,
      userId: row.userId,
      workspaceId: typeof row.workspaceId === "string" ? row.workspaceId : undefined,
      role: typeof row.role === "string" ? row.role : "MEMBER",
      createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
      user,
    };
  });

  return mapped.filter((item): item is MembershipItem => item !== null);
}

function toWorkspaceItems(payload: unknown): WorkspaceItem[] {
  const mapped: Array<WorkspaceItem | null> = rowsFromPayload(payload).map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") return null;
    return {
      id: row.id,
      name: row.name,
      slug: typeof row.slug === "string" ? row.slug : null,
    };
  });

  return mapped.filter((item): item is WorkspaceItem => item !== null);
}

function swap<T>(items: T[], first: number, second: number): T[] {
  const next = [...items];
  const temp = next[first];
  next[first] = next[second];
  next[second] = temp;
  return next;
}

function isEmail(value: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
}

export function SettingsWorkspaceManager({ workspaceId }: SettingsWorkspaceManagerProps) {
  const { language } = useI18n();
  const tr = useCallback(
    (english: string, arabic: string) => (language === "ar" ? arabic : english),
    [language],
  );

  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stages, setStages] = useState<StageItem[]>([]);
  const [stageDrafts, setStageDrafts] = useState<Record<string, string>>({});
  const [newStageName, setNewStageName] = useState("");

  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLE_OPTIONS)[number]>("MEMBER");

  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);

  const locale = getDateLocale(language);

  const activeWorkspace = useMemo(() => {
    if (!workspaces.length) return null;
    if (workspaceId) {
      const byId = workspaces.find((item) => item.id === workspaceId);
      if (byId) return byId;
    }
    return workspaces[0] ?? null;
  }, [workspaceId, workspaces]);

  const filteredInvites = useMemo(() => {
    if (!activeWorkspace?.id) return invites;
    const scoped = invites.filter(
      (invite) => !invite.workspaceId || invite.workspaceId === activeWorkspace.id,
    );
    return scoped;
  }, [activeWorkspace?.id, invites]);

  const filteredMembers = useMemo(() => {
    if (!activeWorkspace?.id) return memberships;
    const scoped = memberships.filter(
      (member) => !member.workspaceId || member.workspaceId === activeWorkspace.id,
    );
    return scoped;
  }, [activeWorkspace?.id, memberships]);

  const toSignIn = useCallback(() => {
    const next = encodeURIComponent("/settings");
    window.location.assign(`/auth/sign-in?next=${next}`);
  }, []);

  const ensureResponse = useCallback(
    async (response: Response, fallbackMessage: string): Promise<void> => {
      if (response.status === 401 || response.status === 403) {
        toSignIn();
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error(await getResponseError(response, fallbackMessage));
      }
    },
    [toSignIn],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [stagesResponse, invitesResponse, membershipsResponse, workspacesResponse] =
        await Promise.all([
          fetch("/api/stages", { cache: "no-store" }),
          fetch("/api/invites", { cache: "no-store" }),
          fetch("/api/memberships", { cache: "no-store" }),
          fetch("/api/workspaces", { cache: "no-store" }),
        ]);

      await Promise.all([
        ensureResponse(stagesResponse, tr("Could not load stages.", "تعذر تحميل المراحل.")),
        ensureResponse(invitesResponse, tr("Could not load invites.", "تعذر تحميل الدعوات.")),
        ensureResponse(membershipsResponse, tr("Could not load members.", "تعذر تحميل الأعضاء.")),
        ensureResponse(
          workspacesResponse,
          tr("Could not load workspaces.", "تعذر تحميل مساحات العمل."),
        ),
      ]);

      const [stagesPayload, invitesPayload, membershipsPayload, workspacesPayload] =
        await Promise.all([
          stagesResponse.json().catch(() => null),
          invitesResponse.json().catch(() => null),
          membershipsResponse.json().catch(() => null),
          workspacesResponse.json().catch(() => null),
        ]);

      const nextStages = toStageItems(stagesPayload);
      setStages(nextStages);
      setStageDrafts(Object.fromEntries(nextStages.map((stage) => [stage.id, stage.name])));
      setInvites(toInviteItems(invitesPayload));
      setMemberships(toMembershipItems(membershipsPayload));
      setWorkspaces(toWorkspaceItems(workspacesPayload));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : tr("Unable to load settings.", "تعذر تحميل الإعدادات.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ensureResponse, tr]);

  useEffect(() => {
    loadSettings().catch(() => {
      // handled inside loadSettings
    });
  }, [loadSettings]);

  async function persistOrder(nextStages: StageItem[]) {
    await Promise.all(
      nextStages.map(async (stage, index) => {
        const response = await fetch(`/api/stages/${stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: stage.name, order: index + 1 }),
        });
        await ensureResponse(
          response,
          tr("Could not reorder stages.", "تعذر إعادة ترتيب المراحل."),
        );
      }),
    );
  }

  async function addStage() {
    const name = newStageName.trim();
    if (!name) return;

    setBusyKey("add-stage");
    try {
      const response = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order: stages.length + 1 }),
      });

      await ensureResponse(response, tr("Could not create stage.", "تعذر إنشاء المرحلة."));
      setNewStageName("");
      await loadSettings();
      await showSuccessAlert(
        tr("Stage added", "تمت إضافة المرحلة"),
        tr("Pipeline stage was created.", "تم إنشاء مرحلة في خط المبيعات."),
      );
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : tr("Could not create stage.", "تعذر إنشاء المرحلة.");
      await showErrorAlert(tr("Save failed", "فشل الحفظ"), message);
    } finally {
      setBusyKey(null);
    }
  }

  async function saveStage(stage: StageItem) {
    const nextName = (stageDrafts[stage.id] ?? stage.name).trim();
    if (!nextName) return;

    setBusyKey(`save-stage-${stage.id}`);
    try {
      const response = await fetch(`/api/stages/${stage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      await ensureResponse(response, tr("Could not update stage.", "تعذر تحديث المرحلة."));
      await loadSettings();
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : tr("Could not update stage.", "تعذر تحديث المرحلة.");
      await showErrorAlert(tr("Save failed", "فشل الحفظ"), message);
    } finally {
      setBusyKey(null);
    }
  }

  async function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;

    const reordered = swap(stages, index, target);

    setBusyKey(`move-stage-${stages[index]?.id ?? index}`);
    try {
      await persistOrder(reordered);
      await loadSettings();
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : tr("Could not reorder stages.", "تعذر إعادة ترتيب المراحل.");
      await showErrorAlert(tr("Reorder failed", "فشل إعادة الترتيب"), message);
    } finally {
      setBusyKey(null);
    }
  }

  async function removeStage(stage: StageItem) {
    if (stages.length <= 1) {
      await showErrorAlert(
        tr("Cannot remove stage", "لا يمكن حذف المرحلة"),
        tr(
          "At least one stage must remain in the pipeline.",
          "يجب أن تبقى مرحلة واحدة على الأقل في خط المبيعات.",
        ),
      );
      return;
    }

    const confirmed = await confirmAlert(
      tr("Delete stage?", "حذف المرحلة؟"),
      tr(
        "Deals in this stage may become hard to track. Continue?",
        "قد تصبح الصفقات في هذه المرحلة صعبة التتبع. هل تريد المتابعة؟",
      ),
      tr("Delete", "حذف"),
    );
    if (!confirmed) return;

    setBusyKey(`delete-stage-${stage.id}`);
    try {
      const response = await fetch(`/api/stages/${stage.id}`, { method: "DELETE" });
      await ensureResponse(response, tr("Could not delete stage.", "تعذر حذف المرحلة."));

      const remaining = stages.filter((item) => item.id !== stage.id);
      if (remaining.length > 0) {
        await persistOrder(remaining);
      }

      await loadSettings();
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : tr("Could not delete stage.", "تعذر حذف المرحلة.");
      await showErrorAlert(tr("Delete failed", "فشل الحذف"), message);
    } finally {
      setBusyKey(null);
    }
  }

  async function createInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (!isEmail(email)) {
      await showErrorAlert(
        tr("Invalid email", "بريد إلكتروني غير صالح"),
        tr("Please enter a valid email address.", "يرجى إدخال بريد إلكتروني صالح."),
      );
      return;
    }

    setBusyKey("create-invite");
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });

      await ensureResponse(response, tr("Could not send invite.", "تعذر إرسال الدعوة."));
      setInviteEmail("");
      await loadSettings();
      await showSuccessAlert(
        tr("Invite sent", "تم إرسال الدعوة"),
        tr("Team invitation created successfully.", "تم إنشاء دعوة الفريق بنجاح."),
      );
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : tr("Could not send invite.", "تعذر إرسال الدعوة.");
      await showErrorAlert(tr("Invite failed", "فشل إرسال الدعوة"), message);
    } finally {
      setBusyKey(null);
    }
  }

  async function revokeInvite(invite: InviteItem) {
    const confirmed = await confirmAlert(
      tr("Revoke invite?", "إلغاء الدعوة؟"),
      tr("The invite link will stop working immediately.", "سيتوقف رابط الدعوة عن العمل فورًا."),
      tr("Revoke", "إلغاء"),
    );
    if (!confirmed) return;

    setBusyKey(`revoke-invite-${invite.id}`);
    try {
      const response = await fetch(`/api/invites/${invite.id}`, { method: "DELETE" });
      await ensureResponse(response, tr("Could not revoke invite.", "تعذر إلغاء الدعوة."));
      await loadSettings();
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : tr("Could not revoke invite.", "تعذر إلغاء الدعوة.");
      await showErrorAlert(tr("Action failed", "فشل الإجراء"), message);
    } finally {
      setBusyKey(null);
    }
  }

  function formatDate(value?: string | null): string {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(locale);
  }

  if (loading) {
    return (
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel h-64 p-4 skeleton-shimmer" />
        <div className="panel h-64 p-4 skeleton-shimmer" />
        <div className="panel h-48 p-4 xl:col-span-2 skeleton-shimmer" />
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="panel-soft flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <div>
          <p className="muted-label">{tr("Active workspace", "مساحة العمل النشطة")}</p>
          <p className="mt-1 font-medium text-fg">
            {activeWorkspace?.name ?? tr("Unknown workspace", "مساحة عمل غير معروفة")}
          </p>
          <p className="text-xs text-mutedfg">
            {activeWorkspace?.slug ? `${activeWorkspace.slug}` : (activeWorkspace?.id ?? "-")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-mutedfg">
          <span>
            {tr("Stages", "المراحل")}: {stages.length}
          </span>
          <span>
            {tr("Members", "الأعضاء")}: {filteredMembers.length}
          </span>
          <span>
            {tr("Pending invites", "الدعوات المعلقة")}: {filteredInvites.length}
          </span>
          <button
            type="button"
            className="btn h-8"
            onClick={() => {
              loadSettings().catch(() => {
                // handled inside loadSettings
              });
            }}
            disabled={busyKey !== null}
          >
            <RefreshCw size={14} />
            {tr("Refresh", "تحديث")}
          </button>
        </div>
      </section>

      {error ? (
        <div className="panel border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="panel p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">{tr("Pipeline stages", "مراحل خط المبيعات")}</h2>
            <p className="mt-1 text-sm text-mutedfg">
              {tr(
                "Rename, reorder, and add stages used by your Trello-style pipeline.",
                "أعد تسمية المراحل وترتيبها وإضافتها في خط المبيعات بأسلوب Trello.",
              )}
            </p>
          </div>

          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="rounded-lg border border-border bg-surface2 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="input h-9 min-w-[180px] flex-1"
                    value={stageDrafts[stage.id] ?? stage.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setStageDrafts((current) => ({ ...current, [stage.id]: value }));
                    }}
                    placeholder={tr("Stage name", "اسم المرحلة")}
                  />
                  <button
                    type="button"
                    className="btn h-9"
                    onClick={() => {
                      saveStage(stage).catch(() => {
                        // handled inside saveStage
                      });
                    }}
                    disabled={busyKey !== null}
                  >
                    {busyKey === `save-stage-${stage.id}` ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : null}
                    {tr("Save", "حفظ")}
                  </button>
                  <button
                    type="button"
                    className="btn h-9 w-9 px-0"
                    aria-label={tr("Move up", "حرك لأعلى")}
                    onClick={() => {
                      moveStage(index, -1).catch(() => {
                        // handled inside moveStage
                      });
                    }}
                    disabled={index === 0 || busyKey !== null}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn h-9 w-9 px-0"
                    aria-label={tr("Move down", "حرك لأسفل")}
                    onClick={() => {
                      moveStage(index, 1).catch(() => {
                        // handled inside moveStage
                      });
                    }}
                    disabled={index === stages.length - 1 || busyKey !== null}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn h-9 w-9 px-0 text-red-600 hover:text-red-600"
                    aria-label={tr("Delete stage", "حذف المرحلة")}
                    onClick={() => {
                      removeStage(stage).catch(() => {
                        // handled inside removeStage
                      });
                    }}
                    disabled={busyKey !== null}
                  >
                    {busyKey === `delete-stage-${stage.id}` ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              className="input h-9 min-w-[180px] flex-1"
              value={newStageName}
              onChange={(event) => setNewStageName(event.target.value)}
              placeholder={tr("New stage name", "اسم مرحلة جديدة")}
            />
            <button
              type="button"
              className="btn btn-primary h-9"
              onClick={() => {
                addStage().catch(() => {
                  // handled inside addStage
                });
              }}
              disabled={busyKey !== null || newStageName.trim().length === 0}
            >
              {busyKey === "add-stage" ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {tr("Add", "إضافة")}
            </button>
          </div>
        </article>

        <article className="panel p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">{tr("Team invites", "دعوات الفريق")}</h2>
            <p className="mt-1 text-sm text-mutedfg">
              {tr(
                "Invite teammates and control their default role.",
                "قم بدعوة أعضاء الفريق وحدد الدور الافتراضي لهم.",
              )}
            </p>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              className="input h-9 min-w-[180px] flex-1"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder={tr("Email address", "البريد الإلكتروني")}
            />
            <select
              className="input h-9 min-w-[130px]"
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as (typeof ROLE_OPTIONS)[number])
              }
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary h-9"
              onClick={() => {
                createInvite().catch(() => {
                  // handled inside createInvite
                });
              }}
              disabled={busyKey !== null || inviteEmail.trim().length === 0}
            >
              {busyKey === "create-invite" ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {tr("Send", "إرسال")}
            </button>
          </div>

          {filteredInvites.length === 0 ? (
            <p className="panel-dashed p-4 text-sm text-mutedfg">
              {tr("No pending invites.", "لا توجد دعوات معلقة.")}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface2 p-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invite.email}</p>
                    <p className="text-xs text-mutedfg">
                      {invite.role} · {tr("Expires", "تنتهي")}: {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn h-8"
                    onClick={() => {
                      revokeInvite(invite).catch(() => {
                        // handled inside revokeInvite
                      });
                    }}
                    disabled={busyKey !== null}
                  >
                    {busyKey === `revoke-invite-${invite.id}` ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {tr("Revoke", "إلغاء")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <article className="panel p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">{tr("Members", "الأعضاء")}</h2>
          <p className="mt-1 text-sm text-mutedfg">
            {tr(
              "Current users with workspace access.",
              "المستخدمون الحاليون الذين لديهم وصول لمساحة العمل.",
            )}
          </p>
        </div>

        {filteredMembers.length === 0 ? (
          <p className="panel-dashed p-4 text-sm text-mutedfg">
            {tr("No members found.", "لا يوجد أعضاء.")}
          </p>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="border-b border-border bg-surface2 text-xs uppercase tracking-[0.1em] text-mutedfg">
                <tr>
                  <th className="px-4 py-3">{tr("User", "المستخدم")}</th>
                  <th className="px-4 py-3">{tr("Email", "البريد الإلكتروني")}</th>
                  <th className="px-4 py-3">{tr("Role", "الدور")}</th>
                  <th className="px-4 py-3">{tr("Created", "تاريخ الإنشاء")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium">{member.user?.name ?? member.userId}</td>
                    <td className="px-4 py-3 text-mutedfg">{member.user?.email ?? "-"}</td>
                    <td className="px-4 py-3">{member.role}</td>
                    <td className="px-4 py-3 text-mutedfg">{formatDate(member.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
