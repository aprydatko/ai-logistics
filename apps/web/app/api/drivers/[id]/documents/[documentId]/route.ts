import { NextResponse } from "next/server";

import { proxyDriverMutation } from "../../../route";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
): Promise<NextResponse> {
  const { id, documentId } = await context.params;
  return proxyDriverMutation(
    request,
    `drivers/${id}/documents/${documentId}`,
    "DELETE",
  );
}
