import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import type { Activity, Company, Contact, Deal, Stage, Task } from "@/lib/crm-types";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getServerLanguage } from "@/lib/server-language";

export default async function DashboardPage() {
  const language = await getServerLanguage();

  const [
    dealsPayload,
    tasksPayload,
    activitiesPayload,
    stagesPayload,
    contactsPayload,
    companiesPayload,
  ] = await Promise.all([
    serverApiRequest<ServerListResponse<Deal>>("/deals"),
    serverApiRequest<ServerListResponse<Task>>("/tasks"),
    serverApiRequest<ServerListResponse<Activity>>("/activities"),
    serverApiRequest<ServerListResponse<Stage>>("/stages"),
    serverApiRequest<ServerListResponse<Contact>>("/contacts"),
    serverApiRequest<ServerListResponse<Company>>("/companies"),
  ]);

  const deals = dealsPayload.rows ?? [];
  const tasks = tasksPayload.rows ?? [];
  const activities = activitiesPayload.rows ?? [];
  const stages = stagesPayload.rows ?? [];
  const contactsTotal = contactsPayload.total ?? contactsPayload.rows?.length ?? 0;
  const companiesTotal = companiesPayload.total ?? companiesPayload.rows?.length ?? 0;

  return (
    <main className="app-page">
      <DashboardWorkspace
        activities={activities}
        companiesTotal={companiesTotal}
        contactsTotal={contactsTotal}
        deals={deals}
        language={language}
        stages={stages}
        tasks={tasks}
      />
    </main>
  );
}
