import { NextResponse } from "next/server";

import {
  proxyWithAuth,
  type IdDocumentRouteContext,
} from "@/lib/api/proxy-with-auth";

/**
 * Handles DELETE requests to remove a specific document from a driver.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the driver ID and document ID parameters
 * @returns A NextResponse confirming deletion or error
 */
export async function DELETE(
  request: Request,
  context: IdDocumentRouteContext,
): Promise<NextResponse> {
  const { id, documentId } = await context.params;
  return proxyWithAuth(
    request,
    `drivers/${id}/documents/${documentId}`,
    "DELETE",
  );
}
