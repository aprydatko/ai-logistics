import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve dashboard recent load and incident activity.
 *
 * Proxies the request to the backend loads activity endpoint with authentication.
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse with dashboard activity data or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "loads/activity",
    "GET",
    undefined,
    "Load activity service unavailable",
  );
