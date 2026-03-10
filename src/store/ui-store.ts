"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppLanguage } from "@/lib/i18n";
import type { Task } from "@/lib/crm-types";

type DrawerEntity = { type: Task["relatedType"]; id: string } | null;

type UIState = {
  commandOpen: boolean;
  drawer: DrawerEntity;
  dark: boolean;
  mobileNavOpen: boolean;
  sidebarCollapsed: boolean;
  language: AppLanguage;
  setCommandOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  openDrawer: (entity: DrawerEntity) => void;
  toggleTheme: () => void;
  setLanguage: (language: AppLanguage) => void;
  toggleSidebar: () => void;
};

type PersistedUIState = Pick<UIState, "dark" | "sidebarCollapsed" | "language">;

function getInitialLanguage(): AppLanguage {
  if (typeof document === "undefined") return "en";

  const cookieMatch = document.cookie.match(/(?:^|;\s*)que_lang=(ar|en)(?:;|$)/);
  if (cookieMatch?.[1] === "ar") return "ar";

  return document.documentElement.lang === "ar" ? "ar" : "en";
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      commandOpen: false,
      drawer: null,
      dark: true,
      mobileNavOpen: false,
      sidebarCollapsed: false,
      language: getInitialLanguage(),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      openDrawer: (drawer) => set({ drawer }),
      toggleTheme: () => set((state) => ({ dark: !state.dark })),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "que-ui",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<PersistedUIState> | null) ?? {};
        return {
          ...currentState,
          ...persisted,
          language: getInitialLanguage(),
        };
      },
      partialize: (state): PersistedUIState => ({
        dark: state.dark,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
      }),
    },
  ),
);
