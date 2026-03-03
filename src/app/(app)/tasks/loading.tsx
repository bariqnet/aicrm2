import { PageLoadingShell } from "@/components/PageLoadingShell";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function TasksLoading() {
  const language = await getServerLanguage();
  const title = pickByLanguage(language, "Loading tasks...", "جارٍ تحميل المهام...");

  return <PageLoadingShell title={title} />;
}
