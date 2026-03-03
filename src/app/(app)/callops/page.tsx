import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function CallOpsPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("CallOps", "عمليات الاتصال")}</h1>
        <p className="page-subtitle">
          {tr(
            "Manage call workflows, outcomes, and follow-ups in one operational view.",
            "أدر تدفقات المكالمات والنتائج والمتابعات في عرض تشغيلي واحد."
          )}
        </p>
      </header>

      <section className="panel p-6">
        <p className="text-sm text-mutedfg">
          {tr(
            "CallOps module is ready. Connect your call pipeline components here.",
            "وحدة عمليات الاتصال جاهزة. اربط مكوّنات خط المكالمات هنا."
          )}
        </p>
      </section>
    </main>
  );
}
