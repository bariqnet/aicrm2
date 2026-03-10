import type { ReactNode } from "react";

export function EmptyState({
  action,
  hint,
  title,
}: {
  action?: ReactNode;
  hint: string;
  title: string;
}) {
  return (
    <div className="panel panel-dashed p-10 text-center text-sm text-mutedfg">
      <p className="text-base font-semibold tracking-[-0.02em] text-fg">{title}</p>
      <p className="mx-auto mt-2 max-w-lg leading-7">{hint}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
