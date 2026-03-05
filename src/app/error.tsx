"use client";

import { AppErrorScreen } from "@/components/AppErrorScreen";

export default function ErrorPage({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return <AppErrorScreen error={error} reset={reset} source="route-error-boundary" />;
}
