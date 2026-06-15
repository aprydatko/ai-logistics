import { NextResponse } from "next/server";

import { proxyIncidentRequest } from "../../route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyIncidentRequest(request, `incidents/${id}/timeline`, "GET");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyIncidentRequest(request, `incidents/${id}/timeline`, "PATCH");
}
