import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const DASHBOARD_PATH_PREFIX = "/dashboard";

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const isDashboardRoute =
    pathname === DASHBOARD_PATH_PREFIX ||
    pathname.startsWith(`${DASHBOARD_PATH_PREFIX}/`);

  if (isDashboardRoute && !accessToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ROUTES.has(pathname) && accessToken) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = DASHBOARD_PATH_PREFIX;
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
