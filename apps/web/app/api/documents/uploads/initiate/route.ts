import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

export const POST = (request: Request): Promise<NextResponse> =>
  proxyWithAuth(request, "documents/uploads/initiate", "POST");
