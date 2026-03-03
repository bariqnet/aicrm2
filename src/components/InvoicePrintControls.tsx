"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";

type InvoicePrintControlsProps = {
  autoPrint?: boolean;
};

export function InvoicePrintControls({ autoPrint = false }: InvoicePrintControlsProps) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  useEffect(() => {
    if (!autoPrint) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint]);

  return (
    <button className="btn btn-primary" type="button" onClick={() => window.print()}>
      {tr("Print invoice", "طباعة الفاتورة")}
    </button>
  );
}
