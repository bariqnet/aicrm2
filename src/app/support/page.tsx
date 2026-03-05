import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export const metadata: Metadata = {
  title: "Support"
};

export default async function SupportPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);
  const isArabic = language === "ar";

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-10 text-[#0f1218] sm:px-8 lg:py-14">
      <article className="mx-auto w-full max-w-4xl rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(15,18,24,0.06)] sm:p-8">
        <div className="mb-7">
          <Link href={("/" as Route)} className="text-sm font-medium text-black/62 transition hover:text-black">
            {tr("← Back to home", "← العودة إلى الصفحة الرئيسية")}
          </Link>
          <h1 className={isArabic ? "mt-3 text-3xl font-semibold" : "mt-3 text-3xl font-semibold tracking-tight"}>
            {tr("Support", "الدعم")}
          </h1>
          <p className="mt-2 text-sm text-black/58">
            {tr("Need help with setup, billing, or workspace issues?", "هل تحتاج إلى مساعدة في الإعداد أو الفوترة أو مشاكل مساحة العمل؟")}
          </p>
        </div>

        <div className={isArabic ? "space-y-6 text-[0.98rem] leading-8 text-black/78" : "space-y-6 text-[0.95rem] leading-7 text-black/75"}>
          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-5">
            <h2 className="text-lg font-semibold text-black">{tr("Contact", "تواصل معنا")}</h2>
            <p className="mt-2">{tr("Email us at", "راسلنا على البريد")}: <a href="mailto:support@quecrm.com" className="font-semibold text-black underline decoration-black/25 underline-offset-4">support@quecrm.com</a></p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-5">
            <h2 className="text-lg font-semibold text-black">{tr("Typical Response Time", "مدة الاستجابة المتوقعة")}</h2>
            <p className="mt-2">{tr("Monday to Friday, replies are usually sent within one business day.", "من الاثنين إلى الجمعة، نرد عادةً خلال يوم عمل واحد.")}</p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-5">
            <h2 className="text-lg font-semibold text-black">{tr("What to Include", "ما الذي يجب تضمينه")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{tr("Workspace name and user email", "اسم مساحة العمل وبريد المستخدم")}</li>
              <li>{tr("Short description of the issue", "وصف مختصر للمشكلة")}</li>
              <li>{tr("Screenshots or error messages", "لقطات شاشة أو رسائل الخطأ")}</li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
