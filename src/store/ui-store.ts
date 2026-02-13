"use client";

import { create } from "zustand";
import { EntityType } from "@/lib/types";

type DrawerEntity = { type: EntityType; id: string } | null;

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
