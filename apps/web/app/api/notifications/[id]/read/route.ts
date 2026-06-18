import { NextResponse } from "next/server";

import { proxyWithAuth, type IdRouteContext } from "@/lib/api/proxy-with-auth";

/**
 * PATCH /api/notifications/:id/read
 *
 * BFF proxy to `PATCH /api/notifications/:id/read` on the API. Marks a
 * single notification as read and broadcasts realtime updates to the owner.
 *
 * The `params` object is awaited because Next.js 15 exposes dynamic route
 * parameters as a Promise (see {@link IdRouteContext}).
 */
export async function PATCH(
  request: Request,
  context: IdRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyWithAuth(request, `notifications/${id}/read`, "PATCH");
}
