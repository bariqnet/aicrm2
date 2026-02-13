import { listActivities, listDeals, listTasks } from "@/lib/api";
import { fmtMoney } from "@/lib/utils";

export default async function DashboardPage() {
  const [{ rows: deals }, { rows: tasks }, { rows: activities }] = await Promise.all([listDeals(), listTasks(), listActivities()]);
  const pipelineValue = deals.filter((d) => !["Won", "Lost"].includes(d.stage)).reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[{ label: "Open Deals", value: deals.length }, { label: "Tasks Due", value: tasks.filter((t) => t.status === "open").length }, { label: "Touched This Week", value: 8 }, { label: "Pipeline Value", value: fmtMoney(pipelineValue) }].map((k) => (
          <div key={k.label} className="rounded-xl border p-4">
            <p className="text-xs text-zinc-500">{k.label}</p>
            <p className="text-2xl font-semibold">{k.value}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="mb-3 font-medium">Recent Activity</h2>
          <div className="space-y-2 text-sm">
            {activities.map((a) => <div key={a.id} className="rounded border p-2">{a.subject}</div>)}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="mb-3 font-medium">My Tasks</h2>
          <div className="space-y-2 text-sm">
            {tasks.map((t) => <div key={t.id} className="rounded border p-2">{t.title}</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
