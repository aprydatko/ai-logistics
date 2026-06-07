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
  "isActive",
  "status",
  "truckNumber",
  "trailerNumber",
  "page",
  "limit",
]);

export async function proxyDriverMutation(
  request: Request,
  path: string,
  method: "POST" | "PATCH" | "DELETE",
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null;

    if (!accessToken && refreshToken) {
      refreshedSession = await refreshSession(refreshToken);
      accessToken = refreshedSession?.accessToken;
    }

    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = method === "DELETE" ? undefined : await request.text();
    const sendRequest = (token: string): Promise<Response> =>
      fetch(`${API_BASE_URL}/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
        cache: "no-store",
      });

    let apiResponse = await sendRequest(accessToken);

    if (apiResponse.status === 401 && refreshToken && !refreshedSession) {
      refreshedSession = await refreshSession(refreshToken);
      if (refreshedSession) {
        apiResponse = await sendRequest(refreshedSession.accessToken);
      }
    }

    const responseBody: unknown = await apiResponse.json().catch(() => ({
      message: "Invalid drivers response",
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
      { message: "Drivers service unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  return proxyDriverMutation(request, "drivers", "POST");
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null;

    if (!accessToken && refreshToken) {
      refreshedSession = await refreshSession(refreshToken);
      accessToken = refreshedSession?.accessToken;
    }

    if (!accessToken) {
      const response = NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );

      if (refreshToken) {
        clearSessionCookies(response);
      }

      return response;
    }

    const requestUrl = new URL(request.url);
    const apiUrl = new URL(`${API_BASE_URL}/drivers`);

    requestUrl.searchParams.forEach((value, key) => {
      if (allowedQueryParameters.has(key)) {
        apiUrl.searchParams.set(key, value);
      }
    });

    let apiResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (apiResponse.status === 401 && refreshToken && !refreshedSession) {
      refreshedSession = await refreshSession(refreshToken);

      if (refreshedSession) {
        apiResponse = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${refreshedSession.accessToken}`,
          },
          cache: "no-store",
        });
      }
    }

    const body: unknown = await apiResponse.json().catch(() => ({
      message: "Invalid drivers response",
    }));
    const response = NextResponse.json(body, { status: apiResponse.status });

    if (refreshedSession) {
      setSessionCookies(response, refreshedSession);
    } else if (apiResponse.status === 401 && refreshToken) {
      clearSessionCookies(response);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Drivers service unavailable" },
      { status: 503 },
    );
  }
}
