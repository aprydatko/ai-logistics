import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve a specific driver by ID.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the driver ID parameter
 * @returns A NextResponse with the driver details or error
 */
export async function GET(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `drivers/${id}`, "GET");
}

/**
 * Handles PATCH requests to update a specific driver by ID.
 *
 * @param request - The incoming Next.js request with update data in the body
 * @param context - Route context containing the driver ID parameter
 * @returns A NextResponse with the updated driver or error
 */
export async function PATCH(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `drivers/${id}`, "PATCH");
}

/**
 * Handles DELETE requests to remove a specific driver by ID.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the driver ID parameter
 * @returns A NextResponse confirming deletion or error
 */
export async function DELETE(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `drivers/${id}`, "DELETE");
}
