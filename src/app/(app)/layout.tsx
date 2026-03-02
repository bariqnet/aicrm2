import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionData } from "@/lib/auth";
import { serverApiRequest, SessionInvalidError } from "@/lib/server-crm";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSessionData();
  if (!session.token || !session.user) {
    redirect("/auth/sign-in");
  }

  try {
    await serverApiRequest<{ user?: { id?: string } }>("/auth/me");
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect("/auth/sign-in");
    }
    throw error;
  }

  return <AppShell>{children}</AppShell>;
}
