import { proxyExternalApi } from "@/lib/api-proxy";

export async function PUT(request: Request) {
  return proxyExternalApi(request, "/stages/reorder");
}
