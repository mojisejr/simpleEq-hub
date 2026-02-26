"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/onboarding";

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
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <section className="glass-panel w-full max-w-sm rounded-xl p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your SimpleEq subscription</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Redirecting..." : "Continue with Google"}
        </button>

        {errorMessage ? <p className="mt-3 text-sm text-destructive text-center">{errorMessage}</p> : null}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen w-full items-center justify-center p-4" />}>
      <LoginForm />
    </Suspense>
  );
}
