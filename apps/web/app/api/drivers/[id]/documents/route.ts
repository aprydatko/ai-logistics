import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * Handles POST requests to add a document to a specific driver.
 *
 * @param request - The incoming Next.js request with document data
 * @param context - Route context containing the driver ID parameter
 * @returns A NextResponse with the added document or error
 */
export async function POST(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `drivers/${id}/documents`, "POST");
}
