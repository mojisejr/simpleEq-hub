import { afterEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findUniqueMock = vi.fn();

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
      findUnique: findUniqueMock,
    },
  },
}));

describe("requireAdminAccess", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns UNAUTHORIZED when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);
    const { requireAdminAccess } = await import("@/lib/admin-access");

    const result = await requireAdminAccess(new Headers());

    expect(result).toEqual({
      ok: false,
      reason: "UNAUTHORIZED",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns FORBIDDEN when user role is not ADMIN", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user_1",
      },
    });
    findUniqueMock.mockResolvedValue({
      id: "user_1",
      email: "member@simpleeq.dev",
      name: "Member",
      role: "USER",
    });

    const { requireAdminAccess } = await import("@/lib/admin-access");

    const result = await requireAdminAccess(new Headers());

    expect(result).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("returns admin profile when role is ADMIN", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "admin_1",
      },
    });
    findUniqueMock.mockResolvedValue({
      id: "admin_1",
      email: "admin@simpleeq.dev",
      name: "Admin",
      role: "ADMIN",
    });

    const { requireAdminAccess } = await import("@/lib/admin-access");

    const result = await requireAdminAccess(new Headers());

    expect(result).toEqual({
      ok: true,
      admin: {
        id: "admin_1",
        email: "admin@simpleeq.dev",
        name: "Admin",
        role: "ADMIN",
      },
    });
  });
});