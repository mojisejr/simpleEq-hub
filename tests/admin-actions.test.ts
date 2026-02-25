import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const revalidatePathMock = vi.fn();
const headersMock = vi.fn(async () => new Headers());
const requireAdminAccessMock = vi.fn();
const approveProAndWriteAuditMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/lib/admin-access", () => ({
  requireAdminAccess: requireAdminAccessMock,
}));

vi.mock("@/lib/admin-approval", () => ({
  approveProAndWriteAudit: approveProAndWriteAuditMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

const expectRedirect = async (promise: Promise<void>, path: string) => {
  await expect(promise).rejects.toThrow(`REDIRECT:${path}`);
};

describe("approveProAction", () => {
  afterEach(() => {
    requireAdminAccessMock.mockReset();
    approveProAndWriteAuditMock.mockReset();
    transactionMock.mockReset();
    headersMock.mockReset();
    headersMock.mockResolvedValue(new Headers());
    revalidatePathMock.mockClear();
    redirectMock.mockClear();
  });

  it("redirects invalid request when targetUserId is missing", async () => {
    const { approveProAction } = await import("@/app/admin/actions");
    const formData = new FormData();

    await expectRedirect(approveProAction(formData), "/admin?error=invalid_request");
    expect(requireAdminAccessMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("redirects to login callback when access is unauthorized", async () => {
    requireAdminAccessMock.mockResolvedValueOnce({ ok: false, reason: "UNAUTHORIZED" });

    const { approveProAction } = await import("@/app/admin/actions");
    const formData = new FormData();
    formData.set("targetUserId", "user_1");
    formData.set("note", "manual note");

    await expectRedirect(
      approveProAction(formData),
      "/auth/login?callbackURL=%2Fadmin",
    );
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("redirects forbidden when access is not admin", async () => {
    requireAdminAccessMock.mockResolvedValueOnce({ ok: false, reason: "FORBIDDEN" });

    const { approveProAction } = await import("@/app/admin/actions");
    const formData = new FormData();
    formData.set("targetUserId", "user_1");
    formData.set("note", "manual note");

    await expectRedirect(approveProAction(formData), "/admin?error=forbidden");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("redirects user_not_found when target user does not exist", async () => {
    requireAdminAccessMock.mockResolvedValueOnce({
      ok: true,
      admin: {
        id: "admin_1",
        email: "admin@simpleeq.dev",
        name: "Admin",
        role: "ADMIN",
      },
    });
    transactionMock.mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ tx: true }),
    );
    approveProAndWriteAuditMock.mockResolvedValueOnce({ ok: false, reason: "TARGET_NOT_FOUND" });

    const { approveProAction } = await import("@/app/admin/actions");
    const formData = new FormData();
    formData.set("targetUserId", "missing");
    formData.set("note", "manual note");

    await expectRedirect(approveProAction(formData), "/admin?error=user_not_found");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("redirects already_pro notice when target user is already PRO", async () => {
    requireAdminAccessMock.mockResolvedValueOnce({
      ok: true,
      admin: {
        id: "admin_1",
        email: "admin@simpleeq.dev",
        name: "Admin",
        role: "ADMIN",
      },
    });
    transactionMock.mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ tx: true }),
    );
    approveProAndWriteAuditMock.mockResolvedValueOnce({ ok: true, alreadyPro: true });

    const { approveProAction } = await import("@/app/admin/actions");
    const formData = new FormData();
    formData.set("targetUserId", "target_1");
    formData.set("note", "manual note");

    await expectRedirect(approveProAction(formData), "/admin?notice=already_pro");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(approveProAndWriteAuditMock).toHaveBeenCalledWith(
      { tx: true },
      {
        adminId: "admin_1",
        targetUserId: "target_1",
        note: "manual note",
      },
    );
  });

  it("redirects approved notice on success", async () => {
    requireAdminAccessMock.mockResolvedValueOnce({
      ok: true,
      admin: {
        id: "admin_1",
        email: "admin@simpleeq.dev",
        name: "Admin",
        role: "ADMIN",
      },
    });
    transactionMock.mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ tx: true }),
    );
    approveProAndWriteAuditMock.mockResolvedValueOnce({ ok: true, alreadyPro: false });

    const { approveProAction } = await import("@/app/admin/actions");
    const formData = new FormData();
    formData.set("targetUserId", "target_1");
    formData.set("note", "   ");

    await expectRedirect(approveProAction(formData), "/admin?notice=approved");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
  });
});