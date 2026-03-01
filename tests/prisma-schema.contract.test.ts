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

  it("supports MASTER role for phase 1 admin hierarchy", () => {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");

    expect(schema).toContain("enum UserRole");
    expect(schema).toContain("MASTER");
  });

  it("contains Product and License models for multi-product licensing", () => {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");

    expect(schema).toContain("model Product");
    expect(schema).toContain("model License");
    expect(schema).toContain("@@unique([userId, productId])");
  });

  it("contains audit log model for manual approval traceability", () => {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");

    expect(schema).toContain("model AuditLog");
    expect(schema).toContain("action       AuditAction");
  });
});