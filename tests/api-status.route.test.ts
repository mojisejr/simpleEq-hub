import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findFirstMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: findFirstMock,
    },
  },
}));

describe("/api/v1/user/status route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PRO_UPGRADE_LINK: "https://facebook.com/simple-eq-upgrade",
      LOGIN_LINK: "http://localhost:3000/auth/login",
      ONBOARDING_LINK: "http://localhost:3000/onboarding",
      BETTER_AUTH_URL: "http://localhost:3000",
      ALLOWED_EXTENSION_ORIGINS: "http://localhost:3000,chrome-extension://abc123",
    };
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("returns ANONYMOUS with auth-required code when session is missing", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/v1/user/status/route");

    const request = new NextRequest("http://localhost:3000/api/v1/user/status");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ANONYMOUS",
      code: "AUTH_REQUIRED",
      link: "http://localhost:3000/auth/login",
      onboardingRequired: true,
      onboardingLink: "http://localhost:3000/onboarding",
    });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("returns PRO with null link when user is PRO", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user_001",
        email: "pro@simpleeq.dev",
      },
    });
    findFirstMock.mockResolvedValue({ subscriptionStatus: "PRO", hasOnboarded: true });

    const { GET } = await import("@/app/api/v1/user/status/route");
    const request = new NextRequest("http://localhost:3000/api/v1/user/status");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "PRO",
      link: null,
      onboardingRequired: false,
      onboardingLink: null,
    });
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        OR: [{ id: "user_001" }, { email: "pro@simpleeq.dev" }],
      },
      select: {
        subscriptionStatus: true,
      },
    });
  });

  it("returns FREE with onboarding required when user has not onboarded", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user_002",
        email: "free@simpleeq.dev",
      },
    });
    findFirstMock.mockResolvedValue({ subscriptionStatus: "FREE", hasOnboarded: false });

    const { GET } = await import("@/app/api/v1/user/status/route");
    const request = new NextRequest("http://localhost:3000/api/v1/user/status");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "FREE",
      link: "https://facebook.com/simple-eq-upgrade",
      onboardingRequired: true,
      onboardingLink: "http://localhost:3000/onboarding",
    });
  });

  it("returns FREE with onboarding required even when user already onboarded", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user_003",
        email: "free-ready@simpleeq.dev",
      },
    });
    findFirstMock.mockResolvedValue({ subscriptionStatus: "FREE", hasOnboarded: true });

    const { GET } = await import("@/app/api/v1/user/status/route");
    const request = new NextRequest("http://localhost:3000/api/v1/user/status");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "FREE",
      link: "https://facebook.com/simple-eq-upgrade",
      onboardingRequired: true,
      onboardingLink: "http://localhost:3000/onboarding",
    });
  });

  it("handles OPTIONS with CORS headers", async () => {
    const { OPTIONS } = await import("@/app/api/v1/user/status/route");
    const request = new NextRequest("http://localhost:3000/api/v1/user/status", {
      method: "OPTIONS",
      headers: {
        origin: "chrome-extension://abc123",
      },
    });

    const response = OPTIONS(request);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("chrome-extension://abc123");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("rejects GET from disallowed origin", async () => {
    const { GET } = await import("@/app/api/v1/user/status/route");

    const request = new NextRequest("http://localhost:3000/api/v1/user/status", {
      headers: {
        origin: "chrome-extension://not-allowed",
      },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Origin not allowed", code: "ORIGIN_NOT_ALLOWED" });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("null");
  });

  it("rejects OPTIONS from disallowed origin", async () => {
    const { OPTIONS } = await import("@/app/api/v1/user/status/route");

    const request = new NextRequest("http://localhost:3000/api/v1/user/status", {
      method: "OPTIONS",
      headers: {
        origin: "chrome-extension://not-allowed",
      },
    });

    const response = OPTIONS(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Origin not allowed", code: "ORIGIN_NOT_ALLOWED" });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("null");
  });

  it("returns 400 for invalid email query", async () => {
    const { GET } = await import("@/app/api/v1/user/status/route");

    const request = new NextRequest("http://localhost:3000/api/v1/user/status?email=not-an-email", {
      headers: {
        origin: "http://localhost:3000",
      },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Invalid query parameters",
      code: "INVALID_QUERY",
    });
  });
});