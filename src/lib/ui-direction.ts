import type { AppLanguage } from "@/lib/i18n";

export function isRtlLanguage(language: AppLanguage): boolean {
  return language === "ar";
}

export function getDirectionalArrowSymbol(
  language: AppLanguage,
  direction: "back" | "forward",
): "←" | "→" {
  if (direction === "back") {
    return isRtlLanguage(language) ? "→" : "←";
  }

  return isRtlLanguage(language) ? "←" : "→";
}
