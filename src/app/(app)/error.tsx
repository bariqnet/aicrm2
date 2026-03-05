"use client";

import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function isSessionError(error: Error): boolean {
  if (error.name === "SessionInvalidError") return true;
  const message = error.message.toLowerCase();
  return message.includes("invalid token") || message.includes("unauthorized");
}

export default function AppError({ error, reset }: AppErrorProps) {
  const sessionError = isSessionError(error);

  useEffect(() => {
    if (!sessionError) return;
    const redirectToSignIn = async () => {
      const currentPath = window.location.pathname + window.location.search;
      const next = encodeURIComponent(currentPath || "/dashboard");

      try {
        await fetch("/api/session", {
          method: "DELETE",
          keepalive: true
        });
      } catch {
        // Best effort. Redirecting is the primary recovery path.
      } finally {
        window.location.replace(`/auth/sign-in?expired=1&next=${next}`);
      }
    };

    void redirectToSignIn();
  }, [sessionError]);

  if (sessionError) {
    return (
      <main className="app-page">
        <div className="panel flex min-h-[40vh] items-center justify-center text-sm text-mutedfg">
          Session expired. Redirecting to sign in...
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="panel flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-mutedfg">Something went wrong.</p>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
