import { redirect } from "next/navigation";
import { SettingsWorkspaceManager } from "@/components/SettingsWorkspaceManager";
import { getSessionData } from "@/lib/auth";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function SettingsPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);
  const session = await getSessionData();

  if (!session.token || !session.user) {
    redirect("/auth/sign-in?next=/settings");
  }

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Settings", "الإعدادات")}</h1>
        <p className="page-subtitle">
          {tr(
            "Manage workspace stages, invites, and team access from one place.",
            "قم بإدارة مراحل مساحة العمل والدعوات وصلاحيات الفريق من مكان واحد."
          )}
        </p>
      </header>

      <SettingsWorkspaceManager workspaceId={session.workspaceId ?? null} />
    </main>
  );
}
