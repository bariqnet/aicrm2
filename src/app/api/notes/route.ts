import { proxyExternalApi } from "@/lib/api-proxy";

export async function GET(request: Request) {
  return proxyExternalApi(request, "/notes");
}

export async function POST(request: Request) {
  return proxyExternalApi(request, "/notes");
}
