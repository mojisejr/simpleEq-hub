import type { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminAccessFailureReason = "UNAUTHORIZED" | "FORBIDDEN";

export interface AdminProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export type AdminAccessResult =
  | {
      ok: true;
      admin: AdminProfile;
    }
  | {
      ok: false;
      reason: AdminAccessFailureReason;
    };

export const requireAdminAccess = async (requestHeaders: Headers): Promise<AdminAccessResult> => {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user?.id) {
    return {
      ok: false,
      reason: "UNAUTHORIZED",
    };
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!admin || (admin.role !== "ADMIN" && admin.role !== "MASTER")) {
    return {
      ok: false,
      reason: "FORBIDDEN",
    };
  }

  return {
    ok: true,
    admin,
  };
};