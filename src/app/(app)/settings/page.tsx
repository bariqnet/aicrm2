import { ThemePanel } from "./theme-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border p-4"><h2 className="font-medium">Profile</h2><p className="text-sm text-zinc-500">Alex Morgan, Account Executive</p></section>
        <section className="rounded-xl border p-4"><h2 className="font-medium">Workspace</h2><p className="text-sm text-zinc-500">Default workspace · 12 members</p></section>
        <section className="rounded-xl border p-4"><h2 className="font-medium">Integrations</h2><p className="text-sm text-zinc-500">Slack, Google Calendar (mock)</p></section>
      </div>
      <ThemePanel />
    </div>
  );
}
