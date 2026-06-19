import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * Handles GET requests to retrieve dashboard active load map data.
 *
 * Proxies the request to the backend loads map endpoint with authentication.
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse with dashboard map data or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "loads/map",
    "GET",
    undefined,
    "Load map service unavailable",
  );
