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
    <div className="flex min-h-screen bg-bg text-fg">
      <SidebarNav />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="flex-1 px-4 pb-10 pt-6 md:px-8">{children}</div>
      </div>
      <CommandPalette />
      <DetailDrawer />
    </div>
  );
}
