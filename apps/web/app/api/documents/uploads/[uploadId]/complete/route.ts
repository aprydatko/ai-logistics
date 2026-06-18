import { NextResponse } from "next/server";

import { proxyWithAuth } from "@/lib/api/proxy-with-auth";

type UploadRouteContext = { params: Promise<{ uploadId: string }> };

export const POST = async (
  request: Request,
  context: UploadRouteContext,
): Promise<NextResponse> => {
  const { uploadId } = await context.params;
  return proxyWithAuth(
    request,
    `documents/uploads/${uploadId}/complete`,
    "POST",
  );
};
