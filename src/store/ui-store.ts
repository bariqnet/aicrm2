"use client";

import { create } from "zustand";
import type { Task } from "@/lib/crm-types";

type DrawerEntity = { type: Task["relatedType"]; id: string } | null;

type UIState = {
  commandOpen: boolean;
  drawer: DrawerEntity;
  dark: boolean;
  mobileNavOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  openDrawer: (entity: DrawerEntity) => void;
  toggleTheme: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  drawer: null,
  dark: false,
  mobileNavOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  openDrawer: (drawer) => set({ drawer }),
  toggleTheme: () => set((s) => ({ dark: !s.dark }))
}));
