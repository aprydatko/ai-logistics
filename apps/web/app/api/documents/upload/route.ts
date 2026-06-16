import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../route";

export const POST = (request: Request): Promise<NextResponse> =>
  proxyDocumentRequest(request, "documents/upload", "POST");
