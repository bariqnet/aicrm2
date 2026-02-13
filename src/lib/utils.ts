import { clsx, type ClassValue } from "clsx";

export const cn = (...args: ClassValue[]) => clsx(args);

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

export const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
