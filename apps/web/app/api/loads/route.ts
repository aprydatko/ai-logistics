import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

const allowedQueryParameters = new Set([
  "search",
  "status",
  "driverId",
  "pickupFrom",
  "pickupTo",
  "page",
  "limit",
]);

/**
 * Handles GET requests to list loads with filtering and pagination.
 *
 * Proxies the request to the backend loads endpoint with query parameter filtering.
 * Supports filtering by search, status, driverId, pickupFrom, pickupTo, page, and limit.
 *
 * @param request - The incoming Next.js request with query parameters
 * @returns A NextResponse with the loads list or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "loads",
    "GET",
    allowedQueryParameters,
    "Loads service unavailable",
  );

/**
 * Handles POST requests to create a new load.
 *
 * Proxies the request to the backend loads endpoint with the load data.
 *
 * @param request - The incoming Next.js request with load data in the body
 * @returns A NextResponse with the created load or error
 */
export const POST = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "loads", "POST");
