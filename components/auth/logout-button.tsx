"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";

interface LogoutButtonProps {
  callbackURL?: string;
}

export function LogoutButton({ callbackURL = "/auth/login" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setErrorText(null);

      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = callbackURL;
          }
        }
      });
    } catch {
      setErrorText("Logout failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isLoading ? "Logging out..." : "Logout"}
      </button>

      {errorText ? <p className="text-xs text-red-300">{errorText}</p> : null}
    </div>
  );
}