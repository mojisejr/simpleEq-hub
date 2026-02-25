import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signOutMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signOut: signOutMock,
    },
  },
}));

describe("/api/v1/auth/sign-out route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_ORIGINS: "http://localhost:3000",
      ALLOWED_EXTENSION_IDS: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    };
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("accepts OPTIONS preflight for allowed origin with POST support", async () => {
    const { OPTIONS } = await import("@/app/api/v1/auth/sign-out/route");

    const request = new NextRequest("http://localhost:3000/api/v1/auth/sign-out", {
      method: "OPTIONS",
      headers: {
        origin: "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    });

    const response = OPTIONS(request);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("rejects POST from disallowed origin", async () => {
    const { POST } = await import("@/app/api/v1/auth/sign-out/route");

    const request = new NextRequest("http://localhost:3000/api/v1/auth/sign-out", {
      method: "POST",
      headers: {
        origin: "chrome-extension://not-allowed",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Origin not allowed", code: "ORIGIN_NOT_ALLOWED" });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("signs out and returns no-store response for allowed origin", async () => {
    signOutMock.mockResolvedValue({ success: true });
    const { POST } = await import("@/app/api/v1/auth/sign-out/route");

    const request = new NextRequest("http://localhost:3000/api/v1/auth/sign-out", {
      method: "POST",
      headers: {
        origin: "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when signOut fails", async () => {
    signOutMock.mockRejectedValue(new Error("boom"));
    const { POST } = await import("@/app/api/v1/auth/sign-out/route");

    const request = new NextRequest("http://localhost:3000/api/v1/auth/sign-out", {
      method: "POST",
      headers: {
        origin: "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Logout failed", code: "LOGOUT_FAILED" });
  });
});
