import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve dashboard load metrics.
 *
 * Proxies the request to the backend loads metrics endpoint with authentication.
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse with load metrics data or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "loads/metrics",
    "GET",
    undefined,
    "Load metrics service unavailable",
  );
