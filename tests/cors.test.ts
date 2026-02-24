import { afterEach, describe, expect, it, vi } from "vitest";

describe("createCorsHeaders", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("allows configured origin", async () => {
    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_ORIGINS: "https://example.com",
    };
    const { createCorsHeaders } = await import("@/lib/http/cors");

    const headers = createCorsHeaders("https://example.com") as Record<string, string>;

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
  });

  it("allows configured chrome-extension origin", async () => {
    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_ORIGINS: "https://example.com,chrome-extension://xyz",
    };
    const { createCorsHeaders } = await import("@/lib/http/cors");

    const headers = createCorsHeaders("chrome-extension://xyz") as Record<string, string>;

    expect(headers["Access-Control-Allow-Origin"]).toBe("chrome-extension://xyz");
  });

  it("rejects unconfigured chrome-extension origin", async () => {
    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_ORIGINS: "https://example.com,chrome-extension://xyz",
    };
    const { createCorsHeaders } = await import("@/lib/http/cors");

    const headers = createCorsHeaders("chrome-extension://unknown") as Record<string, string>;

    expect(headers["Access-Control-Allow-Origin"]).toBe("null");
  });

  it("falls back to null for disallowed origin", async () => {
    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_ORIGINS: "https://example.com",
    };
    const { createCorsHeaders } = await import("@/lib/http/cors");

    const headers = createCorsHeaders("https://evil.example") as Record<string, string>;

    expect(headers["Access-Control-Allow-Origin"]).toBe("null");
  });
});