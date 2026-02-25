import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createCorsHeaders, isOriginAllowed } from "@/lib/http/cors";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, UserStatusResponse } from "@/types/api";

const querySchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.email().optional(),
});

const defaultUpgradeLink = process.env.PRO_UPGRADE_LINK ?? null;
const hubBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const defaultLoginLink = process.env.LOGIN_LINK ?? `${hubBaseUrl}/auth/login`;
const defaultOnboardingLink = process.env.ONBOARDING_LINK ?? `${hubBaseUrl}/onboarding`;

export const OPTIONS = (request: NextRequest): NextResponse => {
  const origin = request.headers.get("origin");

  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json(
      {
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      } satisfies ApiErrorResponse,
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
      {
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      } satisfies ApiErrorResponse,
      {
        status: 403,
        headers: createCorsHeaders(origin),
      },
    );
  }

  const parsedQuery = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        code: "INVALID_QUERY",
      } satisfies ApiErrorResponse,
      {
        status: 400,
        headers: createCorsHeaders(origin),
      },
    );
  }

  const { userId, email } = parsedQuery.data;

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      const anonymousResponse: UserStatusResponse = {
        status: "ANONYMOUS",
        code: "AUTH_REQUIRED",
        link: defaultLoginLink,
        onboardingRequired: true,
        onboardingLink: defaultOnboardingLink,
      };

      return NextResponse.json(anonymousResponse, {
        status: 200,
        headers: {
          ...createCorsHeaders(origin),
          "Cache-Control": "no-store",
        },
      });
    }

    let status: UserStatusResponse["status"] = "FREE";

    const resolvedUserId = session.user.id ?? userId;
    const resolvedEmail = session.user.email ?? email;

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
      onboardingRequired: status === "FREE",
      onboardingLink: status === "FREE" ? defaultOnboardingLink : null,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...createCorsHeaders(origin),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } satisfies ApiErrorResponse,
      {
        status: 500,
        headers: createCorsHeaders(origin),
      },
    );
  }
};