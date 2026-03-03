import { PageLoadingShell } from "@/components/PageLoadingShell";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function CompaniesLoading() {
  const language = await getServerLanguage();
  const title = pickByLanguage(language, "Loading companies...", "جارٍ تحميل الشركات...");

  return <PageLoadingShell title={title} />;
}
