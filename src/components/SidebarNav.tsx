"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Cog, Home, Inbox, KanbanSquare, Users, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/people", label: "People", icon: Users },
  { href: "/app/companies", label: "Companies", icon: Building2 },
  { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/app/settings", label: "Settings", icon: Cog }
];

export function SidebarNav() {
  const path = usePathname();
  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-bg/90 px-3 py-4 md:flex">
      <div className="mb-6 px-2 text-lg font-semibold">Lightfield CRM</div>
      <button className="btn mb-5 w-full justify-between text-xs">Workspace <span>Default ▾</span></button>
      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-md px-2 py-2 text-sm", path === item.href ? "bg-muted font-medium" : "hover:bg-muted/60") }>
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border p-3 text-xs text-zinc-500">Logged in as alex@workspace.io</div>
    </aside>
  );
}
