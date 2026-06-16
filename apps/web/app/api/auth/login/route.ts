import type { AuthResponseDto, LoginDto, User } from "@repo/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
}) satisfies z.ZodType<LoginDto>;

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

/**
 * Handles POST requests to authenticate a user with email and password.
 *
 * Validates credentials against the backend API and sets session cookies
 * with access and refresh tokens upon successful authentication.
 *
 * @param request - The incoming request with email and password in the body
 * @returns A NextResponse with user data on success or error message on failure
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = loginSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { message: "Invalid login request" },
      { status: 400 },
    );
  }

  try {
    const apiResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedRequest.data),
      cache: "no-store",
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: apiResponse.status === 401 ? 401 : 502 },
      );
    }

    const apiBody: unknown = await apiResponse.json().catch(() => null);
    const parsedResponse = authResponseSchema.safeParse(apiBody);

    if (!parsedResponse.success) {
      return NextResponse.json(
        { message: "Invalid authentication response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ user: parsedResponse.data.user });
    response.cookies.set("access_token", parsedResponse.data.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    response.cookies.set("refresh_token", parsedResponse.data.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
