import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionData } from "@/lib/auth";
import { serverApiRequest, SessionInvalidError } from "@/lib/server-crm";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

type AuthMeResponse = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

export default async function ProfilePage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const session = await getSessionData();

  if (!session.token || !session.user) {
    redirect("/auth/sign-in?next=/profile");
  }

  let me: AuthMeResponse | null = null;
  try {
    me = await serverApiRequest<AuthMeResponse>("/auth/me");
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect("/auth/sign-in?next=/profile");
    }
    me = null;
  }

  const displayName = me?.user?.name ?? session.user.name;
  const displayEmail = me?.user?.email ?? session.user.email;
  const displayId = me?.user?.id ?? session.user.id;

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Profile", "الملف الشخصي")}</h1>
        <p className="page-subtitle">{tr("Workspace identity and access context.", "هوية مساحة العمل وسياق الوصول.")}</p>
      </header>

      <section className="panel max-w-2xl p-5">
        <div className="grid gap-4 text-sm">
          <div>
            <p className="muted-label">{tr("Name", "الاسم")}</p>
            <p className="mt-1 font-medium">{displayName}</p>
          </div>
          <div>
            <p className="muted-label">{tr("Email", "البريد الإلكتروني")}</p>
            <p className="mt-1 font-medium">{displayEmail}</p>
          </div>
          <div>
            <p className="muted-label">{tr("User ID", "معرّف المستخدم")}</p>
            <p className="mt-1 font-mono text-xs">{displayId}</p>
          </div>
          <div>
            <p className="muted-label">{tr("Workspace ID", "معرّف مساحة العمل")}</p>
            <p className="mt-1 font-mono text-xs">{session.workspaceId ?? "ws_default"}</p>
          </div>
        </div>
      </section>

      <div>
        <SignOutButton className="btn" label={tr("Sign out", "تسجيل الخروج")} />
      </div>
    </main>
  );
}
