"use client";

import { useMemo } from "react";
import { APP_LANGUAGES, getDirection, translate } from "@/lib/i18n";
import { useUIStore } from "@/store/ui-store";

export function useI18n() {
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);

  const t = useMemo(
    () =>
      (key: string, values?: Record<string, string | number>) =>
        translate(language, key, values),
    [language]
  );

  return {
    language,
    setLanguage,
    direction: getDirection(language),
    isRtl: getDirection(language) === "rtl",
    languages: APP_LANGUAGES,
    t
  };
}
