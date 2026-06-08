import { NextResponse } from "next/server";

import { proxyDriverMutation } from "../../route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyDriverMutation(request, `drivers/${id}/documents`, "POST");
}
