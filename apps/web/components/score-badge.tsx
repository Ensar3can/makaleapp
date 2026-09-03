import type { PublicScoreCard } from '@aip/application';

export function scoreTone(score: number): string {
  if (score >= 70) {
    return 'bg-emerald-50 text-emerald-800';
  }

  if (score >= 40) {
    return 'bg-amber-50 text-amber-800';
  }

  return 'bg-red-50 text-red-800';
}

export function scoreStroke(score: number): string {
  if (score >= 70) {
    return '#006c49';
  }

  if (score >= 40) {
    return '#b45309';
  }

  return '#ba1a1a';
}

export function ScoreBadge({ score, label }: { score: PublicScoreCard; label?: string }) {
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold ${scoreTone(score.overallScore)}`}
    >
      <span>{label ?? 'Overall'}</span>
      <span>{score.overallScore.toFixed(0)}</span>
    </span>
  );
}
