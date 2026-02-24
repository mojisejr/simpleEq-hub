export interface ApproveProInput {
  adminId: string;
  targetUserId: string;
  note?: string;
}

interface ApprovalTargetUser {
  id: string;
  subscriptionStatus: "FREE" | "PRO";
}

interface AdminApprovalTx {
  user: {
    findUnique: (args: {
      where: {
        id: string;
      };
      select: {
        id: true;
        subscriptionStatus: true;
      };
    }) => Promise<ApprovalTargetUser | null>;
    update: (args: {
      where: {
        id: string;
      };
      data: {
        subscriptionStatus: "PRO";
      };
    }) => Promise<unknown>;
  };
  auditLog: {
    create: (args: {
      data: {
        adminId: string;
        targetUserId: string;
        action: "APPROVE_SUBSCRIPTION";
        note?: string;
      };
    }) => Promise<unknown>;
  };
}

export type ApproveProResult =
  | {
      ok: true;
      alreadyPro: boolean;
    }
  | {
      ok: false;
      reason: "TARGET_NOT_FOUND";
    };

export const approveProAndWriteAudit = async (
  tx: AdminApprovalTx,
  input: ApproveProInput,
): Promise<ApproveProResult> => {
  const targetUser = await tx.user.findUnique({
    where: {
      id: input.targetUserId,
    },
    select: {
      id: true,
      subscriptionStatus: true,
    },
  });

  if (!targetUser) {
    return {
      ok: false,
      reason: "TARGET_NOT_FOUND",
    };
  }

  const alreadyPro = targetUser.subscriptionStatus === "PRO";

  if (!alreadyPro) {
    await tx.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        subscriptionStatus: "PRO",
      },
    });
  }

  await tx.auditLog.create({
    data: {
      adminId: input.adminId,
      targetUserId: targetUser.id,
      action: "APPROVE_SUBSCRIPTION",
      note: input.note,
    },
  });

  return {
    ok: true,
    alreadyPro,
  };
};