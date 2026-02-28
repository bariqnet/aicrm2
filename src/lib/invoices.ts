import { INVOICE_STATUS_VALUES, type InvoiceStatus } from "@/lib/crm-types";

export { INVOICE_STATUS_VALUES };

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUS_VALUES as readonly string[]).includes(value);
}
