"use client";

import Link from "next/link";
import type { Route } from "next";
import { useI18n } from "@/hooks/useI18n";

type InvoiceDetailActionsProps = {
  invoiceId: string;
};

export function InvoiceDetailActions({ invoiceId }: InvoiceDetailActionsProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  function openPrintTemplate() {
    window.open(`/print/invoices/${invoiceId}?autoprint=1`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Link href={`/invoices/${invoiceId}/edit` as Route} className="btn">
        {tr("Edit invoice", "تعديل الفاتورة")}
      </Link>
      <button className="btn" type="button" onClick={openPrintTemplate}>
        {tr("Print", "طباعة")}
      </button>
    </div>
  );
}
