"use client";

import { useEffect, useState } from "react";
import { ModalForm } from "@/components/ModalForm";
import { createDeal, listCompanies, listDeals } from "@/lib/api";
import { Company, Deal, DealStage } from "@/lib/types";
import { fmtMoney } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const stages: DealStage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [table, setTable] = useState(false);
  const { openDrawer } = useUIStore();

  const load = async () => {
    const [d, c] = await Promise.all([listDeals(), listCompanies()]);
    setDeals(d.rows);
    setCompanies(c.rows);
  };
  useEffect(() => { load(); }, []);

  const onDragEnd = (dealId: string, stage: DealStage) => setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage } : d));
  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "-";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setTable((v) => !v)}>{table ? "Kanban" : "Table"} view</button>
          <ModalForm title="New Deal" fields={[{ name: "name", label: "Name" }, { name: "companyId", label: "Company ID" }, { name: "personIds", label: "Person IDs" }, { name: "stage", label: "Stage" }, { name: "amount", label: "Amount", type: "number" }, { name: "currency", label: "Currency" }, { name: "closeDate", label: "Close date", type: "date" }, { name: "owner", label: "Owner" }]} onSubmit={async (vals) => {
            await createDeal({ ...vals, amount: Number(vals.amount), personIds: vals.personIds.split(",") as string[], stage: vals.stage as DealStage } as any);
            await load();
          }} />
        </div>
      </div>
      {table ? <div className="rounded-xl border p-3 text-sm">{deals.map((d) => <div key={d.id} className="flex justify-between border-b py-2"><span>{d.name}</span><span>{d.stage}</span></div>)}</div> : (
        <div className="grid gap-3 lg:grid-cols-6">
          {stages.map((stage) => (
            <div key={stage} className="rounded-xl border bg-muted/20 p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDragEnd(e.dataTransfer.getData("deal"), stage)}>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500">{stage}</p>
              <div className="space-y-2">
                {deals.filter((d) => d.stage === stage).map((d) => (
                  <button key={d.id} draggable onDragStart={(e) => e.dataTransfer.setData("deal", d.id)} onClick={() => openDrawer({ type: "deal", id: d.id })}
                    className="w-full rounded-lg border bg-bg p-2 text-left text-sm hover:border-accent/40">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-zinc-500">{companyName(d.companyId)}</p>
                    <p className="text-xs">{fmtMoney(d.amount, d.currency)}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
