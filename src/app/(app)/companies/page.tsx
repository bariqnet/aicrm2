"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { FilterChips } from "@/components/FilterChips";
import { ModalForm } from "@/components/ModalForm";
import { createCompany, listCompanies, listDeals, listPeople } from "@/lib/api";
import { Company, Deal, Person } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

export default function CompaniesPage() {
  const [rows, setRows] = useState<Company[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const { openDrawer } = useUIStore();

  const load = async () => {
    const [c, p, d] = await Promise.all([listCompanies(), listPeople(), listDeals()]);
    setRows(c.rows);
    setPeople(p.rows);
    setDeals(d.rows);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <ModalForm title="New Company" fields={[{ name: "name", label: "Name" }, { name: "domain", label: "Domain" }, { name: "industry", label: "Industry" }, { name: "size", label: "Size", type: "number" }, { name: "location", label: "Location" }, { name: "owner", label: "Owner" }, { name: "tags", label: "Tags" }]} onSubmit={async (vals) => {
          await createCompany({ ...vals, size: Number(vals.size), tags: vals.tags.split(",") } as any);
          await load();
        }} />
      </div>
      <FilterChips chips={["Industry", "Owner", "Size"]} />
      <DataTable rows={rows} onRowClick={(row) => openDrawer({ type: "company", id: row.id })} columns={[
        { key: "name", label: "Name", render: (r) => r.name },
        { key: "industry", label: "Industry", render: (r) => r.industry },
        { key: "owner", label: "Owner", render: (r) => r.owner },
        { key: "people", label: "People", render: (r) => people.filter((p) => p.companyId === r.id).length },
        { key: "open", label: "Open deals", render: (r) => deals.filter((d) => d.companyId === r.id && !["Won", "Lost"].includes(d.stage)).length },
        { key: "touch", label: "Last touch", render: (r) => fmtDate(r.lastTouchAt) }
      ]} />
    </div>
  );
}
