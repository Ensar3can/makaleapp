'use client';

import { SegmentError } from '../../components/segment-error';

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError title="Settings could not be loaded" onRetry={reset} />;
}
