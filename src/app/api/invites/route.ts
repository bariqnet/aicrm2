import { proxyExternalApi } from "@/lib/api-proxy";

export async function GET(request: Request) {
  return proxyExternalApi(request, "/invites");
}

export async function POST(request: Request) {
  return proxyExternalApi(request, "/invites");
}
