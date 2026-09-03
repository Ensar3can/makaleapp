'use client';

import { RouteError } from '../components/route-error';

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Something went wrong"
      message="This page could not be loaded. Scores are never calculated here. You can retry or return to discovery."
      onRetry={reset}
    />
  );
}
