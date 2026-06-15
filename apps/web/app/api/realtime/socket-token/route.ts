import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

const toSocketBaseUrl = (): string => {
  const apiUrl = new URL(API_BASE_URL);
  apiUrl.pathname = "";
  apiUrl.search = "";
  apiUrl.hash = "";
  return apiUrl.toString().replace(/\/$/, "");
};

export async function POST(): Promise<NextResponse> {
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

    const socketTokenResponse = await fetch(
      `${API_BASE_URL}/auth/socket-token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!socketTokenResponse.ok) {
      const response = NextResponse.json(
        { message: "Unable to create socket token" },
        { status: socketTokenResponse.status },
      );
      if (socketTokenResponse.status === 401 && refreshToken) {
        clearSessionCookies(response);
      }
      return response;
    }

    const payload = await socketTokenResponse.json();
    const response = NextResponse.json({
      ...payload,
      socketUrl: toSocketBaseUrl(),
    });

    if (refreshedSession) setSessionCookies(response, refreshedSession);
    return response;
  } catch {
    return NextResponse.json(
      { message: "Realtime service unavailable" },
      { status: 503 },
    );
  }
}
