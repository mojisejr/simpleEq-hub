import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("test suite bootstrap", () => {
  it("runs basic assertion", () => {
    expect(1 + 1).toBe(2)
  })

  it("resolves tsconfig path alias", () => {
    expect(cn("a", false && "b", "c")).toBe("a c")
  })
})