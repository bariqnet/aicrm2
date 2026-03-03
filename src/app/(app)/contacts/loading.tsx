import { PageLoadingShell } from "@/components/PageLoadingShell";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function ContactsLoading() {
  const language = await getServerLanguage();
  const title = pickByLanguage(language, "Loading contacts...", "جارٍ تحميل جهات الاتصال...");

  return <PageLoadingShell title={title} />;
}
