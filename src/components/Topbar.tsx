"use client";

import { Bell, Moon, Plus, Search, Sun } from "lucide-react";
import { useUIStore } from "@/store/ui-store";

export function Topbar() {
  const { setCommandOpen, dark, toggleTheme } = useUIStore();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-bg/95 px-4 py-3 backdrop-blur">
      <button onClick={() => setCommandOpen(true)} className="input flex w-full max-w-md items-center justify-between text-zinc-500" aria-label="Open command palette">
        <span className="inline-flex items-center gap-2"><Search size={14} /> Search people, companies, deals</span>
        <span className="rounded border px-1.5 py-0.5 text-xs">⌘K</span>
      </button>
      <div className="ml-4 flex items-center gap-2">
        <button className="btn"><Plus size={14} /> New</button>
        <button className="btn" aria-label="Notifications"><Bell size={14} /></button>
        <button className="btn" onClick={toggleTheme} aria-label="Theme toggle">{dark ? <Sun size={14} /> : <Moon size={14} />}</button>
      </div>
    </header>
  );
}
