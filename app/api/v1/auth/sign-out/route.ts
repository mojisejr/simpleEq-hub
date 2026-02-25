import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createCorsHeaders, isOriginAllowed } from "@/lib/http/cors";

const createNoStoreHeaders = (origin: string | null): HeadersInit => ({
  ...createCorsHeaders(origin),
  "Cache-Control": "no-store",
});

export const OPTIONS = (request: NextRequest): NextResponse => {
  const origin = request.headers.get("origin");

  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json(
      {
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      },
      {
        status: 403,
        headers: createCorsHeaders(origin),
      },
    );
  }

  return new NextResponse(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const origin = request.headers.get("origin");

  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json(
      {
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      },
      {
        status: 403,
        headers: createCorsHeaders(origin),
      },
    );
  }

  try {
    await auth.api.signOut({
      headers: request.headers,
    });

    return NextResponse.json(
      {
        ok: true,
      },
      {
        status: 200,
        headers: createNoStoreHeaders(origin),
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Logout failed",
        code: "LOGOUT_FAILED",
      },
      {
        status: 500,
        headers: createNoStoreHeaders(origin),
      },
    );
  }
};
