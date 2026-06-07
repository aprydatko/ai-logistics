import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

export async function GET(): Promise<NextResponse> {
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

    const loadCandidates = (token: string): Promise<Response> =>
      fetch(`${API_BASE_URL}/drivers/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    let apiResponse = await loadCandidates(accessToken);

    if (apiResponse.status === 401 && refreshToken && !refreshedSession) {
      refreshedSession = await refreshSession(refreshToken);
      if (refreshedSession) {
        apiResponse = await loadCandidates(refreshedSession.accessToken);
      }
    }

    const body: unknown = await apiResponse.json().catch(() => ({
      message: "Invalid driver candidates response",
    }));
    const response = NextResponse.json(body, { status: apiResponse.status });

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
