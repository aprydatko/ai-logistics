import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

const allowedQueryParameters = new Set(["cursor", "limit"]);

/**
 * GET /api/notifications
 *
 * BFF proxy to `GET /api/notifications` on the API. Returns the authenticated
 * user's notification feed with cursor pagination metadata.
 */
export const GET = (_request: Request): Promise<NextResponse> =>
  proxyWithAuth(_request, "notifications", "GET", allowedQueryParameters);
