import { PageLoadingShell } from "@/components/PageLoadingShell";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function DealsLoading() {
  const language = await getServerLanguage();
  const title = pickByLanguage(language, "Loading deals...", "جارٍ تحميل الصفقات...");

  return <PageLoadingShell title={title} />;
}
