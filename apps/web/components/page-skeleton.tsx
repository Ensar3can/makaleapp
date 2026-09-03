import { cx } from '../lib/cx';

export type PageSkeletonVariant = 'page' | 'catalog' | 'article' | 'form';

function Pulse({ className }: { className: string }) {
  return <div className={cx('animate-pulse rounded bg-line', className)} />;
}

export function PageSkeleton({
  label = 'Loading page',
  inset = true,
  variant = 'page',
}: {
  label?: string;
  inset?: boolean;
  variant?: PageSkeletonVariant;
}) {
  return (
    <div
      className={inset ? 'mx-auto w-full max-w-page px-4 py-10 md:px-12' : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      {variant === 'catalog' ? (
        <div className="catalog-layout">
          <Pulse className="hidden h-80 lg:block" />
          <div className="space-y-4">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-10 w-2/3 max-w-xl" />
            <Pulse className="card-surface h-36 bg-white" />
            <Pulse className="card-surface h-36 bg-white" />
            <Pulse className="card-surface h-36 bg-white" />
          </div>
        </div>
      ) : null}
      {variant === 'article' ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(17rem,0.8fr)]">
          <div className="space-y-4">
            <Pulse className="h-4 w-28" />
            <Pulse className="h-12 w-full max-w-2xl" />
            <Pulse className="h-4 w-full max-w-reading" />
            <Pulse className="h-4 w-5/6 max-w-reading" />
            <Pulse className="h-64 w-full" />
          </div>
          <Pulse className="hidden h-80 lg:block" />
        </div>
      ) : null}
      {variant === 'form' ? (
        <div className="mx-auto max-w-md space-y-4">
          <Pulse className="h-8 w-48" />
          <Pulse className="h-12 w-full" />
          <Pulse className="h-12 w-full" />
          <Pulse className="h-12 w-40" />
        </div>
      ) : null}
      {variant === 'page' ? (
        <div className="space-y-6">
          <Pulse className="h-4 w-24" />
          <Pulse className="h-10 w-2/3 max-w-xl" />
          <Pulse className="h-4 w-full max-w-reading" />
          <div className="grid gap-4 md:grid-cols-2">
            <Pulse className="card-surface h-40 bg-white" />
            <Pulse className="card-surface h-40 bg-white" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
