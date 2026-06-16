import type { AuthResponseDto, RegisterDto, User } from "@repo/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
}) satisfies z.ZodType<RegisterDto>;

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
 * Handles POST requests to register a new user account.
 *
 * Creates a new user account with the provided information and automatically
 * signs them in by setting session cookies.
 *
 * @param request - The incoming request with registration data (firstName, lastName, email, password)
 * @returns A NextResponse with user data on success or error message on failure
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = registerSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { message: "Invalid registration request" },
      { status: 400 },
    );
  }

  try {
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedRequest.data),
      cache: "no-store",
    });

    if (!registerResponse.ok) {
      return NextResponse.json(
        { message: "Unable to create account" },
        { status: registerResponse.status === 409 ? 409 : 502 },
      );
    }

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsedRequest.data.email,
        password: parsedRequest.data.password,
      }),
      cache: "no-store",
    });

    if (!loginResponse.ok) {
      return NextResponse.json(
        { message: "Account created, but automatic sign-in failed" },
        { status: 502 },
      );
    }

    const loginBody: unknown = await loginResponse.json().catch(() => null);
    const parsedLogin = authResponseSchema.safeParse(loginBody);

    if (!parsedLogin.success) {
      return NextResponse.json(
        { message: "Invalid authentication response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ user: parsedLogin.data.user });
    response.cookies.set("access_token", parsedLogin.data.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    response.cookies.set("refresh_token", parsedLogin.data.refreshToken, {
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
