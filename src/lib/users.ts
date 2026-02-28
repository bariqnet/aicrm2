import { apiRequest } from "@/lib/crm-api";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export async function listUsers(token?: string): Promise<UserSummary[]> {
  return apiRequest<UserSummary[]>("/users", { token });
}

export function getUserDisplayName(user: Pick<UserSummary, "name" | "email"> | null | undefined): string {
  if (!user) return "Unknown user";
  return user.name.trim() || user.email;
}
