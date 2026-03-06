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
        <div key={a.id} className="rounded-md border p-3">
          <p className="text-xs uppercase text-mutedfg">{a.type}</p>
          <p className="font-medium">
            {a.entityType} · {a.entityId}
          </p>
          {a.metadata ? (
            <p className="text-sm text-mutedfg">{JSON.stringify(a.metadata)}</p>
          ) : (
            <p className="text-sm text-mutedfg">
              {tr("No additional metadata.", "لا توجد بيانات إضافية.")}
            </p>
          )}
          <p className="mt-1 text-xs text-mutedfg">
            {fmtDate(a.createdAt, locale)} · {a.actorId}
          </p>
        </div>
      ))}
    </div>
  );
}
