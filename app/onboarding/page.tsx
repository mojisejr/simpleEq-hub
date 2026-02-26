import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/auth/logout-button";
import { acknowledgePaymentFlowAction } from "./actions";

interface OnboardingPageSearchParams {
  notice?: string;
}

interface OnboardingPageProps {
  searchParams: Promise<OnboardingPageSearchParams>;
}

const messengerLink = process.env.PAYMENT_MESSENGER_LINK ?? "https://m.me/";

const toLoginWithCallback = (path: string): never => {
  redirect(`/auth/login?callbackURL=${encodeURIComponent(path)}`);
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    toLoginWithCallback("/onboarding");
  }

  let resolvedUser!: {
    email: string;
    subscriptionStatus: "FREE" | "PRO";
    hasOnboarded: boolean;
  };

  try {
    resolvedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: sessionUserId,
      },
      select: {
        email: true,
        subscriptionStatus: true,
        hasOnboarded: true,
      },
    });
  } catch {
    toLoginWithCallback("/onboarding");
  }

  const showReadyNotice = params.notice === "ready";
  const isPro = resolvedUser.subscriptionStatus === "PRO";

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <section className="glass-panel w-full max-w-3xl rounded-2xl p-6 sm:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
            <p className="mt-1 text-sm text-muted-foreground">Signed in as {resolvedUser.email}</p>
          </div>
          <LogoutButton callbackURL="/auth/login?callbackURL=%2Fonboarding" />
        </div>

        {showReadyNotice ? (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
            Payment acknowledged. You can close this window and return to the extension. The system will update automatically.
          </div>
        ) : null}

        {isPro ? (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-foreground">
            🎉 Account is active (PRO). You can perform this flow again if needed, but you&apos;re already good to go.
          </div>
        ) : null}

        {!isPro ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card/30 p-5">
                <h2 className="text-base font-semibold">How to use</h2>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Open SimpleEq Chrome Extension</li>
                  <li>Paste your equation or select text</li>
                  <li>System will auto-upgrade to PRO upon payment confirmation</li>
                </ul>
              </div>

              {/* <div className="rounded-xl border border-border bg-card/30 p-5">
                <h2 className="text-base font-semibold">Mock Payment</h2>
                <p className="mt-2 text-sm text-muted-foreground">Scan QR (Mock Mode)</p>

                <div className="mt-4 flex h-32 w-full items-center justify-center rounded-lg border border-border bg-background text-xs font-mono text-muted-foreground">
                  [ QR CODE MOCK ]
                </div>
              </div> */}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-base font-semibold">Confirm Payment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {/* After payment, click the button below or contact admin via Messenger. */}
                Click on the link below to make payment via Messenger. If you have any issues, please contact support via Messenger as well.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {/* <form action={acknowledgePaymentFlowAction} className="flex-1">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    I have paid
                  </button>
                </form> */}

                <a
                  href={messengerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  To Messenger
                </a>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
