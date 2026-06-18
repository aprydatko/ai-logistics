import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";
import { type IdRouteContext } from "@/lib/api/proxy-with-auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

export const GET = async (
  _request: Request,
  context: IdRouteContext,
): Promise<NextResponse> => {
  const { id } = await context.params;

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

    const sendRequest = (token: string): Promise<Response> =>
      fetch(`${API_BASE_URL}/documents/${id}/file`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

    let apiResponse = await sendRequest(accessToken);

    if (apiResponse.status === 401 && refreshToken && !refreshedSession) {
      refreshedSession = await refreshSession(refreshToken);
      if (refreshedSession) {
        apiResponse = await sendRequest(refreshedSession.accessToken);
      }
    }

    if (!apiResponse.ok) {
      const responseBody: unknown = await apiResponse
        .json()
        .catch(() => ({ message: "Unable to load document file" }));
      const response = NextResponse.json(responseBody, {
        status: apiResponse.status,
      });
      if (refreshedSession) setSessionCookies(response, refreshedSession);
      else if (apiResponse.status === 401 && refreshToken)
        clearSessionCookies(response);
      return response;
    }

    const body = Buffer.from(await apiResponse.arrayBuffer());
    const response = new NextResponse(body, {
      status: apiResponse.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type":
          apiResponse.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition":
          apiResponse.headers.get("content-disposition") ?? "inline",
      },
    });

    if (refreshedSession) setSessionCookies(response, refreshedSession);
    return response;
  } catch {
    return NextResponse.json(
      { message: "Document file preview unavailable" },
      { status: 503 },
    );
  }
};
