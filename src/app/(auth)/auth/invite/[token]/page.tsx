import Link from "next/link";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const { token } = await params;

  return (
    <main className="panel w-full p-6">
      <h1 className="page-title">{tr("Accept invite", "قبول الدعوة")}</h1>
      <p className="mt-1 text-sm text-mutedfg">
        {tr("You were invited to join a workspace.", "تمت دعوتك للانضمام إلى مساحة عمل.")}
      </p>
      <p className="mt-3 rounded-md border border-border bg-surface2 p-2 text-xs text-mutedfg">
        {tr("Token", "الرمز")}: <code>{token}</code>
      </p>
      <Link
        className="btn btn-primary mt-6 w-full justify-center"
        href={`/auth/sign-up?inviteToken=${encodeURIComponent(token)}`}
      >
        {tr("Accept invite and create account", "قبول الدعوة وإنشاء حساب")}
      </Link>
      <p className="mt-4 text-sm text-mutedfg">
        {tr("Already have an account?", "لديك حساب بالفعل؟")}{" "}
        <Link className="text-accent hover:underline" href="/auth/sign-in">
          {tr("Sign in", "تسجيل الدخول")}
        </Link>
      </p>
    </main>
  );
}
