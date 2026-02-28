"use client";

import { create } from "zustand";
import type { Task } from "@/lib/crm-types";

type DrawerEntity = { type: Task["relatedType"]; id: string } | null;

type UIState = {
  commandOpen: boolean;
  drawer: DrawerEntity;
  dark: boolean;
  setCommandOpen: (open: boolean) => void;
  openDrawer: (entity: DrawerEntity) => void;
  toggleTheme: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  drawer: null,
  dark: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  openDrawer: (drawer) => set({ drawer }),
  toggleTheme: () => set((s) => ({ dark: !s.dark }))
}));
