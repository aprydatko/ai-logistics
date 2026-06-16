import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../route";

/**
 * Handles POST requests to upload a document.
 * Proxies the request to the backend documents upload endpoint.
 *
 * @param request - The incoming Next.js request with document file data
 * @returns A NextResponse with the uploaded document details or error
 */
export const POST = (request: Request): Promise<NextResponse> =>
  proxyDocumentRequest(request, "documents/upload", "POST");
