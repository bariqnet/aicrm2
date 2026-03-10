import type { Activity } from "@/lib/crm-types";
import { useI18n } from "@/hooks/useI18n";
import { getDateLocale } from "@/lib/locale";
import { fmtDate } from "@/lib/utils";

export function Timeline({ activities }: { activities: Activity[] }) {
  const { language } = useI18n();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="rounded-2xl border border-border/85 bg-surface2/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
            {a.type}
          </p>
          <p className="mt-2 font-medium text-fg">
            {a.entityType} · {a.entityId}
          </p>
          {a.metadata ? (
            <p className="mt-2 text-sm leading-6 text-mutedfg">{JSON.stringify(a.metadata)}</p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-mutedfg">
              {tr("No additional metadata.", "لا توجد بيانات إضافية.")}
            </p>
          )}
          <p className="mt-2 text-xs text-mutedfg">
            {fmtDate(a.createdAt, locale)} · {a.actorId}
          </p>
        </div>
      ))}
    </div>
  );
}
