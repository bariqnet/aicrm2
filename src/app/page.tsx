import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  CalendarClock,
  Check,
  Globe2,
  Layers3,
  LockKeyhole,
  Sparkles,
  Users2,
  Workflow
} from "lucide-react";
import { Cairo, Manrope } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getSessionData } from "@/lib/auth";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

const displayFont = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap"
});

const arabicFont = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic-landing",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type PricingTier = {
  name: string;
  price: string;
  frequency: string;
  description: string;
  ctaLabel: string;
  ctaHref: "/auth/sign-up" | "/auth/sign-in";
  featured?: boolean;
  bullets: string[];
};

export default async function HomePage() {
  const session = await getSessionData();
  if (session.token && session.user) {
    redirect("/dashboard");
  }

  const language = await getServerLanguage();
  const isArabic = language === "ar";
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);
  const headingClass = isArabic
    ? "font-[family-name:var(--font-arabic-landing)]"
    : "font-[family-name:var(--font-display)]";
  const heroHeadingTypographyClass = isArabic ? "leading-[1.2]" : "leading-[1.02] tracking-[-0.03em]";
  const sectionHeadingTypographyClass = isArabic ? "leading-[1.2]" : "tracking-[-0.02em]";
  const heroHeadingSizeClass = isArabic ? "text-[2.3rem] sm:text-5xl lg:text-6xl" : "text-4xl sm:text-5xl lg:text-7xl";
  const sectionHeadingSizeClass = isArabic ? "mt-4 text-[2rem] sm:text-5xl" : "mt-3 text-3xl sm:text-5xl";
  const sectionLabelClass = isArabic
    ? "text-sm font-medium leading-7 text-black/58"
    : "text-xs uppercase tracking-[0.14em] text-black/45";
  const sectionLabelOnDarkClass = isArabic
    ? "text-sm font-medium leading-7 text-white/72"
    : "text-xs uppercase tracking-[0.14em] text-white/60";
  const heroBodyClass = isArabic
    ? "max-w-[62ch] text-[1.03rem] leading-8 text-black/72"
    : "max-w-2xl text-base leading-7 text-black/67 sm:text-lg";
  const sectionBodyClass = isArabic
    ? "mt-4 text-[1.02rem] leading-8 text-black/68"
    : "mt-3 text-sm leading-6 text-black/62 sm:text-base";
  const sectionBodyOnDarkClass = isArabic
    ? "mt-4 max-w-3xl text-[1.01rem] leading-8 text-white/80"
    : "mt-3 max-w-3xl text-sm leading-6 text-white/72 sm:text-base";
  const cardTitleClass = isArabic ? "mt-5 text-xl font-semibold leading-8" : "mt-4 text-lg font-semibold tracking-tight";
  const cardTextClass = isArabic ? "mt-3 text-[1rem] leading-8 text-black/69" : "mt-2 text-sm leading-6 text-black/65";
  const cardTextOnDarkClass = isArabic ? "mt-3 text-[0.98rem] leading-8 text-white/80" : "mt-2 text-sm leading-6 text-white/72";
  const heroTagClass = isArabic
    ? "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/75"
    : "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70";

  const teamUseCards: Array<{ title: string; icon: LucideIcon }> = [
    { title: tr("Sales Ops", "عمليات المبيعات"), icon: BarChart3 },
    { title: tr("B2B Services", "خدمات الأعمال"), icon: Building2 },
    { title: tr("Field Teams", "الفرق الميدانية"), icon: Users2 },
    { title: tr("Revenue Leaders", "قادة الإيرادات"), icon: Workflow },
    { title: tr("Partnership Teams", "فرق الشراكات"), icon: Globe2 }
  ];

  const buildCards: FeatureCard[] = [
    {
      title: tr("Model your workflow", "صمّم سير العمل الخاص بك"),
      description: tr(
        "Structure contacts, companies, deals, and stages around how your team actually sells.",
        "نظّم جهات الاتصال والشركات والصفقات والمراحل بما يتوافق مع طريقة عمل فريقك الفعلية."
      ),
      icon: Layers3
    },
    {
      title: tr("Refine without rebuilds", "طوّر النظام بدون إعادة بناء"),
      description: tr(
        "Update fields, stage rules, and process steps without migrations or engineering bottlenecks.",
        "عدّل الحقول وقواعد المراحل وخطوات العملية بدون ترحيلات معقدة أو تعطيل للفريق التقني."
      ),
      icon: Workflow
    },
    {
      title: tr("Execute in one place", "نفّذ كل شيء من مكان واحد"),
      description: tr(
        "Handle tasks, visits, reminders, and invoice handoffs in the same workspace as pipeline data.",
        "أدر المهام والزيارات والتذكيرات وتسليم الفواتير داخل نفس مساحة العمل المرتبطة بخط المبيعات."
      ),
      icon: CalendarClock
    },
    {
      title: tr("Measure what matters", "تابع المؤشرات المهمة"),
      description: tr(
        "Track stage velocity, team execution, and relationship health with real-time reporting.",
        "راقب سرعة التقدم في المراحل وأداء الفريق وصحة العلاقات عبر تقارير فورية."
      ),
      icon: BarChart3
    }
  ];

  const platformCards: FeatureCard[] = [
    {
      title: tr("AI relationship intelligence", "ذكاء علاقات مدعوم بالذكاء الاصطناعي"),
      description: tr(
        "Generate account summaries, next actions, and follow-up signals from notes and activity.",
        "أنشئ ملخصات الحسابات والخطوات التالية وإشارات المتابعة تلقائيًا من الملاحظات والنشاط."
      ),
      icon: BrainCircuit
    },
    {
      title: tr("Connected records", "سجلات مترابطة"),
      description: tr(
        "Connect contacts, companies, deals, invoices, and tasks so critical context stays intact.",
        "اربط جهات الاتصال بالشركات والصفقات والفواتير والمهام حتى يبقى السياق متاحًا دائمًا."
      ),
      icon: Building2
    },
    {
      title: tr("Fast operations layer", "طبقة عمليات سريعة"),
      description: tr(
        "Keep execution moving with reminders, notifications, and calendar visibility across teams.",
        "حافظ على سرعة التنفيذ عبر التذكيرات والإشعارات ورؤية التقويم على مستوى الفريق."
      ),
      icon: Bot
    }
  ];

  const teamworkCards: FeatureCard[] = [
    {
      title: tr("Multi-workspace ready", "جاهز لعدة مساحات عمل"),
      description: tr(
        "Switch between workspaces, invite members, and adjust role access in minutes.",
        "انتقل بين مساحات العمل وادعُ الأعضاء وعدّل الصلاحيات خلال دقائق."
      ),
      icon: Users2
    },
    {
      title: tr("Global language support", "دعم لغوي متكامل"),
      description: tr(
        "Use English and Arabic with built-in LTR and RTL direction support.",
        "استخدم الإنجليزية والعربية مع دعم كامل لاتجاهي LTR وRTL."
      ),
      icon: Globe2
    },
    {
      title: tr("Security by default", "الأمان بشكل افتراضي"),
      description: tr(
        "Use session-based auth, API validation, and role-scoped access across core CRM entities.",
        "استفد من مصادقة الجلسات والتحقق من API وصلاحيات الأدوار على كل كيانات CRM الأساسية."
      ),
      icon: LockKeyhole
    }
  ];

  const pricingTiers: PricingTier[] = [
    {
      name: tr("Starter", "البداية"),
      price: "$10",
      frequency: tr("per seat / month", "لكل مستخدم / شهريًا"),
      description: tr(
        "For individuals and small teams validating their first repeatable CRM workflow.",
        "للأفراد والفرق الصغيرة التي تبني أول سير عمل CRM قابل للتكرار."
      ),
      ctaLabel: tr("Start trial", "ابدأ التجربة"),
      ctaHref: "/auth/sign-up",
      bullets: [
        tr("Up to 3 seats", "حتى 3 مستخدمين"),
        tr("Contacts, companies, deals", "جهات الاتصال، الشركات، الصفقات"),
        tr("Tasks, visits, and calendar", "المهام، الزيارات، التقويم"),
        tr("Basic reporting", "تقارير أساسية")
      ]
    },
    {
      name: tr("Plus", "بلس"),
      price: "$29",
      frequency: tr("per seat / month", "لكل مستخدم / شهريًا"),
      description: tr(
        "For growing GTM teams that need one shared CRM operating system.",
        "للفرق النامية التي تحتاج نظام CRM موحدًا لإدارة الإيرادات."
      ),
      ctaLabel: tr("Start 14-day trial", "ابدأ تجربة 14 يومًا"),
      ctaHref: "/auth/sign-up",
      featured: true,
      bullets: [
        tr("Unlimited seats", "مستخدمون غير محدودين"),
        tr("Custom pipeline stages", "مراحل مخصصة لخط المبيعات"),
        tr("Invoices and notifications", "فواتير وإشعارات"),
        tr("Priority support", "دعم أولوية")
      ]
    },
    {
      name: tr("Pro", "برو"),
      price: "$59",
      frequency: tr("per seat / month", "لكل مستخدم / شهريًا"),
      description: tr(
        "For multi-team revenue orgs that need automation and AI-driven context.",
        "للمؤسسات متعددة الفرق التي تحتاج الأتمتة وسياقًا مدعومًا بالذكاء الاصطناعي."
      ),
      ctaLabel: tr("Start pro trial", "ابدأ تجربة برو"),
      ctaHref: "/auth/sign-up",
      bullets: [
        tr("AI relationship intelligence", "ذكاء علاقات بالذكاء الاصطناعي"),
        tr("Advanced permissions", "صلاحيات متقدمة"),
        tr("Workflow automations", "أتمتة سير العمل"),
        tr("Performance analytics", "تحليلات الأداء")
      ]
    },
    {
      name: tr("Enterprise", "المؤسسات"),
      price: tr("Custom", "مخصص"),
      frequency: tr("annual contract", "عقد سنوي"),
      description: tr(
        "For high-compliance teams that need migration support and dedicated enablement.",
        "للفرق ذات المتطلبات العالية التي تحتاج دعم ترحيل وتمكين مخصص."
      ),
      ctaLabel: tr("Talk to sales", "تواصل مع المبيعات"),
      ctaHref: "/auth/sign-in",
      bullets: [
        tr("Custom SLAs", "اتفاقيات مستوى خدمة مخصصة"),
        tr("Security review support", "دعم مراجعات الأمان"),
        tr("Dedicated success manager", "مدير نجاح مخصص"),
        tr("Rollout and training plan", "خطة إطلاق وتدريب")
      ]
    }
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className={[
        displayFont.variable,
        arabicFont.variable,
        isArabic ? arabicFont.className : "",
        "relative overflow-x-clip bg-[#f5f6f8] text-[#0f1218]"
      ].join(" ")}
    >
      <div className="landing-ambient-glow pointer-events-none absolute inset-x-0 top-[-12rem] h-[34rem] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),rgba(245,246,248,0)_68%)]" />

      <header className="sticky top-0 z-30 border-b border-black/7 bg-[#f5f6f8]/85 backdrop-blur-lg">
        <div className="mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href={"/" as Route} className="inline-flex items-center">
            <Image src="/fav.png" alt="Que CRM" width={1076} height={400} priority className="h-12 w-auto sm:h-14" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-black/65 lg:flex">
            <a href="#features" className="transition hover:text-black">
              {tr("Product", "المنتج")}
            </a>
            <a href="#platform" className="transition hover:text-black">
              {tr("Platform", "المنصة")}
            </a>
            <a href="#pricing" className="transition hover:text-black">
              {tr("Pricing", "الأسعار")}
            </a>
            <a href="#teamwork" className="transition hover:text-black">
              {tr("Use Cases", "حالات الاستخدام")}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle mode="full" className="rounded-full border-black/12 bg-white p-1 shadow-sm" />
            <Link
              href="/auth/sign-in"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black sm:inline-flex"
            >
              {tr("Sign in", "تسجيل الدخول")}
            </Link>
            <Link
              href="/auth/sign-up"
              className="landing-cta inline-flex h-10 items-center rounded-full bg-[#111319] px-5 text-sm font-semibold text-white transition hover:bg-[#1a1d25]"
            >
              {tr("Start for free", "ابدأ مجانًا")}
            </Link>
          </div>
        </div>
      </header>

      <section
        className={[
          "mx-auto w-full max-w-7xl px-5 sm:px-8",
          isArabic ? "pb-20 pt-12 lg:pb-28 lg:pt-24" : "pb-16 pt-10 lg:pb-24 lg:pt-20"
        ].join(" ")}
      >
        <div className={["landing-fade-up", isArabic ? "max-w-4xl space-y-9 lg:pt-2" : "max-w-3xl space-y-7"].join(" ")}>
          <p className={heroTagClass}>
            <Sparkles size={14} className="text-blue-700" />
            {tr("The AI-native CRM for modern GTM teams", "منصة CRM ذكية لفرق المبيعات الحديثة")}
          </p>

          <div className={isArabic ? "space-y-6" : "space-y-5"}>
            <h1 className={`${headingClass} ${heroHeadingTypographyClass} ${heroHeadingSizeClass} font-semibold`}>
              {tr("Run your full relationship workflow in one CRM.", "أدر دورة علاقات العملاء بالكامل من نظام CRM واحد.")}
            </h1>
            <p className={heroBodyClass}>
              {tr(
                "Que combines contact intelligence, deal execution, team operations, and invoicing in one workspace. Move from first touch to closed revenue without context switching.",
                "يوحّد Que بيانات جهات الاتصال وتنفيذ الصفقات وعمليات الفريق والفوترة داخل مساحة عمل واحدة. انتقل من أول تواصل إلى إغلاق الإيراد بدون تشتت."
              )}
            </p>
          </div>

          <div className={["flex flex-wrap gap-3", isArabic ? "items-stretch" : "items-center"].join(" ")}>
            <Link
              href="/auth/sign-up"
              className="landing-cta landing-cta-pulse inline-flex h-12 items-center gap-2 rounded-full bg-[#111319] px-6 text-sm font-semibold text-white transition hover:bg-[#1a1d25]"
            >
              {tr("Start for free", "ابدأ مجانًا")}
              {isArabic ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <Link
              href="/auth/sign-in"
              className="landing-cta inline-flex h-12 items-center rounded-full border border-black/14 bg-white px-6 text-sm font-semibold text-black transition hover:border-black/25"
            >
              {tr("Book a demo", "احجز عرضًا مباشرًا")}
            </Link>
          </div>

          <div className={["flex flex-wrap gap-3 text-black/62", isArabic ? "text-sm" : "items-center text-xs"].join(" ")}>
            <span className={["inline-flex items-center rounded-full border border-black/10 bg-white", isArabic ? "gap-2 px-4 py-2" : "gap-1 px-3 py-1"].join(" ")}>
              <Check size={13} />
              {tr("Unlimited contacts", "جهات اتصال غير محدودة")}
            </span>
            <span className={["inline-flex items-center rounded-full border border-black/10 bg-white", isArabic ? "gap-2 px-4 py-2" : "gap-1 px-3 py-1"].join(" ")}>
              <Check size={13} />
              {tr("English + Arabic", "الإنجليزية + العربية")}
            </span>
            <span className={["inline-flex items-center rounded-full border border-black/10 bg-white", isArabic ? "gap-2 px-4 py-2" : "gap-1 px-3 py-1"].join(" ")}>
              <Check size={13} />
              {tr("API-ready", "جاهز للتكامل البرمجي (API)")}
            </span>
          </div>
        </div>
      </section>

      <section className={["mx-auto w-full max-w-7xl px-5 sm:px-8", isArabic ? "py-14 lg:py-24" : "py-12 lg:py-20"].join(" ")}>
        <div className={["landing-fade-up rounded-[1.8rem] border border-black/10 bg-white px-5 sm:px-8", isArabic ? "py-8" : "py-6"].join(" ")}>
          <p className={sectionLabelClass}>
            {tr("Built for high-tempo revenue and operations teams", "مصمم لفرق الإيرادات والعمليات سريعة الإيقاع")}
          </p>
          <div className={["mt-4 grid gap-3 font-semibold text-black/70 sm:grid-cols-2 lg:grid-cols-5", isArabic ? "text-[0.98rem] leading-7" : "text-sm"].join(" ")}>
            {teamUseCards.map(({ title, icon: Icon }, index) => (
              <article
                key={title}
                className="landing-card landing-fade-up rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3"
                style={{ animationDelay: `${0.06 * (index + 1)}s` }}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/12 bg-white text-black/72">
                  <Icon size={15} />
                </span>
                <p className="mt-2">{title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={["mx-auto w-full max-w-7xl px-5 sm:px-8", isArabic ? "py-16 lg:py-24" : "py-12 lg:py-20"].join(" ")}>
        <div className={["landing-fade-up", isArabic ? "mb-10 max-w-4xl" : "mb-7 max-w-3xl"].join(" ")}>
          <p className={sectionLabelClass}>
            {tr("Build a CRM that fits your team", "ابنِ نظام CRM يناسب فريقك")}
          </p>
          <h2 className={`${headingClass} ${sectionHeadingTypographyClass} ${sectionHeadingSizeClass} font-semibold`}>
            {tr(
              "Every workflow is configurable, so your CRM grows with your process.",
              "كل سير عمل قابل للتخصيص، لذلك ينمو النظام مع طريقة عمل فريقك."
            )}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {buildCards.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className={[
                "landing-card landing-fade-up rounded-[1.5rem] border border-black/10 bg-white shadow-[0_14px_34px_rgba(16,18,23,0.05)]",
                isArabic ? "p-7" : "p-6"
              ].join(" ")}
              style={{ animationDelay: `${0.08 * (index + 1)}s` }}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/12 bg-[#f8f9fb]">
                <Icon size={18} />
              </span>
              <h3 className={cardTitleClass}>{title}</h3>
              <p className={cardTextClass}>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="platform" className={["mx-auto w-full max-w-7xl px-5 sm:px-8", isArabic ? "py-14 lg:py-24" : "py-12 lg:py-20"].join(" ")}>
        <div
          className={[
            "landing-fade-up rounded-[2.1rem] border border-black/10 bg-[#0f1218] text-white",
            isArabic ? "p-7 sm:p-10 lg:p-12" : "p-6 sm:p-8 lg:p-10"
          ].join(" ")}
        >
          <div className="max-w-none">
            <p className={sectionLabelOnDarkClass}>{tr("Platform", "المنصة")}</p>
            <h2 className={`${headingClass} ${sectionHeadingTypographyClass} ${sectionHeadingSizeClass} font-semibold`}>
              {tr(
                "Real-time relationships need real-time data and action.",
                "العلاقات الفعالة تحتاج بيانات وإجراءات لحظية."
              )}
            </h2>
            <p className={sectionBodyOnDarkClass}>
              {tr(
                "From lead discovery to invoice follow-through, Que keeps context synchronized so teams move faster without dropping details.",
                "من اكتشاف الفرصة حتى متابعة الفاتورة، يحافظ Que على ترابط البيانات حتى يعمل فريقك بسرعة ووضوح."
              )}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {platformCards.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="landing-card landing-fade-up rounded-3xl border border-white/15 bg-white/[0.04] p-5"
                style={{ animationDelay: `${0.08 * (index + 1)}s` }}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <Icon size={18} />
                </span>
                <h3 className={isArabic ? "mt-5 text-xl font-semibold leading-8" : "mt-4 text-lg font-semibold"}>{title}</h3>
                <p className={cardTextOnDarkClass}>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="teamwork" className={["mx-auto w-full max-w-7xl px-5 sm:px-8", isArabic ? "py-14 lg:py-24" : "py-12 lg:py-20"].join(" ")}>
        <div className={["landing-fade-up", isArabic ? "mb-10 max-w-4xl" : "mb-7 max-w-3xl"].join(" ")}>
          <p className={sectionLabelClass}>
            {tr("Designed for multiplayer execution", "مصمم للتنفيذ الجماعي")}
          </p>
          <h2 className={`${headingClass} ${sectionHeadingTypographyClass} ${sectionHeadingSizeClass} font-semibold`}>
            {tr("One workspace for sellers, operators, and leadership.", "مساحة عمل واحدة للمبيعات والعمليات والإدارة.")}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {teamworkCards.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className={[
                "landing-card landing-fade-up rounded-[1.6rem] border border-black/10 bg-white shadow-[0_14px_34px_rgba(16,18,23,0.05)]",
                isArabic ? "p-7" : "p-6"
              ].join(" ")}
              style={{ animationDelay: `${0.08 * (index + 1)}s` }}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/12 bg-[#f8f9fb]">
                <Icon size={18} />
              </span>
              <h3 className={cardTitleClass}>{title}</h3>
              <p className={cardTextClass}>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className={["mx-auto w-full max-w-7xl px-5 sm:px-8", isArabic ? "py-16 lg:py-24" : "py-12 lg:py-20"].join(" ")}>
        <div className={["landing-fade-up", isArabic ? "mb-10 max-w-4xl" : "mb-8 max-w-3xl"].join(" ")}>
          <p className={sectionLabelClass}>{tr("Pricing tiers", "شرائح الأسعار")}</p>
          <h2 className={`${headingClass} ${sectionHeadingTypographyClass} ${sectionHeadingSizeClass} font-semibold`}>
            {tr("Start at $10. Expand as your revenue motion scales.", "ابدأ من 10$. وتوسع مع نمو عمليات الإيرادات لديك.")}
          </h2>
          <p className={sectionBodyClass}>
            {tr(
              "Every plan includes unlimited contacts and companies, English and Arabic support, and API access.",
              "كل خطة تشمل جهات اتصال وشركات غير محدودة، ودعم العربية والإنجليزية، وإمكانية التكامل عبر API."
            )}
          </p>
          <div className={["mt-4 inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-1.5 font-semibold text-black/65", isArabic ? "text-sm" : "text-xs"].join(" ")}>
            {tr("Billed monthly", "يتم الدفع شهريًا")}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {pricingTiers.map((tier, index) => (
            <article
              key={tier.name}
              className={[
                "landing-card landing-fade-up rounded-[1.6rem] border",
                isArabic ? "p-7" : "p-6",
                tier.featured
                  ? "border-black bg-[#111319] text-white shadow-[0_26px_58px_rgba(16,18,23,0.26)]"
                  : "border-black/10 bg-white text-black"
              ].join(" ")}
              style={{ animationDelay: `${0.08 * (index + 1)}s` }}
            >
              <p className={[tier.featured ? "text-white/72" : "text-black/55", isArabic ? "text-base" : ""].join(" ")}>
                {tier.name}
              </p>
              <p className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
                <span
                  className={
                    [
                      "pb-1 sm:text-sm",
                      tier.featured ? "text-white/65" : "text-black/56",
                      isArabic ? "text-sm" : "text-xs"
                    ].join(" ")
                  }
                >
                  {tier.frequency}
                </span>
              </p>
              <p
                className={[
                  "mt-3",
                  tier.featured ? "text-white/75" : "text-black/65",
                  isArabic ? "text-[0.98rem] leading-8" : "text-sm leading-6"
                ].join(" ")}
              >
                {tier.description}
              </p>

              <Link
                href={tier.ctaHref}
                className={[
                  "mt-5 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition",
                  tier.featured
                    ? "bg-white text-[#111319] hover:bg-white/92"
                    : "border border-black/14 bg-white text-black hover:border-black/30"
                ].join(" ")}
              >
                {tier.ctaLabel}
              </Link>

              <ul className={["mt-5", isArabic ? "space-y-3" : "space-y-2.5"].join(" ")}>
                {tier.bullets.map((item) => (
                  <li key={item} className={["flex items-start gap-2", isArabic ? "text-[0.97rem] leading-8" : "text-sm"].join(" ")}>
                    <Check size={16} className={tier.featured ? "mt-0.5 text-white/90" : "mt-0.5 text-black/70"} />
                    <span className={tier.featured ? "text-white/75" : "text-black/66"}>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={["mx-auto w-full max-w-7xl px-5 sm:px-8", isArabic ? "pt-14 pb-20 lg:pt-24 lg:pb-28" : "pt-12 pb-16 lg:pt-20 lg:pb-24"].join(" ")}>
        <div
          className={[
            "landing-fade-up rounded-[2.1rem] border border-black/14 bg-[#111319] text-white",
            isArabic ? "px-7 py-12 sm:px-11" : "px-6 py-10 sm:px-10"
          ].join(" ")}
        >
          <Image src="/fav.png" alt="Que CRM" width={1076} height={400} className="h-12 w-auto opacity-95" />
          <h2 className={`${headingClass} ${sectionHeadingTypographyClass} ${sectionHeadingSizeClass} max-w-2xl font-semibold`}>
            {tr("Move faster with a CRM your team actually wants to use.", "تحرك بسرعة أكبر مع نظام CRM يرغب فريقك فعليًا في استخدامه.")}
          </h2>
          <p className={`${sectionBodyOnDarkClass} max-w-2xl`}>
            {tr(
              "Start with a free workspace, invite your team, and run your full pipeline plus operations from one place.",
              "ابدأ بمساحة عمل مجانية، وادعُ فريقك، وأدر خط المبيعات والعمليات بالكامل من مكان واحد."
            )}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="landing-cta inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#111319] transition hover:bg-white/92"
            >
              {tr("Create workspace", "أنشئ مساحة عمل")}
              {isArabic ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <Link
              href="/auth/sign-in"
              className="landing-cta inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {tr("Sign in", "تسجيل الدخول")}
            </Link>
          </div>
        </div>
      </section>

      <footer className={["border-t border-black/8 bg-[#f5f6f8] px-5 sm:px-8", isArabic ? "py-10" : "py-8"].join(" ")}>
        <div className="mx-auto grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image src="/fav.png" alt="Que CRM" width={1076} height={400} className="h-8 w-auto" />
            <p className={["mt-3 max-w-sm text-black/60", isArabic ? "text-[0.98rem] leading-8" : "text-sm leading-6"].join(" ")}>
              {tr(
                "AI-driven CRM for teams running contacts, pipeline, operations, and invoicing in one workspace.",
                "نظام CRM مدعوم بالذكاء الاصطناعي لإدارة جهات الاتصال وخط المبيعات والعمليات والفواتير داخل مساحة عمل واحدة."
              )}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-black">{tr("Product", "المنتج")}</p>
            <ul className={["mt-3 text-black/62", isArabic ? "space-y-2.5 text-[0.98rem] leading-7" : "space-y-2 text-sm"].join(" ")}>
              <li>
                <a href="#features" className="transition hover:text-black">
                  {tr("Features", "المزايا")}
                </a>
              </li>
              <li>
                <a href="#platform" className="transition hover:text-black">
                  {tr("Platform", "المنصة")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="transition hover:text-black">
                  {tr("Pricing", "الأسعار")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-black">{tr("Company", "الشركة")}</p>
            <ul className={["mt-3 text-black/62", isArabic ? "space-y-2.5 text-[0.98rem] leading-7" : "space-y-2 text-sm"].join(" ")}>
              <li>
                <Link href="/auth/sign-in" className="transition hover:text-black">
                  {tr("Sign in", "تسجيل الدخول")}
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-up" className="transition hover:text-black">
                  {tr("Create workspace", "أنشئ مساحة عمل")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-black">{tr("Legal", "قانوني")}</p>
            <ul className={["mt-3 text-black/62", isArabic ? "space-y-2.5 text-[0.98rem] leading-7" : "space-y-2 text-sm"].join(" ")}>
              <li>
                <a href="#" className="transition hover:text-black">
                  {tr("Terms", "الشروط")}
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-black">
                  {tr("Privacy", "الخصوصية")}
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-black">
                  {tr("Support", "الدعم")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={["mx-auto mt-8 w-full max-w-7xl border-t border-black/8 pt-4 text-black/52", isArabic ? "text-[0.97rem] leading-7" : "text-sm"].join(" ")}>
          © {new Date().getFullYear()} Que CRM. {tr("All rights reserved.", "جميع الحقوق محفوظة.")}
        </div>
      </footer>
    </main>
  );
}
