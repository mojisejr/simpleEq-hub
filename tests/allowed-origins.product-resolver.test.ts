import { describe, expect, it, vi } from "vitest";

import { createProductOriginResolver } from "@/lib/http/allowed-origins";

describe("createProductOriginResolver", () => {
  it("returns empty list when product slug is empty", async () => {
    const findProductBySlug = vi.fn();
    const resolveOrigins = createProductOriginResolver(findProductBySlug);

    await expect(resolveOrigins(" ")).resolves.toEqual([]);
    expect(findProductBySlug).not.toHaveBeenCalled();
  });

  it("returns empty list when product does not exist", async () => {
    const findProductBySlug = vi.fn().mockResolvedValue(null);
    const resolveOrigins = createProductOriginResolver(findProductBySlug);

    await expect(resolveOrigins("smart-ws")).resolves.toEqual([]);
    expect(findProductBySlug).toHaveBeenCalledWith("smart-ws");
  });

  it("normalizes and merges extensionId + allowedOrigins", async () => {
    const findProductBySlug = vi.fn().mockResolvedValue({
      extensionId: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      allowedOrigins: [
        "https://hub.example.com/login",
        "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "chrome-extension://INVALID-ID",
        "not-a-url",
      ],
    });

    const resolveOrigins = createProductOriginResolver(findProductBySlug);

    await expect(resolveOrigins("smart-ws")).resolves.toEqual([
      "https://hub.example.com",
      "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ]);
  });
});
