export default function OnboardingPage() {
  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">Onboarding</h1>
        <p className="page-subtitle">Create your workspace, configure stages, and invite teammates.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">1. Workspace</h2>
          <p className="mt-1 text-sm text-mutedfg">Set workspace name and slug.</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">2. Pipeline stages</h2>
          <p className="mt-1 text-sm text-mutedfg">Create the default stage flow for your team.</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">3. Invite team</h2>
          <p className="mt-1 text-sm text-mutedfg">Invite owners, admins, and members.</p>
        </article>
      </section>
    </main>
  );
}
