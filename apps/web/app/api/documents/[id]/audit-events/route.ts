import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../../route";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}/audit-events`, "PATCH");
};
