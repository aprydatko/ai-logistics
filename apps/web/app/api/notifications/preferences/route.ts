import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

/**
 * GET /api/notifications/preferences
 *
 * BFF proxy to `GET /api/notifications/preferences` on the API. Returns
 * the per-category channel and email-frequency preferences for the
 * authenticated user (auto-created with defaults on first read).
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/preferences", "GET");

/**
 * PATCH /api/notifications/preferences
 *
 * BFF proxy to `PATCH /api/notifications/preferences` on the API. Replaces
 * the full preference set (per-category channels + email frequency).
 */
export const PATCH = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/preferences", "PATCH");
