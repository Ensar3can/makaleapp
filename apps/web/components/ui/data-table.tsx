import type { ReactNode } from 'react';
import { Card } from './card';

export function DataTable({
  children,
  caption,
  heading,
}: {
  children: ReactNode;
  caption?: string;
  heading?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      {heading ? <div className="p-6 pb-3">{heading}</div> : null}
      <div className="overflow-x-auto">
        <table className="data-table">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          {children}
        </table>
      </div>
    </Card>
  );
}
