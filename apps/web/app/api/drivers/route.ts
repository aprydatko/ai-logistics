import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

const allowedQueryParameters = new Set([
  "search",
  "isActive",
  "status",
  "truckNumber",
  "trailerNumber",
  "page",
  "limit",
]);

/**
 * Handles POST requests to create a new driver.
 *
 * Proxies the request to the backend drivers endpoint with the driver data.
 *
 * @param request - The incoming Next.js request with driver data in the body
 * @returns A NextResponse with the created driver or error
 */
export async function POST(request: Request): Promise<NextResponse> {
  return proxyWithAuth(request, "drivers", "POST");
}

/**
 * Handles GET requests to list drivers with filtering and pagination.
 *
 * Proxies the request to the backend drivers endpoint with query parameter filtering.
 * Supports filtering by search, isActive, status, truckNumber, trailerNumber, page, and limit.
 *
 * @param request - The incoming Next.js request with query parameters
 * @returns A NextResponse with the drivers list or error
 */
export async function GET(request: Request): Promise<NextResponse> {
  return proxyWithAuth(
    request,
    "drivers",
    "GET",
    allowedQueryParameters,
    "Drivers service unavailable",
  );
}
