export default function SettingsPage() {
  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure workspace behavior, templates, and governance.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Members</h2>
          <p className="mt-2 text-sm text-mutedfg">Manage workspace members, roles, and invitations.</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">CRM type</h2>
          <p className="mt-2 text-sm text-mutedfg">Select and configure your CRM template for this workspace.</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Stages</h2>
          <p className="mt-2 text-sm text-mutedfg">Create, rename, and reorder deal stages.</p>
        </article>
      </section>
    </main>
  );
}
