import type { ReactNode } from 'react';
import { ComingSoonPanel } from './coming-soon-panel';
import { PageHeading } from './page-heading';

export function ReservedPage({
  kicker,
  title,
  description,
  panelTitle,
  panelDescription,
  action,
}: {
  kicker: string;
  title: string;
  description: ReactNode;
  panelTitle: string;
  panelDescription: string;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeading kicker={kicker} title={title} description={description} />
      <ComingSoonPanel title={panelTitle} description={panelDescription} action={action} />
    </div>
  );
}
