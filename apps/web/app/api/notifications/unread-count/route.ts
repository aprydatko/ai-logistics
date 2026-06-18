import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * GET /api/notifications/unread-count
 *
 * BFF proxy to `GET /api/notifications/unread-count` on the API. Returns
 * the number of unread notifications for the authenticated user; used by
 * the bell badge and realtime sync.
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/unread-count", "GET");
