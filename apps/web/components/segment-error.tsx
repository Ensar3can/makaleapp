import { Button } from './ui/button';

export function SegmentError({
  title = 'This page could not be loaded',
  onRetry,
}: {
  title?: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="page-title">{title}</h1>
      <p className="page-lede">You can retry or go back. Scores are never calculated on this page.</p>
      <Button type="button" variant="primary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
