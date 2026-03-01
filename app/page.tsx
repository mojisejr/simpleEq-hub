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
      role: true,
    },
  });

  if (user?.subscriptionStatus !== "PRO") {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <section className="glass-panel w-full max-w-lg rounded-2xl p-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">SimpleEq Hub</h1>
          <LogoutButton callbackURL="/auth/login" />
        </div>
        
        <div className="space-y-4">
          <div className="rounded-xl bg-card/50 p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <p className="font-medium">PRO Account Active</p>
                <p className="text-sm text-muted-foreground">Your extension is ready to use.</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            You have full access to all SimpleEq features. You can now close this window and return to the Chrome Extension.
          </p>

          {(user?.role === "ADMIN" || user?.role === "MASTER") && (
            <Link 
              href="/admin" 
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
