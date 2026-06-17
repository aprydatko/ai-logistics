import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

export const PATCH = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "notifications/read-all", "PATCH");
