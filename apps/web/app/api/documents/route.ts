import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

const allowedQueryParameters = new Set([
  "search",
  "driverId",
  "loadId",
  "type",
  "status",
  "sortBy",
  "sortOrder",
  "page",
  "limit",
]);

/**
 * Handles GET requests to list documents.
 * Proxies the request to the backend documents endpoint with query parameter filtering.
 *
 * @param request - The incoming Next.js request
 * @returns A NextResponse with the documents list or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "documents",
    "GET",
    allowedQueryParameters,
    "Documents service unavailable",
  );

/**
 * Handles POST requests to create a new document.
 * Proxies the request to the backend documents endpoint with the document data.
 *
 * @param request - The incoming Next.js request with document data in the body
 * @returns A NextResponse with the created document or error
 */
export const POST = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "documents", "POST");
