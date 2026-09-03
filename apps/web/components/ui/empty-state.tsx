import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function EmptyState({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('empty-panel', className)} role="status">
      {kicker ? <p className="page-kicker">{kicker}</p> : null}
      {title ? <p className={cx('font-medium text-ink', kicker ? 'mt-3' : undefined)}>{title}</p> : null}
      {description ? (
        <div className={title ? 'mx-auto mt-2 max-w-lg' : undefined}>{description}</div>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
