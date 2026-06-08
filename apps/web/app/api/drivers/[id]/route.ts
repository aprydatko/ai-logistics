import { NextResponse } from "next/server";

import { proxyDriverMutation } from "../route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyDriverMutation(request, `drivers/${id}`, "GET");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyDriverMutation(request, `drivers/${id}`, "PATCH");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyDriverMutation(request, `drivers/${id}`, "DELETE");
}
