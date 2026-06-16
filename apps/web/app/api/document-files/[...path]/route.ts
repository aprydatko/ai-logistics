import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const uploadsBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export const GET = async (
  _request: Request,
  context: RouteContext,
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
