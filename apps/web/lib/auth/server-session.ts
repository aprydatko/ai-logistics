import type { AuthResponseDto, User } from "@repo/shared";
import type { NextResponse } from "next/server";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "dispatcher", "manager", "driver"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<User>;

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: userSchema,
}) satisfies z.ZodType<AuthResponseDto>;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const refreshSession = async (
  refreshToken: string,
): Promise<AuthResponseDto | null> => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const body: unknown = await response.json().catch(() => null);
  const parsedResponse = authResponseSchema.safeParse(body);

  return parsedResponse.success ? parsedResponse.data : null;
};

export const setSessionCookies = (
  response: NextResponse,
  tokens: Pick<AuthResponseDto, "accessToken" | "refreshToken">,
): void => {
  response.cookies.set("access_token", tokens.accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set("refresh_token", tokens.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

export const clearSessionCookies = (response: NextResponse): void => {
  response.cookies.set("access_token", "", {
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set("refresh_token", "", {
    ...cookieOptions,
    maxAge: 0,
  });
};
