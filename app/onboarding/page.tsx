import { headers } from "next/headers";
import Link from "next/link";
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-white/10 p-6 backdrop-blur">
        <div className="flex justify-end">
          <LogoutButton callbackURL="/auth/login?callbackURL=%2Fonboarding" />
        </div>
        <h1 className="text-2xl font-semibold">SimpleEq Onboarding</h1>
        <p className="mt-2 text-sm text-zinc-500">Login สำเร็จแล้วสำหรับ {resolvedUser.email}</p>

        {showReadyNotice ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white">
            รับทราบการชำระเงินแล้วครับ สามารถปิดหน้านี้กลับไปใช้ Extension ได้เลย ระบบจะอัปเดตสถานะให้อัตโนมัติ
          </div>
        ) : null}

        {isPro ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white">
            บัญชีนี้เป็น PRO แล้ว 🎉 สามารถกลับไปใช้งาน Extension ได้ทันที
          </div>
        ) : null}

        {!isPro ? (
          <>
            <section className="mt-6 rounded-2xl border border-white/10 p-4">
              <h2 className="text-lg font-semibold">วิธีใช้งานเบื้องต้น</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-500">
                <li>เปิด Chrome Side Panel ของ SimpleEq</li>
                <li>วางข้อความสมการ และกดแปลง/แสดงผล</li>
                <li>หลังบ้านจะเปิดใช้ PRO ให้เมื่อยืนยันการชำระเงินแล้ว</li>
              </ul>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 p-4">
              <h2 className="text-lg font-semibold">Mock Payment</h2>
              <p className="mt-2 text-sm text-zinc-500">สแกน QR ด้านล่างเพื่อชำระเงิน (ตัวอย่าง mock ในเฟสนี้)</p>

              <div className="mt-3 flex h-48 w-full items-center justify-center rounded-xl border border-white/10 bg-zinc-950 text-sm text-zinc-300">
                QR CODE MOCK
              </div>

              <Link
                href={messengerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                ส่งสลิปผ่าน Facebook Messenger
              </Link>

              <form action={acknowledgePaymentFlowAction} className="mt-3">
                <button
                  type="submit"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium"
                >
                  ฉันโอนแล้ว รอทีมงานเปิดใช้งาน
                </button>
              </form>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
