import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve a specific incident by ID.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the incident ID parameter
 * @returns A NextResponse with the incident details or error
 */
export async function GET(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `incidents/${id}`, "GET");
}

/**
 * Handles PATCH requests to update a specific incident by ID.
 *
 * @param request - The incoming Next.js request with update data in the body
 * @param context - Route context containing the incident ID parameter
 * @returns A NextResponse with the updated incident or error
 */
export async function PATCH(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `incidents/${id}`, "PATCH");
}
