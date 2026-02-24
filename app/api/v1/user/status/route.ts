import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createCorsHeaders } from "@/lib/http/cors";
import { prisma } from "@/lib/prisma";
import type { UserStatusResponse } from "@/types/api";

const querySchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.email().optional(),
});

const defaultUpgradeLink = process.env.PRO_UPGRADE_LINK ?? null;

export const OPTIONS = (request: NextRequest): NextResponse => {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
};

export const GET = async (request: NextRequest): Promise<NextResponse<UserStatusResponse | { error: string }>> => {
  const origin = request.headers.get("origin");
  const { userId, email } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  let status: UserStatusResponse["status"] = "FREE";

  if (userId || email) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          userId ? { id: userId } : undefined,
          email ? { email } : undefined,
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