import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/lib/auth/server-session";

/**
 * Handles POST requests to log out the current user.
 *
 * Clears the session cookies (access_token and refresh_token) to end the user's session.
 *
 * @returns A NextResponse confirming successful logout
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);

  return response;
}
