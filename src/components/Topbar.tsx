"use client";

import Link from "next/link";
import { Bell, Moon, Plus, Search, Sun } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { useUIStore } from "@/store/ui-store";

export function Topbar() {
  const { setCommandOpen, dark, toggleTheme } = useUIStore();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
        <button
          onClick={() => setCommandOpen(true)}
          className="input flex h-9 w-full max-w-lg items-center justify-between text-mutedfg"
          aria-label="Open command palette"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Search size={14} />
            <span className="truncate">Search contacts, companies, deals</span>
          </span>
          <span className="hidden rounded border border-border bg-surface2 px-1.5 py-0.5 text-[11px] text-mutedfg sm:inline-flex">
            Cmd K
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/contacts/new" className="btn btn-primary hidden md:inline-flex">
            <Plus size={14} />
            New contact
          </Link>
          <Link href="/deals/new" className="btn hidden lg:inline-flex">New deal</Link>
          <button className="btn w-9 px-0" aria-label="Notifications">
            <Bell size={14} />
          </button>
          <button className="btn w-9 px-0" onClick={toggleTheme} aria-label="Theme toggle">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="hidden md:block">
            <SignOutButton className="btn" />
          </div>
        </div>
      </div>
    </header>
  );
}
