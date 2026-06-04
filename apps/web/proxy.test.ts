import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

const APP_URL = "https://app.example.com";

const createRequest = (path: string, accessToken?: string): NextRequest => {
  const headers = new Headers();

  if (accessToken) {
    headers.set("cookie", `access_token=${accessToken}`);
  }

  return new NextRequest(`${APP_URL}${path}`, { headers });
};

describe("proxy", () => {
  it("redirects dashboard requests without an access token to login", () => {
    const response = proxy(createRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${APP_URL}/login?next=%2Fdashboard`,
    );
  });

  it("preserves the dashboard subpath in the login next parameter", () => {
    const response = proxy(createRequest("/dashboard/loads"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${APP_URL}/login?next=%2Fdashboard%2Floads`,
    );
  });

  it("allows dashboard requests with an access token", () => {
    const response = proxy(createRequest("/dashboard", "access-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects authenticated login requests to dashboard", () => {
    const response = proxy(createRequest("/login", "access-token"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${APP_URL}/dashboard`);
  });

  it("redirects authenticated register requests to dashboard", () => {
    const response = proxy(createRequest("/register", "access-token"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${APP_URL}/dashboard`);
  });

  it("allows auth routes without an access token", () => {
    const loginResponse = proxy(createRequest("/login"));
    const registerResponse = proxy(createRequest("/register"));

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers.get("location")).toBeNull();
    expect(registerResponse.status).toBe(200);
    expect(registerResponse.headers.get("location")).toBeNull();
  });

  it("matches only protected dashboard and auth routes", () => {
    expect(config.matcher).toEqual(["/dashboard/:path*", "/login", "/register"]);
  });
});
