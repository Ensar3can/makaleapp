import type { ReactNode } from 'react';

export function PageShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-page flex-1 px-4 py-10 md:px-12 md:py-16 ${className}`}>
      {children}
    </div>
  );
}
