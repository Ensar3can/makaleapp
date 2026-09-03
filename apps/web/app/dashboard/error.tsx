'use client';

import { SegmentError } from '../../components/segment-error';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError title="The workspace could not be loaded" onRetry={reset} />;
}
