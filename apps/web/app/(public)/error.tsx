'use client';

import { SegmentError } from '../../components/segment-error';
import { PageShell } from '../../components/page-shell';

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell>
      <SegmentError title="This published page could not be loaded" onRetry={reset} />
    </PageShell>
  );
}
