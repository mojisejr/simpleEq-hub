import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const middleware = async (request: NextRequest): Promise<NextResponse> => {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    const loginURL = new URL("/auth/login", request.url);
    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    loginURL.searchParams.set("callbackURL", callbackPath);

    return NextResponse.redirect(loginURL);
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/admin/:path*"],
};