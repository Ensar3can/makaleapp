import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import { MAIN_CONTENT_ID } from '../lib/focus';

export function MainContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className={cx('outline-none', className)}>
      {children}
    </main>
  );
}
