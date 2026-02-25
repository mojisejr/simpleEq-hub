import { describe, expect, it } from "vitest";

import { createNoStoreHeaders } from "@/lib/http/cache-control";

describe("createNoStoreHeaders", () => {
  it("returns strict cache headers", () => {
    const headers = createNoStoreHeaders() as Record<string, string>;

    expect(headers["Cache-Control"]).toBe("no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    expect(headers.Pragma).toBe("no-cache");
    expect(headers.Expires).toBe("0");
  });
});
