import { apiRequest } from "@/lib/crm-api";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

type UserListEnvelope = {
  rows?: UserSummary[];
};

export async function listUsers(token?: string): Promise<UserSummary[]> {
  const payload = await apiRequest<UserSummary[] | UserListEnvelope>("/users", { token });
  if (Array.isArray(payload)) return payload;
  return payload.rows ?? [];
}

export function getUserDisplayName(user: Pick<UserSummary, "name" | "email"> | null | undefined): string {
  if (!user) return "Unknown user";
  return user.name.trim() || user.email;
}
