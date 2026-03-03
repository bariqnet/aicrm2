export type AiProvider = "openai" | "gemini";

export type AiActionPriority = "high" | "medium" | "low";
export type RelationshipHealthLabel = "strong" | "watch" | "at-risk" | "new";
export type NextBestChannel = "email" | "call" | "meeting" | "message";

export type RelationshipContextEntityType = "contact" | "company";

export type RelationshipContextNote = {
  body: string;
  createdAt?: string | null;
};

export type RelationshipContextActivity = {
  type: string;
  createdAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type RelationshipContextTask = {
  title: string;
  status: string;
  dueAt?: string | null;
};

export type RelationshipContextDeal = {
  title: string;
  status: string;
  amount: number;
  currency: string;
};

export type RelationshipContextInvoice = {
  status: string;
  amount: number;
  currency: string;
  dueAt?: string | null;
  paidAt?: string | null;
};

export type RelationshipIntelligenceRequest = {
  entityType: RelationshipContextEntityType;
  entityId: string;
  entityName: string;
  notes: RelationshipContextNote[];
  activities: RelationshipContextActivity[];
  tasks: RelationshipContextTask[];
  deals: RelationshipContextDeal[];
  invoices: RelationshipContextInvoice[];
};

export type RelationshipRecommendedAction = {
  title: string;
  reason: string;
  priority: AiActionPriority;
};

export type RelationshipIntelligence = {
  summary: string;
  healthScore: number;
  healthLabel: RelationshipHealthLabel;
  priority: AiActionPriority;
  signals: string[];
  risks: string[];
  recommendedActions: RelationshipRecommendedAction[];
  outreachDraft: string;
  nextBestChannel: NextBestChannel;
};

export type RelationshipIntelligenceResponse = {
  provider: AiProvider;
  model: string;
  generatedAt: string;
  insights: RelationshipIntelligence;
};
