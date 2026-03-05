import { PageLoadingShell } from "@/components/PageLoadingShell";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function DealsLoading() {
  const language = await getServerLanguage();
  const title = pickByLanguage(language, "Loading pipeline...", "جارٍ تحميل خط المبيعات...");

  return <PageLoadingShell title={title} />;
}
