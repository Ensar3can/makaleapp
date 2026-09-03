import type { ReactNode } from 'react';
import { MAIN_CONTENT_ID } from '../../lib/focus';
import { BrandMark } from '../brand-mark';
import { Button, ButtonLink } from './button';

export function StatusPage({
  code,
  title,
  message,
  actions,
  framed = false,
}: {
  code: string;
  title: string;
  message: string;
  actions: ReactNode;
  framed?: boolean;
}) {
  const body = (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="mx-auto flex w-full max-w-reading flex-1 flex-col justify-center px-4 py-16 outline-none md:px-12"
    >
      <p className="page-kicker">{code}</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-lede">{message}</p>
      <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
    </main>
  );

  if (!framed) {
    return body;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="header-bar">
        <div className="header-inner">
          <BrandMark />
        </div>
      </header>
      {body}
    </div>
  );
}

export function StatusRetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button type="button" variant="primary" onClick={onRetry}>
      Try again
    </Button>
  );
}

export function StatusHomeLink() {
  return (
    <ButtonLink href="/" variant="secondary">
      Back to discovery
    </ButtonLink>
  );
}
