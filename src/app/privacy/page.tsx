import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { getDirectionalArrowSymbol } from "@/lib/ui-direction";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPage() {
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
            {tr("Privacy Policy", "سياسة الخصوصية")}
          </h1>
          <p className="mt-2 text-sm text-black/58">
            {tr("Last updated: March 5, 2026", "آخر تحديث: 5 مارس 2026")}
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
              {tr("What We Collect", "البيانات التي نجمعها")}
            </h2>
            <p className="mt-2">
              {tr(
                "We collect account details, workspace data, CRM records, and usage logs needed to operate and secure the service.",
                "نجمع بيانات الحساب ومساحة العمل وسجلات CRM وسجلات الاستخدام اللازمة لتشغيل الخدمة وتأمينها.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("How We Use Data", "كيف نستخدم البيانات")}
            </h2>
            <p className="mt-2">
              {tr(
                "Your data is used to provide product features, maintain security, improve reliability, and deliver support.",
                "نستخدم بياناتك لتقديم مزايا المنتج والحفاظ على الأمان وتحسين موثوقية الخدمة وتقديم الدعم.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("Data Sharing", "مشاركة البيانات")}
            </h2>
            <p className="mt-2">
              {tr(
                "We do not sell personal data. Data may be shared with infrastructure providers strictly to run the platform.",
                "لا نبيع البيانات الشخصية. وقد نشارك البيانات فقط مع مزودي البنية التحتية بالقدر اللازم لتشغيل المنصة.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">
              {tr("Retention & Deletion", "الاحتفاظ والحذف")}
            </h2>
            <p className="mt-2">
              {tr(
                "We retain data while your account is active and for required compliance periods. You can request deletion through support.",
                "نحتفظ بالبيانات طوال فترة نشاط الحساب وللمدد النظامية المطلوبة. ويمكنك طلب الحذف عبر فريق الدعم.",
              )}
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
