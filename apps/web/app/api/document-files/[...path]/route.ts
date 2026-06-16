import { NextResponse } from "next/server";

import { type PathRouteContext } from "@/lib/api/proxy-with-auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const uploadsBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * Handles GET requests to retrieve document files from the backend.
 *
 * Proxies file requests to the backend uploads directory and returns the file content
 * with appropriate headers. Used for previewing uploaded documents.
 *
 * @param _request - The incoming request (unused)
 * @param context - Route context containing the file path segments
 * @returns A NextResponse with the file content or error
 */
export const GET = async (
  _request: Request,
  context: PathRouteContext,
): Promise<NextResponse> => {
  const { path } = await context.params;
  const upstreamUrl = `${uploadsBaseUrl}/uploads/${path.join("/")}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, { cache: "no-store" });
    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: "Document file not found" },
        { status: upstreamResponse.status },
      );
    }

    const body = Buffer.from(await upstreamResponse.arrayBuffer());
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type":
          upstreamResponse.headers.get("content-type") ??
          "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Document file preview unavailable" },
      { status: 503 },
    );
  }
};
