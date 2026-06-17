import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

type AssistantJobRouteContext = {
  params: Promise<{ jobId: string }>;
};

export const GET = async (
  request: Request,
  context: AssistantJobRouteContext,
): Promise<NextResponse> => {
  const { jobId } = await context.params;
  return proxyWithAuth(request, `assistant/jobs/${jobId}`, "GET");
};
