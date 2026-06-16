import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve the timeline of a specific incident.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the incident ID parameter
 * @returns A NextResponse with the incident timeline or error
 */
export async function GET(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `incidents/${id}/timeline`, "GET");
}

/**
 * Handles PATCH requests to update the timeline of a specific incident.
 *
 * @param request - The incoming Next.js request with timeline update data
 * @param context - Route context containing the incident ID parameter
 * @returns A NextResponse with the updated incident timeline or error
 */
export async function PATCH(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `incidents/${id}/timeline`, "PATCH");
}
