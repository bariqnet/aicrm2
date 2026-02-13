"use client";

import { useEffect } from "react";
import { SidebarNav } from "@/components/SidebarNav";
import { Topbar } from "@/components/Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { DetailDrawer } from "@/components/DetailDrawer";
import { useUIStore } from "@/store/ui-store";

export function AppShell({ children }: React.PropsWithChildren) {
  const { dark } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette />
      <DetailDrawer />
    </div>
  );
}
