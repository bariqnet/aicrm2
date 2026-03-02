import { proxyExternalApi } from "@/lib/api-proxy";

export async function GET(request: Request) {
  return proxyExternalApi(request, "/memberships");
}
