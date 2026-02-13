"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { FilterChips } from "@/components/FilterChips";
import { ListSkeleton } from "@/components/Skeletons";
import { ModalForm } from "@/components/ModalForm";
import { createPerson, listPeople } from "@/lib/api";
import { Person } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

export default function PeoplePage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openDrawer } = useUIStore();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPeople({ q });
      setRows(data.rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People</h1>
        <ModalForm title="New Person" fields={[{ name: "name", label: "Name" }, { name: "title", label: "Title" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" }, { name: "companyId", label: "Company ID" }, { name: "owner", label: "Owner" }, { name: "tags", label: "Tags (comma)" }]} onSubmit={async (vals) => {
          await createPerson({ ...vals, tags: vals.tags.split(",").map((x) => x.trim()) } as any);
          await load();
        }} />
      </div>
      <input className="input w-full max-w-md" placeholder="Search contacts" value={q} onChange={(e) => setQ(e.target.value)} />
      <FilterChips chips={["Owner", "Tag", "Last touch"]} />
      {loading ? <ListSkeleton /> : error ? <p className="text-sm text-red-500">{error}</p> : (
        <DataTable
          rows={rows}
          onRowClick={(row) => openDrawer({ type: "person", id: row.id })}
          columns={[
            { key: "name", label: "Name", render: (p) => p.name },
            { key: "company", label: "Company", render: (p) => p.companyId },
            { key: "title", label: "Title", render: (p) => p.title },
            { key: "owner", label: "Owner", render: (p) => p.owner },
            { key: "lastTouch", label: "Last touch", render: (p) => fmtDate(p.lastTouchAt) },
            { key: "tags", label: "Tags", render: (p) => <div className="flex gap-1">{p.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div> }
          ]}
        />
      )}
    </div>
  );
}
