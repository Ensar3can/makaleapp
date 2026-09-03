'use client';

import { SegmentError } from '../../components/segment-error';

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError title="This sign-in page could not be loaded" onRetry={reset} />;
}
