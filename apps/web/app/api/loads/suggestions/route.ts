import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve dashboard suggestions.
 *
 * Proxies the request to the backend loads suggestions endpoint with authentication.
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse with dashboard suggestions data or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "loads/suggestions",
    "GET",
    undefined,
    "Load suggestions service unavailable",
  );
