import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

export const GET = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/preferences", "GET");

export const PATCH = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/preferences", "PATCH");
