import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * GET /api/notifications
 *
 * BFF proxy to `GET /api/notifications` on the API. Returns the most recent
 * 100 notifications for the authenticated user, newest first.
 */
export const GET = (_request: Request): Promise<NextResponse> =>
  proxyWithAuth(_request, "notifications", "GET");
