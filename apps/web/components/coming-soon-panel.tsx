import type { ReactNode } from 'react';
import { EmptyState } from './ui/empty-state';

export function ComingSoonPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState kicker="Not available in v1.0" title={title} description={description} action={action} />
  );
}
