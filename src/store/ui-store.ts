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

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      commandOpen: false,
      drawer: null,
      dark: false,
      mobileNavOpen: false,
      sidebarCollapsed: false,
      language: "en",
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      openDrawer: (drawer) => set({ drawer }),
      toggleTheme: () => set((state) => ({ dark: !state.dark })),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
    }),
    {
      name: "que-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedUIState => ({
        dark: state.dark,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language
      })
    }
  )
);
