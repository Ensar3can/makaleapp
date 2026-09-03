import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={cx(interactive ? 'card-interactive' : 'card-surface', className)}>{children}</div>
  );
}
