'use client';

import './globals.css';
import { SkipLink } from '../components/skip-link';
import { BUTTON_VARIANT_CLASS } from '../components/ui/tokens';
import { StatusPage, StatusRetryButton } from '../components/ui/status-page';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <SkipLink />
        <StatusPage
          code="500"
          title="The application could not recover"
          message="A server error stopped this request. No scores are calculated on this page."
          actions={
            <>
              <StatusRetryButton onRetry={reset} />
              <a href="/" className={BUTTON_VARIANT_CLASS.secondary}>
                Back to discovery
              </a>
            </>
          }
        />
      </body>
    </html>
  );
}
