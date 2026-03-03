import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function SettingsPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Settings", "الإعدادات")}</h1>
        <p className="page-subtitle">{tr("Configure workspace behavior, templates, and governance.", "تهيئة سلوك مساحة العمل والقوالب والحوكمة.")}</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Members", "الأعضاء")}</h2>
          <p className="mt-2 text-sm text-mutedfg">{tr("Manage workspace members, roles, and invitations.", "إدارة أعضاء مساحة العمل والأدوار والدعوات.")}</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("CRM type", "نوع CRM")}</h2>
          <p className="mt-2 text-sm text-mutedfg">{tr("Select and configure your CRM template for this workspace.", "اختر وخصص قالب CRM لمساحة العمل هذه.")}</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Stages", "المراحل")}</h2>
          <p className="mt-2 text-sm text-mutedfg">{tr("Create, rename, and reorder deal stages.", "إنشاء مراحل الصفقات وإعادة تسميتها وترتيبها.")}</p>
        </article>
      </section>
    </main>
  );
}
