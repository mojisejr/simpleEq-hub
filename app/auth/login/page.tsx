"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/";

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch {
      setErrorMessage("Sign-in failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-white/10 p-6 backdrop-blur">
        <h1 className="text-xl font-semibold">SimpleEq Login</h1>
        <p className="mt-2 text-sm text-zinc-500">Continue with Google to sync your subscription status.</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Redirecting..." : "Continue with Google"}
        </button>

        {errorMessage ? <p className="mt-3 text-sm text-red-500">{errorMessage}</p> : null}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto flex min-h-screen w-full max-w-sm items-center px-4 py-8" />}>
      <LoginForm />
    </Suspense>
  );
}