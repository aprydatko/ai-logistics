import { NextResponse } from "next/server";

import { type IdRouteContext, proxyWithAuth } from "@/lib/api/proxy-with-auth";

export const GET = async (
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyWithAuth(request, `documents/${id}/file-access`, "GET");
};
