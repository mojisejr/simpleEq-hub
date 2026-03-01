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

const manageLicenseSchema = z.object({
  targetUserId: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  action: z.enum(["activate", "revoke"]),
  note: z.string().optional(),
});

export const manageLicenseAction = async (prevState: any, formData: FormData) => {
  const parsed = manageLicenseSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    productSlug: formData.get("productSlug"),
    action: formData.get("action"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_request" };
  }

  const requestHeaders = await headers();
  const access = await requireAdminAccess(requestHeaders);

  if (!access.ok) {
    return { ok: false, error: "forbidden" };
  }

  const { targetUserId, productSlug, action, note } = parsed.data;
  const isActive = action === "activate";

  try {
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true, name: true },
    });

    if (!product) {
      return { ok: false, error: "product_not_found" };
    }

    // Upsert License Logic
    await prisma.$transaction(async (tx) => {
      // 1. Check existing license
      const existingLicense = await tx.license.findUnique({
        where: {
          userId_productId: {
            userId: targetUserId,
            productId: product.id,
          },
        },
      });

      // 2. Prepare update data
      // If activating for first time (or no record), set grantedBy/At.
      // If updating, set lastModifiedBy.
      const now = new Date();
      
      if (!existingLicense) {
        await tx.license.create({
          data: {
            userId: targetUserId,
            productId: product.id,
            isActive,
            // First time grant
            grantedBy: isActive ? access.admin.id : null,
            grantedAt: isActive ? now : undefined, // create defaults to now() anyway, but let's be explicit if active
            lastModifiedBy: access.admin.id,
          },
        });
      } else {
        await tx.license.update({
          where: { id: existingLicense.id },
          data: {
            isActive,
            lastModifiedBy: access.admin.id,
            // Only set grantedBy/At if it was never granted before and we are activating
            grantedBy: (isActive && !existingLicense.grantedBy) ? access.admin.id : undefined,
            grantedAt: (isActive && !existingLicense.grantedBy) ? now : undefined,
          },
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          adminId: access.admin.id,
          targetUserId,
          action: "MANAGE_LICENSE",
          note: note || `Manual ${action} for ${product.name}`,
        },
      });
      
      // 4. Backward Compatibility Sync (for SimpleEq)
      if (productSlug === "simple-eq") {
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            subscriptionStatus: isActive ? "PRO" : "FREE",
          },
        });
      }
    });

    revalidatePath("/admin");
    return { ok: true, message: "success" };
  } catch (error) {
    console.error("Manage license error:", error);
    return { ok: false, error: "internal_error" };
  }
};
