import { NextResponse } from "next/server";

import { createNoStoreHeaders } from "@/lib/http/cache-control";

export function middleware() {
  const response = NextResponse.next();
  const headers = createNoStoreHeaders();

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/onboarding/:path*", "/api/v1/user/status"],
};
