import { describe, expect, it, vi } from "vitest";

import { approveProAndWriteAudit } from "@/lib/admin-approval";

describe("approveProAndWriteAudit", () => {
  it("upgrades FREE user to PRO and writes audit log", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "target_1",
      subscriptionStatus: "FREE",
    });
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({});

    const result = await approveProAndWriteAudit(
      {
        user: {
          findUnique,
          update,
        },
        auditLog: {
          create,
        },
      },
      {
        adminId: "admin_1",
        targetUserId: "target_1",
        note: "Manual approve",
      },
    );

    expect(result).toEqual({ ok: true, alreadyPro: false });
    expect(update).toHaveBeenCalledWith({
      where: { id: "target_1" },
      data: { subscriptionStatus: "PRO" },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        adminId: "admin_1",
        targetUserId: "target_1",
        action: "APPROVE_SUBSCRIPTION",
        note: "Manual approve",
      },
    });
  });

  it("does not update user when already PRO but still writes audit log", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "target_2",
      subscriptionStatus: "PRO",
    });
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({});

    const result = await approveProAndWriteAudit(
      {
        user: {
          findUnique,
          update,
        },
        auditLog: {
          create,
        },
      },
      {
        adminId: "admin_1",
        targetUserId: "target_2",
      },
    );

    expect(result).toEqual({ ok: true, alreadyPro: true });
    expect(update).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("returns TARGET_NOT_FOUND when target user does not exist", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({});

    const result = await approveProAndWriteAudit(
      {
        user: {
          findUnique,
          update,
        },
        auditLog: {
          create,
        },
      },
      {
        adminId: "admin_1",
        targetUserId: "missing_user",
      },
    );

    expect(result).toEqual({ ok: false, reason: "TARGET_NOT_FOUND" });
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("throws when user update fails and does not create audit log", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "target_3",
      subscriptionStatus: "FREE",
    });
    const update = vi.fn().mockRejectedValue(new Error("update failed"));
    const create = vi.fn().mockResolvedValue({});

    await expect(
      approveProAndWriteAudit(
        {
          user: {
            findUnique,
            update,
          },
          auditLog: {
            create,
          },
        },
        {
          adminId: "admin_1",
          targetUserId: "target_3",
        },
      ),
    ).rejects.toThrow("update failed");

    expect(create).not.toHaveBeenCalled();
  });

  it("throws when audit log creation fails after user update", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "target_4",
      subscriptionStatus: "FREE",
    });
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockRejectedValue(new Error("audit failed"));

    await expect(
      approveProAndWriteAudit(
        {
          user: {
            findUnique,
            update,
          },
          auditLog: {
            create,
          },
        },
        {
          adminId: "admin_1",
          targetUserId: "target_4",
        },
      ),
    ).rejects.toThrow("audit failed");

    expect(update).toHaveBeenCalledTimes(1);
  });
});