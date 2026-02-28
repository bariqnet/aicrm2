import type { CrmNoteTemplate, CrmStageTemplate, CrmTaskTemplate, CrmTypeId } from "@/lib/crm-types";

export type CrmTypeConfig = {
  id: CrmTypeId;
  label: string;
  stageTemplates: CrmStageTemplate[];
  taskTemplates: CrmTaskTemplate[];
  noteTemplates: CrmNoteTemplate[];
};

const defaultStages: CrmStageTemplate[] = [
  { name: "Lead", order: 1 },
  { name: "Qualified", order: 2 },
  { name: "Proposal", order: 3 },
  { name: "Negotiation", order: 4 },
  { name: "Won", order: 5 }
];

const defaultTasks: CrmTaskTemplate[] = [
  { id: "task-follow-up", label: "Follow-up", title: "Follow up with prospect", dueInDays: 2, relatedTypes: ["contact", "deal"] },
  { id: "task-demo", label: "Book demo", title: "Schedule a product demo", dueInDays: 5, relatedTypes: ["company", "deal"] }
];

const defaultNotes: CrmNoteTemplate[] = [
  { id: "note-discovery", label: "Discovery", body: "Capture qualification details and pain points.", relatedTypes: ["contact", "deal"] }
];

export const CRM_TYPE_CONFIGS: Record<CrmTypeId, CrmTypeConfig> = {
  "software-company": {
    id: "software-company",
    label: "Software Company",
    stageTemplates: defaultStages,
    taskTemplates: defaultTasks,
    noteTemplates: defaultNotes
  },
  dentist: {
    id: "dentist",
    label: "Dentist",
    stageTemplates: [
      { name: "Inquiry", order: 1 },
      { name: "Consultation", order: 2 },
      { name: "Treatment Plan", order: 3 },
      { name: "Completed", order: 4 }
    ],
    taskTemplates: defaultTasks,
    noteTemplates: defaultNotes
  },
  "education-institute": {
    id: "education-institute",
    label: "Education Institute",
    stageTemplates: [
      { name: "Lead", order: 1 },
      { name: "Application", order: 2 },
      { name: "Enrollment", order: 3 },
      { name: "Onboarded", order: 4 }
    ],
    taskTemplates: defaultTasks,
    noteTemplates: defaultNotes
  },
  doctor: {
    id: "doctor",
    label: "Doctor",
    stageTemplates: [
      { name: "New Patient", order: 1 },
      { name: "Consult", order: 2 },
      { name: "Follow-up", order: 3 },
      { name: "Closed", order: 4 }
    ],
    taskTemplates: defaultTasks,
    noteTemplates: defaultNotes
  },
  barber: {
    id: "barber",
    label: "Barber",
    stageTemplates: [
      { name: "First Visit", order: 1 },
      { name: "Repeat", order: 2 },
      { name: "VIP", order: 3 }
    ],
    taskTemplates: defaultTasks,
    noteTemplates: defaultNotes
  },
  other: {
    id: "other",
    label: "Other",
    stageTemplates: defaultStages,
    taskTemplates: defaultTasks,
    noteTemplates: defaultNotes
  }
};

export function getCrmTypeConfig(typeId: CrmTypeId): CrmTypeConfig {
  return CRM_TYPE_CONFIGS[typeId] ?? CRM_TYPE_CONFIGS.other;
}
