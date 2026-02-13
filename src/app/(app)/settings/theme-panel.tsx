"use client";

import { useUIStore } from "@/store/ui-store";

export function ThemePanel() {
  const { dark, toggleTheme } = useUIStore();
  return (
    <section className="rounded-xl border p-4">
      <h2 className="font-medium">Theme</h2>
      <button className="btn mt-2" onClick={toggleTheme}>Current: {dark ? "Dark" : "Light"}</button>
    </section>
  );
}
