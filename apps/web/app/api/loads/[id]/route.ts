import { NextResponse } from "next/server";

import { proxyLoadRequest } from "../route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyLoadRequest(request, `loads/${id}`, "PATCH");
}
