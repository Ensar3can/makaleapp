import { authorshipClassificationLabel } from '../lib/analysis-labels';

const DOTS: Record<string, string> = {
  very_low: 'bg-teal-700',
  low: 'bg-slate-500',
  uncertain: 'bg-slate-300',
  elevated: 'bg-amber-400',
  high: 'bg-amber-700',
};

export function AuthorshipRiskBadge({
  classification,
  compact = false,
}: {
  classification: string;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-frost px-2.5 py-1 text-xs text-muted">
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOTS[classification] ?? 'bg-slate-400'}`}
        aria-hidden="true"
      />
      {compact ? 'AI risk: ' : 'AI authorship risk: '}
      {authorshipClassificationLabel(classification)}
    </span>
  );
}
