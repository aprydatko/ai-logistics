import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../route";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}`, "GET");
};

export const PATCH = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}`, "PATCH");
};

export const DELETE = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}`, "DELETE");
};
