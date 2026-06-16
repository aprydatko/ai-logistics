import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles PATCH requests to update the status of a specific incident.
 *
 * @param request - The incoming Next.js request with status update data
 * @param context - Route context containing the incident ID parameter
 * @returns A NextResponse with the updated incident status or error
 */
export async function PATCH(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `incidents/${id}/status`, "PATCH");
}
