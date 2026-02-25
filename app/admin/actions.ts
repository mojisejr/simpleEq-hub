"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { approveProAndWriteAudit, type AdminApprovalTx } from "@/lib/admin-approval";
import { requireAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

const approvalFormSchema = z.object({
  targetUserId: z.string().trim().min(1),
  note: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const toAdminRouteWithCallback = (path: string): never => {
  redirect(`/auth/login?callbackURL=${encodeURIComponent(path)}`);
};

export const approveProAction = async (formData: FormData): Promise<void> => {
  const parsed = approvalFormSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/admin?error=invalid_request");
  }

  const requestHeaders = await headers();
  const access = await requireAdminAccess(requestHeaders);

  if (!access.ok) {
    if (access.reason === "UNAUTHORIZED") {
      toAdminRouteWithCallback("/admin");
    }

    redirect("/admin?error=forbidden");
  }

  const note = parsed.data.note ?? "Manual approval from Admin Cockpit";
 
  const result = await prisma.$transaction((tx: AdminApprovalTx) =>
    approveProAndWriteAudit(tx, {
      adminId: access.admin.id,
      targetUserId: parsed.data.targetUserId,
      note,
    }),
  );
 
   if (!result.ok) {
     redirect("/admin?error=user_not_found");
  }

  revalidatePath("/admin");

  if (result.alreadyPro) {
    redirect("/admin?notice=already_pro");
  }

  redirect("/admin?notice=approved");
};