import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

import { approveProAction } from "./actions";

interface AdminPageSearchParams {
  q?: string;
  notice?: string;
  error?: string;
}

interface AdminPageProps {
  searchParams: Promise<AdminPageSearchParams>;
}

const resolveNoticeText = (notice?: string): string | null => {
  if (notice === "approved") {
    return "Approved: user upgraded to PRO.";
  }

  if (notice === "already_pro") {
    return "No change: user is already PRO, audit log was still recorded.";
  }

  return null;
};

const resolveErrorText = (error?: string): string | null => {
  if (error === "invalid_request") {
    return "Invalid approval request. Please try again.";
  }

  if (error === "forbidden") {
    return "Forbidden: admin role is required.";
  }

  if (error === "user_not_found") {
    return "Target user not found.";
  }

  return null;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const access = await requireAdminAccess(requestHeaders);

  if (!access.ok) {
    if (access.reason === "UNAUTHORIZED") {
      redirect("/auth/login?callbackURL=%2Fadmin");
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
        <section className="w-full rounded-2xl border border-white/10 p-6 backdrop-blur">
          <h1 className="text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-zinc-500">Your account is not allowed to access this cockpit.</p>
        </section>
      </main>
    );
  }

  const query = (params.q ?? "").trim();

  const [totalUsers, totalProUsers, waitingApprovalUsers, users, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        subscriptionStatus: "PRO",
      },
    }),
    prisma.user.count({
      where: {
        subscriptionStatus: "FREE",
        hasOnboarded: true,
      },
    }),
    prisma.user.findMany({
      where: query
        ? {
            email: {
              contains: query,
              mode: "insensitive",
            },
          }
        : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        hasOnboarded: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
    }),
    prisma.auditLog.findMany({
      select: {
        id: true,
        action: true,
        createdAt: true,
        note: true,
        admin: {
          select: {
            email: true,
          },
        },
        targetUser: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  const noticeText = resolveNoticeText(params.notice);
  const errorText = resolveErrorText(params.error);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <section className="rounded-2xl border border-white/10 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Phase 4 Admin Cockpit</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage PRO approvals manually and preserve audit history. Signed in as {access.admin.email}
            </p>
          </div>
        </div>

        {noticeText ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white">{noticeText}</div>
        ) : null}

        {errorText ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorText}</div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total Users</p>
            <p className="mt-2 text-3xl font-semibold">{totalUsers}</p>
          </article>
          <article className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">PRO Users</p>
            <p className="mt-2 text-3xl font-semibold">{totalProUsers}</p>
          </article>
          <article className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">Waiting Approval</p>
            <p className="mt-2 text-3xl font-semibold text-amber-100">{waitingApprovalUsers}</p>
          </article>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 p-4">
          <form className="flex flex-col gap-3 sm:flex-row" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by email"
              className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Search
            </button>
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isPro = user.subscriptionStatus === "PRO";
                  const isWaitingApproval = user.subscriptionStatus === "FREE" && user.hasOnboarded;

                  return (
                    <tr key={user.id} className="border-b border-white/10 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-zinc-500">{user.name ?? "No name"}</p>
                      </td>
                      <td className="py-3 pr-4">{user.role}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{user.subscriptionStatus}</span>
                          {isWaitingApproval ? (
                            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                              Waiting for Approval
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3">
                        <form action={approveProAction} className="flex items-center gap-2">
                          <input type="hidden" name="targetUserId" value={user.id} />
                          <input type="hidden" name="note" value="Manual approval from admin cockpit" />
                          <button
                            type="submit"
                            disabled={isPro}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isPro ? "Already PRO" : "Approve PRO"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 ? <p className="mt-4 text-sm text-zinc-500">No users found for this query.</p> : null}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 p-4">
          <h2 className="text-lg font-semibold">Recent Audit Logs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {auditLogs.map((log) => (
              <li key={log.id} className="rounded-xl border border-white/10 px-3 py-2">
                <p className="font-medium">{log.action}</p>
                <p className="text-zinc-500">
                  {log.admin.email} → {log.targetUser.email}
                </p>
                <p className="text-xs text-zinc-500">{log.createdAt.toISOString()}</p>
                {log.note ? <p className="mt-1 text-xs text-zinc-400">{log.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}