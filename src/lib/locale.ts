import type { AppLanguage } from "@/lib/i18n";

export function getDateLocale(language: AppLanguage): string {
  return language === "ar" ? "ar-IQ-u-nu-latn" : "en-US";
}
