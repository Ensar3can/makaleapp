import type { ReactNode } from 'react';

export function CatalogLayout({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="catalog-layout">
      {sidebar}
      <div className="min-w-0 space-y-8">{children}</div>
    </div>
  );
}
