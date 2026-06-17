import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

export const GET = (_request: Request): Promise<NextResponse> =>
  proxyWithAuth(_request, "notifications", "GET");
