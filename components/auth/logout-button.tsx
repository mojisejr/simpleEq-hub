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
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isLoading ? "Logging out..." : "Logout"}
      </button>

      {errorText ? <p className="text-xs text-destructive">{errorText}</p> : null}
    </div>
  );
}
