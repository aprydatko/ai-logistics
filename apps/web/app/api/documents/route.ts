import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const allowedQueryParameters = new Set([
  "search",
  "driverId",
  "loadId",
  "type",
  "status",
  "sortBy",
  "sortOrder",
  "page",
  "limit",
]);

/**
 * Proxies document API requests to the backend service with authentication handling.
 *
 * This function manages JWT token authentication, automatic token refresh, and session
 * cookie management. It filters query parameters to only allow whitelisted values and
 * handles request/response forwarding between the Next.js app and the backend API.
 *
 * @param request - The incoming Next.js request object
 * @param path - The API endpoint path to proxy to (e.g., "documents", "documents/123")
 * @param method - The HTTP method to use for the proxied request
 * @returns A NextResponse with the proxied API response data and appropriate status code
 *
 * @example
 * ```ts
 * // Proxy a GET request to list documents
 * const response = await proxyDocumentRequest(request, "documents", "GET");
 *
 * // Proxy a POST request to create a document
 * const response = await proxyDocumentRequest(request, "documents", "POST");
 * ```
 */
export const proxyDocumentRequest = async (
  request: Request,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
): Promise<NextResponse> => {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null;

    // Helper function to attempt token refresh
    const attemptTokenRefresh = async (): Promise<boolean> => {
      if (!refreshToken || refreshedSession) return false;
      refreshedSession = await refreshSession(refreshToken);
      if (refreshedSession?.accessToken) {
        accessToken = refreshedSession.accessToken;
        return true;
      }
      return false;
    };

    // Initial token check and refresh if needed
    if (!accessToken && refreshToken) {
      await attemptTokenRefresh();
    }
    if (!accessToken) {
      const response = NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
      if (refreshToken) clearSessionCookies(response);
      return response;
    }

    const apiUrl = new URL(`${API_BASE_URL}/${path}`);
    if (method === "GET") {
      const requestUrl = new URL(request.url);
      requestUrl.searchParams.forEach((value, key) => {
        if (allowedQueryParameters.has(key))
          apiUrl.searchParams.set(key, value);
      });
    }
    const contentType = request.headers.get("content-type");
    const body =
      method === "POST" || method === "PATCH"
        ? Buffer.from(await request.arrayBuffer())
        : undefined;

    const sendRequest = (token: string): Promise<Response> =>
      fetch(apiUrl, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body && contentType ? { "Content-Type": contentType } : {}),
        },
        body,
        cache: "no-store",
      });

    let apiResponse = await sendRequest(accessToken);

    // Retry with refreshed token if initial request fails with 401
    if (apiResponse.status === 401 && refreshToken && !refreshedSession) {
      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        apiResponse = await sendRequest(accessToken);
      }
    }

    const responseBody: unknown = await apiResponse.json().catch(() => ({
      message: "Invalid documents response",
    }));
    const response = NextResponse.json(responseBody, {
      status: apiResponse.status,
    });
    if (refreshedSession) setSessionCookies(response, refreshedSession);
    else if (apiResponse.status === 401 && refreshToken)
      clearSessionCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      { message: "Documents service unavailable" },
      { status: 503 },
    );
  }
};

/**
 * Handles GET requests to list documents.
 * Proxies the request to the backend documents endpoint with query parameter filtering.
 *
 * @param request - The incoming Next.js request
 * @returns A NextResponse with the documents list or error
 */
export const GET = (request: Request): Promise<NextResponse> =>
  proxyDocumentRequest(request, "documents", "GET");

/**
 * Handles POST requests to create a new document.
 * Proxies the request to the backend documents endpoint with the document data.
 *
 * @param request - The incoming Next.js request with document data in the body
 * @returns A NextResponse with the created document or error
 */
export const POST = (request: Request): Promise<NextResponse> =>
  proxyDocumentRequest(request, "documents", "POST");
