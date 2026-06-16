import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles PATCH requests to update audit events for a specific document.
 *
 * @param request - The incoming Next.js request with audit event data
 * @param context - Route context containing the document ID parameter
 * @returns A NextResponse with the updated audit events or error
 */
export const PATCH = async (
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyWithAuth(request, `documents/${id}/audit-events`, "PATCH");
};
