import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/auth/logout-button";

const toLogin = (callbackPath: string): never => {
  redirect(`/auth/login?callbackURL=${encodeURIComponent(callbackPath)}`);
};

export default async function Home() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    toLogin("/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: sessionUserId,
    },
    select: {
      subscriptionStatus: true,
    },
  });

  if (user?.subscriptionStatus !== "PRO") {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-white/10 p-6 backdrop-blur">
        <div className="flex justify-end">
          <LogoutButton callbackURL="/auth/login" />
        </div>
        <h1 className="text-2xl font-semibold">SimpleEq Hub</h1>
        <p className="mt-2 text-sm text-zinc-500">บัญชี PRO พร้อมใช้งานแล้ว สามารถกลับไปใช้ Extension ได้ทันที</p>
        <Link href="/admin" className="mt-6 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-medium">
          ไปหน้า Admin
        </Link>
      </section>
    </main>
  );
}
