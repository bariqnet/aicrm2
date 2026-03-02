import { proxyExternalApi } from "@/lib/api-proxy";

export async function GET(request: Request) {
  return proxyExternalApi(request, "/reminders");
}

export async function POST(request: Request) {
  return proxyExternalApi(request, "/reminders");
}
