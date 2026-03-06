import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default async function TermsPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);
  const isArabic = language === "ar";

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-10 text-[#0f1218] sm:px-8 lg:py-14">
      <article className="mx-auto w-full max-w-4xl rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(15,18,24,0.06)] sm:p-8">
        <div className="mb-7">
          <Link
            href={"/" as Route}
            className="text-sm font-medium text-black/62 transition hover:text-black"
          >
            {`${getDirectionalArrowSymbol(language, "back")} ${tr("Back to home", "العودة إلى الصفحة الرئيسية")}`}
          </Link>
          <h1
            className={
              isArabic
                ? "mt-3 text-3xl font-semibold"
                : "mt-3 text-3xl font-semibold tracking-tight"
            }
          >
            {tr("Terms of Service", "شروط الاستخدام")}
          </h1>
          <p className="mt-2 text-sm text-black/58">
            {tr("Effective date: March 5, 2026", "تاريخ السريان: 5 مارس 2026")}
          </p>
        </div>

        <div
          className={
            isArabic
              ? "space-y-6 text-[0.98rem] leading-8 text-black/78"
              : "space-y-6 text-[0.95rem] leading-7 text-black/75"
          }
        >
          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("Use of Service", "استخدام الخدمة")}
            </h2>
            <p className="mt-2">
              {tr(
                "You may use the platform for lawful business operations. You are responsible for your users and account activity.",
                "يمكنك استخدام المنصة في الأنشطة التجارية المشروعة. وتتحمل مسؤولية المستخدمين التابعين لك ونشاط الحساب.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("Account Security", "أمان الحساب")}
            </h2>
            <p className="mt-2">
              {tr(
                "Keep credentials secure and notify support immediately if you suspect unauthorized access.",
                "حافظ على سرية بيانات الدخول، وأبلغ فريق الدعم فورًا عند الاشتباه بأي وصول غير مصرح به.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("Billing & Changes", "الفوترة والتغييرات")}
            </h2>
            <p className="mt-2">
              {tr(
                "Paid plans, pricing, and feature availability may evolve. Material changes will be communicated in advance.",
                "قد تتغير الخطط المدفوعة والأسعار وتوفّر الميزات بمرور الوقت. وسيتم إشعارك مسبقًا بأي تغييرات جوهرية.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("Termination", "إنهاء الخدمة")}
            </h2>
            <p className="mt-2">
              {tr(
                "Accounts violating these terms may be suspended or terminated to protect the platform and its users.",
                "يمكن تعليق أو إنهاء الحسابات المخالفة لهذه الشروط لحماية المنصة ومستخدميها.",
              )}
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
