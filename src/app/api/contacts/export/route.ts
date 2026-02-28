import { getRequestContext } from "@/lib/request-context";
import { listContacts } from "@/lib/mock-db";

export async function GET() {
  const ctx = await getRequestContext();
  const contacts = listContacts(ctx);

  const rows = contacts.map((contact) =>
    [
      contact.firstName,
      contact.lastName,
      contact.email ?? "",
      contact.phone ?? "",
      contact.companyId ?? "",
      contact.tags.join("|")
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = ["firstName,lastName,email,phone,companyId,tags", ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=contacts.csv"
    }
  });
}
