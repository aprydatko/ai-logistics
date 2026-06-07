import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

const allowedQueryParameters = new Set([
  "search",
  "isActive",
  "status",
  "truckNumber",
  "trailerNumber",
  "page",
  "limit",
]);

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestUrl = new URL(request.url);
    const apiUrl = new URL(`${API_BASE_URL}/drivers`);

    requestUrl.searchParams.forEach((value, key) => {
      if (allowedQueryParameters.has(key)) {
        apiUrl.searchParams.set(key, value);
      }
    });

    const apiResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    const body: unknown = await apiResponse.json().catch(() => ({
      message: "Invalid drivers response",
    }));

    return NextResponse.json(body, { status: apiResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Drivers service unavailable" },
      { status: 503 },
    );
  }
}
