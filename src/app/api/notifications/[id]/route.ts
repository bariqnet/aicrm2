import { proxyExternalApi } from "@/lib/api-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyExternalApi(request, `/notifications/${id}`);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyExternalApi(request, `/notifications/${id}`);
}
