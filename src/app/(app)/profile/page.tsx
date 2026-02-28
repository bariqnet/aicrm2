import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionData } from "@/lib/auth";
import { apiRequest } from "@/lib/crm-api";

type AuthMeResponse = {
  id?: string;
  name?: string;
  email?: string;
};

export default async function ProfilePage() {
  const session = await getSessionData();

  if (!session.token || !session.user) {
    redirect("/auth/sign-in?next=/profile");
  }

  let me: AuthMeResponse | null = null;
  try {
    me = await apiRequest<AuthMeResponse>("/auth/me", {
      token: session.token,
      cache: "no-store"
    });
  } catch {
    me = null;
  }

  const displayName = me?.name ?? session.user.name;
  const displayEmail = me?.email ?? session.user.email;
  const displayId = me?.id ?? session.user.id;

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Workspace identity and access context.</p>
      </header>

      <section className="panel max-w-2xl p-5">
        <div className="grid gap-4 text-sm">
          <div>
            <p className="muted-label">Name</p>
            <p className="mt-1 font-medium">{displayName}</p>
          </div>
          <div>
            <p className="muted-label">Email</p>
            <p className="mt-1 font-medium">{displayEmail}</p>
          </div>
          <div>
            <p className="muted-label">User ID</p>
            <p className="mt-1 font-mono text-xs">{displayId}</p>
          </div>
          <div>
            <p className="muted-label">Workspace ID</p>
            <p className="mt-1 font-mono text-xs">{session.workspaceId ?? "ws_default"}</p>
          </div>
        </div>
      </section>

      <div>
        <SignOutButton className="btn" label="Sign out" />
      </div>
    </main>
  );
}
