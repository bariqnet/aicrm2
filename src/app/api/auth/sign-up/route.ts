import { proxyExternalApi } from "@/lib/api-proxy";

export async function POST(request: Request) {
  return proxyExternalApi(request, "/auth/register");
}
