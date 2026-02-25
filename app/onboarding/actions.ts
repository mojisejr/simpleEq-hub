"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const toLoginWithCallback = (path: string): never => {
  redirect(`/auth/login?callbackURL=${encodeURIComponent(path)}`);
};

export const acknowledgePaymentFlowAction = async (): Promise<void> => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    toLoginWithCallback("/onboarding");
  }

  await prisma.user.update({
    where: {
      id: sessionUserId,
    },
    data: {
      hasOnboarded: true,
      paymentNote: "User acknowledged payment onboarding instructions",
    },
  });

  redirect("/onboarding?notice=ready");
};
