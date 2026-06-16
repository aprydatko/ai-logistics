import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles PATCH requests to update a specific load by ID.
 *
 * @param request - The incoming Next.js request with update data in the body
 * @param context - Route context containing the load ID parameter
 * @returns A NextResponse with the updated load or error
 */
export async function PATCH(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `loads/${id}`, "PATCH");
}
