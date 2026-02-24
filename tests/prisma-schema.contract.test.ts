import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("prisma schema contract", () => {
  it("keeps default values for role and subscriptionStatus", () => {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");

    expect(schema).toContain("role               UserRole           @default(USER)");
    expect(schema).toContain("subscriptionStatus SubscriptionStatus @default(FREE)");
  });

  it("contains audit log model for manual approval traceability", () => {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");

    expect(schema).toContain("model AuditLog");
    expect(schema).toContain("action       AuditAction");
  });
});