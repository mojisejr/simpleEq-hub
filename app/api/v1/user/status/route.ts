import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createCorsHeaders, isOriginAllowed } from "@/lib/http/cors";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, UserStatusResponse } from "@/types/api";

const querySchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.email().optional(),
  product: z.string().min(1).optional(), // Defaults to 'simple-eq' for legacy calls
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

  const { userId, email, product: productSlug } = parsedQuery.data;
  // Default to 'simple-eq' for legacy backward compatibility
  const targetProductSlug = productSlug ?? "simple-eq";

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
          licenses: {
            where: {
              product: { slug: targetProductSlug },
              isActive: true, // Must be active
              OR: [
                { expiresAt: null }, // Lifetime
                { expiresAt: { gt: new Date() } }, // Not expired
              ],
            },
            take: 1, // We only need 1 valid license
            select: {
              id: true,
              expiresAt: true,
            },
          },
        },
      });

      // Priority 1: Check Specific License (The Robust Nexus Way)
      if (user?.licenses && user.licenses.length > 0) {
        status = "PRO";
      } 
      // Priority 2: Legacy Fallback (Only for 'simple-eq' for backward compatibility)
      else if (targetProductSlug === "simple-eq" && user?.subscriptionStatus === "PRO") {
        status = "PRO";
      }
    }

    const response: UserStatusResponse = {
      status,
      link: status === "FREE" ? defaultUpgradeLink : null,
      onboardingRequired: status === "FREE",
      onboardingLink: status === "FREE" ? defaultOnboardingLink : null,
      product: targetProductSlug,
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