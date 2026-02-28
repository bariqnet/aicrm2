import type { Activity } from "@/lib/crm-types";
import { Timeline } from "@/components/Timeline";

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return <Timeline activities={activities} />;
}
