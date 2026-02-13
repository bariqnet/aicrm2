"use client";

import { useState } from "react";

export function ModalForm({
  title,
  fields,
  onSubmit
}: {
  title: string;
  fields: { name: string; label: string; type?: string }[];
  onSubmit: (vals: Record<string, string>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>{title}</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <form
            className="w-full max-w-md space-y-3 rounded-xl border bg-bg p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setLoading(true);
              await onSubmit(Object.fromEntries(fd.entries()) as Record<string, string>);
              setLoading(false);
              setOpen(false);
            }}
          >
            <h3 className="font-semibold">{title}</h3>
            {fields.map((field) => (
              <label key={field.name} className="block text-sm">
                {field.label}
                <input required name={field.name} type={field.type ?? "text"} className="input mt-1 w-full" />
              </label>
            ))}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
              <button disabled={loading} className="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
