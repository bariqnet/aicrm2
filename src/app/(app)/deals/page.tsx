import { PipelineBoard } from "@/components/PipelineBoard";
import type { Company, Contact, Deal, Stage } from "@/lib/crm-types";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getServerLanguage } from "@/lib/server-language";

export default async function DealsPage() {
  const language = await getServerLanguage();

  const [dealsPayload, stagesPayload, companiesPayload, contactsPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Deal>>("/deals"),
    serverApiRequest<ServerListResponse<Stage>>("/stages"),
    serverApiRequest<ServerListResponse<Company>>("/companies"),
    serverApiRequest<ServerListResponse<Contact>>("/contacts")
  ]);

  const deals = dealsPayload.rows ?? [];
  const stages = [...(stagesPayload.rows ?? [])].sort((a, b) => a.order - b.order);
  const companies = companiesPayload.rows ?? [];
  const contacts = contactsPayload.rows ?? [];

  return (
    <main className="app-page">
      <PipelineBoard
        initialDeals={deals}
        stages={stages}
        companies={companies}
        contacts={contacts}
        language={language}
      />
    </main>
  );
}
