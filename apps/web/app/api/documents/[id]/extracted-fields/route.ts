import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../../route";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Handles PATCH requests to update extracted fields for a specific document.
 *
 * @param request - The incoming Next.js request with extracted field data
 * @param context - Route context containing the document ID parameter
 * @returns A NextResponse with the updated extracted fields or error
 */
export const PATCH = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(
    request,
    `documents/${id}/extracted-fields`,
    "PATCH",
  );
};
