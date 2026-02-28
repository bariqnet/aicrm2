import Link from "next/link";

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="panel w-full p-6">
      <h1 className="page-title">Accept invite</h1>
      <p className="mt-1 text-sm text-mutedfg">
        You were invited to join a workspace.
      </p>
      <p className="mt-3 rounded-md border border-border bg-surface2 p-2 text-xs text-mutedfg">
        Token: <code>{token}</code>
      </p>
      <Link
        className="btn btn-primary mt-6 w-full justify-center"
        href={`/auth/sign-up?inviteToken=${encodeURIComponent(token)}`}
      >
        Accept invite and create account
      </Link>
      <p className="mt-4 text-sm text-mutedfg">
        Already have an account?{" "}
        <Link className="text-accent hover:underline" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </main>
  );
}
