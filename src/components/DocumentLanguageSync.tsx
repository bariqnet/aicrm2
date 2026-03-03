"use client";

import { useEffect } from "react";
import { getDirection } from "@/lib/i18n";
import { useUIStore } from "@/store/ui-store";

export function DocumentLanguageSync() {
  const language = useUIStore((state) => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
    document.cookie = `que_lang=${language}; path=/; max-age=31536000; samesite=lax`;
  }, [language]);

  return null;
}
