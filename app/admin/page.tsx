import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/auth/logout-button";

import { approveProAction } from "./actions";

type AdminListUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionStatus: "FREE" | "PRO";
  hasOnboarded: boolean;
  createdAt: Date;
};

type AdminAuditLogItem = {
  id: string;
  action: string;
  createdAt: Date;
  note: string | null;
  admin: {
    email: string;
  };
  targetUser: {
    email: string;
  };
};

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
      <main className="flex min-h-screen w-full items-center justify-center p-4">
        <section className="glass-panel w-full max-w-lg rounded-xl p-8 text-center">
          <h1 className="text-xl font-semibold text-destructive">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account is not allowed to access this cockpit.</p>
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
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      <section className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Cockpit</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage PRO approvals and view audit logs. Signed in as <span className="text-foreground font-medium">{access.admin.email}</span>
            </p>
          </div>
          <LogoutButton callbackURL="/auth/login?callbackURL=%2Fadmin" />
        </div>

        {noticeText ? (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">{noticeText}</div>
        ) : null}

        {errorText ? (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorText}</div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Users</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{totalUsers}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">PRO Users</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{totalProUsers}</p>
          </article>
          <article className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-yellow-500/80">Waiting Approval</p>
            <p className="mt-2 text-3xl font-semibold text-yellow-500">{waitingApprovalUsers}</p>
          </article>
        </div>

        <section className="mb-8 p-1">
          <form className="flex flex-col gap-3 sm:flex-row mb-6" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by email..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
            />
            <button
              type="submit"
              className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Search
            </button>
          </form>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card/30">
                  {users.map((user: AdminListUser) => {
                    const isPro = user.subscriptionStatus === "PRO";
                    const isWaitingApproval = user.subscriptionStatus === "FREE" && user.hasOnboarded;

                    return (
                      <tr key={user.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.name ?? "No name"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground bg-muted">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {isPro ? (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                                PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                                FREE
                              </span>
                            )}
                            
                            {isWaitingApproval ? (
                              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500 border border-yellow-500/20 animate-pulse">
                                Waiting
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <form action={approveProAction} className="flex items-center gap-2">
                            <input type="hidden" name="targetUserId" value={user.id} />
                            <input type="hidden" name="note" value="Manual approval from admin cockpit" />
                            <button
                              type="submit"
                              disabled={isPro}
                              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
                            >
                              {isPro ? "Active" : "Approve"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {users.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground bg-card/30">No users found matching your query.</div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/30 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Audit Logs</h2>
          <div className="space-y-3">
            {auditLogs.map((log: AdminAuditLogItem) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 rounded-lg border border-border bg-background/50 p-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">• {new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    <span className="text-accent-foreground">{log.admin.email}</span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span className="text-foreground">{log.targetUser.email}</span>
                  </p>
                  {log.note ? <p className="mt-1 text-xs text-muted-foreground italic border-l-2 border-border pl-2 my-1">{log.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
