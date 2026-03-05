import { redirect } from "next/navigation";
import type { Membership, Workspace } from "@/lib/crm-types";
import { getSessionData } from "@/lib/auth";
import { serverApiRequest, SessionInvalidError, type ServerListResponse } from "@/lib/server-crm";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

type AuthMeResponse = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

export default async function ProfilePage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const session = await getSessionData();

  if (!session.token || !session.user) {
    redirect("/auth/sign-in?next=/profile");
  }

  const [meResult, membershipsResult, workspacesResult] = await Promise.allSettled([
    serverApiRequest<AuthMeResponse>("/auth/me"),
    serverApiRequest<ServerListResponse<Membership>>("/memberships"),
    serverApiRequest<ServerListResponse<Workspace>>("/workspaces")
  ]);

  for (const result of [meResult, membershipsResult, workspacesResult]) {
    if (result.status === "rejected" && result.reason instanceof SessionInvalidError) {
      redirect("/auth/sign-in?expired=1&next=/profile");
    }
  }

  const me = meResult.status === "fulfilled" ? meResult.value : null;
  const memberships =
    membershipsResult.status === "fulfilled" ? membershipsResult.value.rows ?? [] : [];
  const workspaces =
    workspacesResult.status === "fulfilled" ? workspacesResult.value.rows ?? [] : [];

  const hadPartialFailure =
    meResult.status === "rejected" ||
    membershipsResult.status === "rejected" ||
    workspacesResult.status === "rejected";

  const displayName = me?.user?.name ?? session.user.name;
  const displayEmail = me?.user?.email ?? session.user.email;
  const displayId = me?.user?.id ?? session.user.id;
  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === session.workspaceId) ?? workspaces[0] ?? null;
  const currentMembership =
    memberships.find(
      (membership) =>
        membership.userId === displayId &&
        membership.workspaceId === (currentWorkspace?.id ?? session.workspaceId)
    ) ?? null;
  const roleLabel = currentMembership?.role ?? tr("Unknown", "غير معروف");
  const workspaceLabel = currentWorkspace?.name ?? tr("Unknown workspace", "مساحة عمل غير معروفة");
  const workspaceIdLabel = currentWorkspace?.id ?? session.workspaceId ?? "-";
  const workspaceSlugLabel = currentWorkspace?.slug ?? "-";

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Profile", "الملف الشخصي")}</h1>
        <p className="page-subtitle">
          {tr(
            "Account identity and workspace access context.",
            "هوية الحساب وسياق الوصول إلى مساحة العمل."
          )}
        </p>
      </header>

      {hadPartialFailure ? (
        <p className="panel border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {tr(
            "Some profile details are temporarily unavailable. Showing session data.",
            "بعض تفاصيل الملف الشخصي غير متاحة مؤقتًا. يتم عرض بيانات الجلسة."
          )}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold">{tr("Account", "الحساب")}</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <div>
              <p className="muted-label">{tr("Name", "الاسم")}</p>
              <p className="mt-1 font-medium">{displayName}</p>
            </div>
            <div>
              <p className="muted-label">{tr("Email", "البريد الإلكتروني")}</p>
              <p className="mt-1 font-medium">{displayEmail}</p>
            </div>
            <div>
              <p className="muted-label">{tr("User ID", "معرّف المستخدم")}</p>
              <p className="mt-1 font-mono text-xs">{displayId}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold">{tr("Workspace", "مساحة العمل")}</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <div>
              <p className="muted-label">{tr("Workspace name", "اسم مساحة العمل")}</p>
              <p className="mt-1 font-medium">{workspaceLabel}</p>
            </div>
            <div>
              <p className="muted-label">{tr("Role", "الدور")}</p>
              <p className="mt-1 font-medium">{roleLabel}</p>
            </div>
            <div>
              <p className="muted-label">{tr("Workspace slug", "رمز مساحة العمل")}</p>
              <p className="mt-1 font-mono text-xs">{workspaceSlugLabel}</p>
            </div>
            <div>
              <p className="muted-label">{tr("Workspace ID", "معرّف مساحة العمل")}</p>
              <p className="mt-1 font-mono text-xs">{workspaceIdLabel}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
