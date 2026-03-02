import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionData();
  if (!session.token || !session.user) {
    redirect("/auth/sign-in?next=/onboarding");
  }

  return <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">{children}</div>;
}
