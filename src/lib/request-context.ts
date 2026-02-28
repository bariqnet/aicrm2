import type { MembershipRole } from "@/lib/crm-types";
import { getSessionData } from "@/lib/auth";
import type { RequestContext } from "@/lib/mock-db";

export type ApiRequestContext = RequestContext & {
  role: MembershipRole;
};

function isMembershipRole(value: string | null): value is MembershipRole {
  return value === "OWNER" || value === "ADMIN" || value === "MEMBER";
}

export async function getRequestContext(request?: Request): Promise<ApiRequestContext> {
  const session = await getSessionData();
  const roleHeader = request?.headers.get("x-membership-role") ?? null;
  const role = isMembershipRole(roleHeader) ? roleHeader : "OWNER";

  return {
    workspaceId: session.workspaceId ?? "ws_default",
    userId: session.user?.id ?? "user_demo",
    role
  };
}
