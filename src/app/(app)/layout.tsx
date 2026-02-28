import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionData } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSessionData();
  if (!session.token || !session.user) {
    redirect("/auth/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
