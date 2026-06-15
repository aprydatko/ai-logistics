import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const allowedQueryParameters = new Set([
  "model",
  "operation",
  "status",
  "from",
  "to",
  "page",
  "limit",
]);

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
      if (refreshToken) clearSessionCookies(response);
      return response;
    }

    const apiUrl = new URL(`${API_BASE_URL}/ai-logs`);
    new URL(request.url).searchParams.forEach((value, key) => {
      if (allowedQueryParameters.has(key)) {
        apiUrl.searchParams.set(key, value);
      }
    });

    const sendRequest = (token: string): Promise<Response> =>
      fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      message: "Invalid AI logs response",
    }));
    const response = NextResponse.json(responseBody, {
      status: apiResponse.status,
    });

    if (refreshedSession) setSessionCookies(response, refreshedSession);
    else if (apiResponse.status === 401 && refreshToken) {
      clearSessionCookies(response);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "AI logs service unavailable" },
      { status: 503 },
    );
  }
}
