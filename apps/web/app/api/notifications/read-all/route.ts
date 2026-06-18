import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * PATCH /api/notifications/read-all
 *
 * BFF proxy to `PATCH /api/notifications/read-all` on the API. Marks every
 * unread notification of the authenticated user as read in a single
 * statement and broadcasts the new (zero) unread count via realtime.
 */
export const PATCH = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/read-all", "PATCH");
