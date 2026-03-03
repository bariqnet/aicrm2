import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function ReportsPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Reports", "التقارير")}</h1>
        <p className="page-subtitle">{tr("Decision-ready snapshots for pipeline and revenue.", "لقطات جاهزة لاتخاذ القرار حول خط المبيعات والإيرادات.")}</p>
      </header>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Pipeline report", "تقرير خط المبيعات")}</h2>
          <p className="mt-2 text-sm text-mutedfg">{tr("Stage conversion and weighted pipeline reporting placeholder.", "عنصر نائب لتقرير تحويل المراحل وخط المبيعات الموزون.")}</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Accounting report", "التقرير المحاسبي")}</h2>
          <p className="mt-2 text-sm text-mutedfg">{tr("Invoice aging and payment velocity reporting placeholder.", "عنصر نائب لتقرير أعمار الفواتير وسرعة التحصيل.")}</p>
        </article>
      </section>
    </main>
  );
}
