import { redirect } from "next/navigation";
import { SettingsWorkspaceManager } from "@/components/SettingsWorkspaceManager";
import { PageHeader, SectionPanel } from "@/components/ui/workspace";
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
      <PageHeader
        eyebrow={tr("Workspace administration", "إدارة مساحة العمل")}
        title={tr("Settings", "الإعدادات")}
        description={tr(
          "This page is the control surface for stages, invites, and membership access. The redesign keeps configuration work calm and predictable.",
          "هذه الصفحة هي سطح التحكم للمراحل والدعوات وصلاحيات العضوية. يحافظ التصميم الجديد على هدوء عمل الإعدادات وقابليته للتوقع.",
        )}
      />

      <SectionPanel
        title={tr("Workspace controls", "عناصر تحكم مساحة العمل")}
        description={tr(
          "Manage stage order, invite teammates, and review access without leaving the workspace.",
          "أدِر ترتيب المراحل وادعُ أعضاء الفريق وراجع الوصول دون مغادرة مساحة العمل.",
        )}
      >
        <SettingsWorkspaceManager workspaceId={session.workspaceId ?? null} />
      </SectionPanel>
    </main>
  );
}
