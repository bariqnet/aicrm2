import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionData();
  if (!session.token || !session.user) {
    redirect("/auth/sign-in?next=/onboarding");
  }

  return <div className="min-h-screen">{children}</div>;
}
