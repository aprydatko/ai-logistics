import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Type definition for route context with a single ID parameter.
 */
export type IdRouteContext = { params: Promise<{ id: string }> };

/**
 * Type definition for route context with ID and documentId parameters.
 */
export type IdDocumentRouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

/**
 * Type definition for route context with path segments.
 */
export type PathRouteContext = { params: Promise<{ path: string[] }> };

/**
 * Proxies API requests to the backend service with authentication handling.
 *
 * This function manages JWT token authentication, automatic token refresh, and session
 * cookie management. Handles GET, POST, PUT, PATCH, and DELETE methods.
 * Filters query parameters to only allow whitelisted values for GET requests.
 *
 * @param request - The incoming Next.js request object
 * @param path - The API endpoint path to proxy to (e.g., "drivers", "drivers/123")
 * @param method - The HTTP method to use for the proxied request
 * @param allowedQueryParameters - Optional set of allowed query parameter names for GET requests
 * @param errorMessage - Optional custom error message for service unavailable errors
 * @returns A NextResponse with the proxied API response data and appropriate status code
 */
export async function proxyWithAuth(
  request: Request,
  path: string,
  method: HttpMethod,
  allowedQueryParameters?: Set<string>,
  errorMessage?: string,
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null;

    // Initial token check and refresh if needed
    if (!accessToken && refreshToken) {
      refreshedSession = await refreshSession(refreshToken);
      accessToken = refreshedSession?.accessToken;
    }

    if (!accessToken) {
      const response = NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
      if (refreshToken) clearSessionCookies(response);
      return response;
    }

    // Build API URL with query parameters for GET requests
    const apiUrl = new URL(`${API_BASE_URL}/${path}`);
    if (method === "GET" && allowedQueryParameters) {
      const requestUrl = new URL(request.url);
      requestUrl.searchParams.forEach((value, key) => {
        if (allowedQueryParameters.has(key)) {
          apiUrl.searchParams.set(key, value);
        }
      });
    }

    // Prepare body for non-GET/DELETE requests
    const contentType = request.headers.get("content-type");
    const body =
      method === "GET" || method === "DELETE"
        ? undefined
        : Buffer.from(await request.arrayBuffer());

    // Send request function
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
      refreshedSession = await refreshSession(refreshToken);
      if (refreshedSession) {
        apiResponse = await sendRequest(refreshedSession.accessToken);
      }
    }

    // Parse response body
    const responseBody: unknown = await apiResponse.json().catch(() => ({
      message: errorMessage || "Invalid API response",
    }));

    const response = NextResponse.json(responseBody, {
      status: apiResponse.status,
    });

    // Update session cookies if token was refreshed
    if (refreshedSession) setSessionCookies(response, refreshedSession);
    else if (apiResponse.status === 401 && refreshToken)
      clearSessionCookies(response);

    return response;
  } catch {
    return NextResponse.json(
      { message: errorMessage || "Service unavailable" },
      { status: 503 },
    );
  }
}
