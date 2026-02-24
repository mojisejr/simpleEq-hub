import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createCorsHeaders, isOriginAllowed } from "@/lib/http/cors";
import { prisma } from "@/lib/prisma";
import type { UserStatusResponse } from "@/types/api";

const querySchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.email().optional(),
});

const defaultUpgradeLink = process.env.PRO_UPGRADE_LINK ?? null;

export const OPTIONS = (request: NextRequest): NextResponse => {
  const origin = request.headers.get("origin");

  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: "Origin not allowed" },
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

export const GET = async (request: NextRequest): Promise<NextResponse<UserStatusResponse | { error: string }>> => {
  const origin = request.headers.get("origin");

  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: "Origin not allowed" },
      {
        status: 403,
        headers: createCorsHeaders(origin),
      },
    );
  }

  const { userId, email } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  let status: UserStatusResponse["status"] = "FREE";

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const resolvedUserId = session?.user?.id ?? userId;
  const resolvedEmail = session?.user?.email ?? email;

  if (resolvedUserId || resolvedEmail) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          resolvedUserId ? { id: resolvedUserId } : undefined,
          resolvedEmail ? { email: resolvedEmail } : undefined,
        ].filter(Boolean) as { id?: string; email?: string }[],
      },
      select: {
        subscriptionStatus: true,
      },
    });

    if (user?.subscriptionStatus === "PRO") {
      status = "PRO";
    }
  }

  const response: UserStatusResponse = {
    status,
    link: status === "FREE" ? defaultUpgradeLink : null,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
};