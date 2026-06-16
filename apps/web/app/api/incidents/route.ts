import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

const allowedQueryParameters = new Set([
  "search",
  "type",
  "priority",
  "status",
  "loadId",
  "driverId",
  "occurredFrom",
  "occurredTo",
  "sortBy",
  "sortOrder",
  "page",
  "limit",
]);

/**
 * Handles GET requests to list incidents with filtering and pagination.
 *
 * Proxies the request to the backend incidents endpoint with query parameter filtering.
 * Supports filtering by search, type, priority, status, loadId, driverId, occurredFrom, occurredTo, sortBy, sortOrder, page, and limit.
 *
 * @param request - The incoming Next.js request with query parameters
 * @returns A NextResponse with the incidents list or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(
    request,
    "incidents",
    "GET",
    allowedQueryParameters,
    "Incidents service unavailable",
  );

/**
 * Handles POST requests to create a new incident.
 *
 * Proxies the request to the backend incidents endpoint with the incident data.
 *
 * @param request - The incoming Next.js request with incident data in the body
 * @returns A NextResponse with the created incident or error
 */
export const POST = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "incidents", "POST");
