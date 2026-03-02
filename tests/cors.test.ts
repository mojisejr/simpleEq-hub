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

  it("allows chrome-extension origin from ALLOWED_EXTENSION_IDS", async () => {
    const extensionId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_IDS: extensionId,
    };
    const { createCorsHeaders } = await import("@/lib/http/cors");

    const headers = createCorsHeaders(`chrome-extension://${extensionId}`) as Record<string, string>;

    expect(headers["Access-Control-Allow-Origin"]).toBe(`chrome-extension://${extensionId}`);
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

  it("ignores invalid extension IDs from env", async () => {
    process.env = {
      ...originalEnv,
      ALLOWED_EXTENSION_IDS: "abc123",
    };
    const { createCorsHeaders } = await import("@/lib/http/cors");

    const headers = createCorsHeaders("chrome-extension://abc123") as Record<string, string>;

    expect(headers["Access-Control-Allow-Origin"]).toBe("null");
  });
});

describe("isOriginAllowedForProduct", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("allows origin from product extensionId", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            extensionId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            allowedOrigins: [],
          }),
        },
      },
    }));

    const { isOriginAllowedForProduct } = await import("@/lib/http/cors");

    await expect(
      isOriginAllowedForProduct("chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "smart-ws"),
    ).resolves.toBe(true);
  });

  it("rejects origin when product guard does not contain it", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            extensionId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            allowedOrigins: ["https://hub.example"],
          }),
        },
      },
    }));

    const { isOriginAllowedForProduct } = await import("@/lib/http/cors");

    await expect(
      isOriginAllowedForProduct("chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "smart-ws"),
    ).resolves.toBe(false);
  });
});