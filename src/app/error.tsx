"use client";

import { RuntimeErrorFallback } from "@/presentation/components/layout/RuntimeErrorFallback";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RuntimeErrorFallback
      digest={error.digest}
      onRetry={reset}
      showHomeLink={true}
    />
  );
}
