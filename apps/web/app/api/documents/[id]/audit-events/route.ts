import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../../route";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Handles PATCH requests to update audit events for a specific document.
 *
 * @param request - The incoming Next.js request with audit event data
 * @param context - Route context containing the document ID parameter
 * @returns A NextResponse with the updated audit events or error
 */
export const PATCH = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}/audit-events`, "PATCH");
};
