import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles PUT requests to update a driver's vehicle information.
 *
 * @param request - The incoming Next.js request with vehicle data
 * @param context - Route context containing the driver ID parameter
 * @returns A NextResponse with the updated vehicle information or error
 */
export async function PUT(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `drivers/${id}/vehicle`, "PUT");
}
