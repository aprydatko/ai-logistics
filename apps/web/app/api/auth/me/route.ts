import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
      clearSessionCookies(response);
      return response;
    }

    const refreshedSession = await refreshSession(refreshToken);

    if (!refreshedSession) {
      const response = NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
      clearSessionCookies(response);
      return response;
    }

    const response = NextResponse.json({ user: refreshedSession.user });
    setSessionCookies(response, refreshedSession);
    return response;
  } catch {
    return NextResponse.json(
      { message: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
