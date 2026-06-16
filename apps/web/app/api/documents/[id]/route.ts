import { NextResponse } from "next/server";

import { proxyDocumentRequest } from "../route";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Handles GET requests to retrieve a specific document by ID.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the document ID parameter
 * @returns A NextResponse with the document details or error
 */
export const GET = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}`, "GET");
};

/**
 * Handles PATCH requests to update a specific document by ID.
 *
 * @param request - The incoming Next.js request with update data in the body
 * @param context - Route context containing the document ID parameter
 * @returns A NextResponse with the updated document or error
 */
export const PATCH = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}`, "PATCH");
};

/**
 * Handles DELETE requests to remove a specific document by ID.
 *
 * @param request - The incoming Next.js request
 * @param context - Route context containing the document ID parameter
 * @returns A NextResponse confirming deletion or error
 */
export const DELETE = async (
  request: Request,
  context: RouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;
  return proxyDocumentRequest(request, `documents/${id}`, "DELETE");
};
