import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createCorsHeadersForProduct, isOriginAllowedForProduct } from "@/lib/http/cors";

const createNoStoreHeaders = async (origin: string | null, productSlug?: string): Promise<HeadersInit> => ({
  ...(await createCorsHeadersForProduct(origin, productSlug)),
  "Cache-Control": "no-store",
});

const getRequestProductSlug = (request: NextRequest): string | undefined => {
  const product = request.nextUrl.searchParams.get("product")?.trim();
  return product && product.length > 0 ? product : undefined;
};

export const OPTIONS = async (request: NextRequest): Promise<NextResponse> => {
  const origin = request.headers.get("origin");
  const productSlug = getRequestProductSlug(request);

  if (origin && !(await isOriginAllowedForProduct(origin, productSlug))) {
    return NextResponse.json(
      {
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      },
      {
        status: 403,
        headers: await createCorsHeadersForProduct(origin, productSlug),
      },
    );
  }

  return new NextResponse(null, {
    status: 204,
    headers: await createCorsHeadersForProduct(origin, productSlug),
  });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const origin = request.headers.get("origin");
  const productSlug = getRequestProductSlug(request);

  if (origin && !(await isOriginAllowedForProduct(origin, productSlug))) {
    return NextResponse.json(
      {
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      },
      {
        status: 403,
        headers: await createCorsHeadersForProduct(origin, productSlug),
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
        headers: await createNoStoreHeaders(origin, productSlug),
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
        headers: await createNoStoreHeaders(origin, productSlug),
      },
    );
  }
};
