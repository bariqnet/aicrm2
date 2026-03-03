import { cookies } from "next/headers";
import { type AppLanguage } from "@/lib/i18n";

export async function getServerLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  return cookieStore.get("que_lang")?.value === "ar" ? "ar" : "en";
}

export function pickByLanguage(language: AppLanguage, english: string, arabic: string): string {
  return language === "ar" ? arabic : english;
}

export function getDateLocale(language: AppLanguage): string {
  return language === "ar" ? "ar-IQ" : "en-US";
}
