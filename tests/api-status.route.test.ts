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
      ALLOWED_EXTENSION_ORIGINS: "http://localhost:3000,chrome-extension://abc123",
    };
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("returns FREE with upgrade link when session is missing", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/v1/user/status/route");

    const request = new NextRequest("http://localhost:3000/api/v1/user/status");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "FREE",
      link: "https://facebook.com/simple-eq-upgrade",
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
    findFirstMock.mockResolvedValue({ subscriptionStatus: "PRO" });

    const { GET } = await import("@/app/api/v1/user/status/route");
    const request = new NextRequest("http://localhost:3000/api/v1/user/status");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "PRO", link: null });
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        OR: [{ id: "user_001" }, { email: "pro@simpleeq.dev" }],
      },
      select: {
        subscriptionStatus: true,
      },
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
    expect(body).toEqual({ error: "Origin not allowed" });
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
    expect(body).toEqual({ error: "Origin not allowed" });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("null");
  });
});