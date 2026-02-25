import { afterEach, describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.fn((options: unknown) => ({ options }));
const prismaAdapterMock = vi.fn(() => "mock-adapter");

vi.mock("better-auth", () => ({
  betterAuth: betterAuthMock,
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: prismaAdapterMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { __name: "mock-prisma" },
}));

describe("auth config", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("reads trusted origins from ALLOWED_EXTENSION_ORIGINS", async () => {
    process.env = {
      ...originalEnv,
      BETTER_AUTH_SECRET: "secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost:3000",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      ALLOWED_EXTENSION_ORIGINS: "chrome-extension://abc, http://localhost:3000",
    };

    const { auth } = await import("@/lib/auth");
    const config = (auth as { options: { trustedOrigins: string[]; baseURL: string } }).options;

    expect(config.baseURL).toBe("http://localhost:3000");
    expect(config.trustedOrigins).toEqual(["chrome-extension://abc", "http://localhost:3000"]);
    expect(betterAuthMock).toHaveBeenCalledTimes(1);
    expect(prismaAdapterMock).toHaveBeenCalledTimes(1);
  });

  it("always includes hub origin and removes duplicates", async () => {
    process.env = {
      ...originalEnv,
      BETTER_AUTH_SECRET: "secret",
      BETTER_AUTH_URL: "https://hub.example.com",
      NEXT_PUBLIC_BETTER_AUTH_URL: "https://hub.example.com",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      ALLOWED_EXTENSION_ORIGINS: "chrome-extension://abc, https://hub.example.com,chrome-extension://abc",
    };

    const { auth } = await import("@/lib/auth");
    const config = (auth as { options: { trustedOrigins: string[] } }).options;

    expect(config.trustedOrigins).toEqual(["chrome-extension://abc", "https://hub.example.com"]);
  });
});