import { ArticleStatus } from '@aip/domain';

const LABELS: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'Draft',
  [ArticleStatus.SUBMITTED]: 'Submitted',
  [ArticleStatus.QUEUED_FOR_ANALYSIS]: 'Queued for analysis',
  [ArticleStatus.PROCESSING]: 'Processing',
  [ArticleStatus.ANALYSIS_COMPLETED]: 'Analysis completed',
  [ArticleStatus.READY_FOR_PUBLICATION]: 'Ready for publication',
  [ArticleStatus.REQUIRES_REVIEW]: 'Requires review',
  [ArticleStatus.REJECTED]: 'Rejected',
  [ArticleStatus.PUBLISHED]: 'Published',
  [ArticleStatus.ANALYSIS_FAILED]: 'Analysis failed',
  [ArticleStatus.ARCHIVED]: 'Archived',
  [ArticleStatus.REMOVED]: 'Removed',
};

const TONES: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'bg-slate-100 text-slate-700',
  [ArticleStatus.SUBMITTED]: 'bg-sky-50 text-sky-800',
  [ArticleStatus.QUEUED_FOR_ANALYSIS]: 'bg-indigo-50 text-indigo-800',
  [ArticleStatus.PROCESSING]: 'bg-amber-50 text-amber-800',
  [ArticleStatus.ANALYSIS_COMPLETED]: 'bg-teal-50 text-teal-800',
  [ArticleStatus.READY_FOR_PUBLICATION]: 'bg-emerald-50 text-emerald-800',
  [ArticleStatus.REQUIRES_REVIEW]: 'bg-orange-50 text-orange-800',
  [ArticleStatus.REJECTED]: 'bg-red-50 text-red-800',
  [ArticleStatus.PUBLISHED]: 'bg-green-50 text-green-800',
  [ArticleStatus.ANALYSIS_FAILED]: 'bg-red-50 text-red-800',
  [ArticleStatus.ARCHIVED]: 'bg-slate-100 text-slate-600',
  [ArticleStatus.REMOVED]: 'bg-slate-100 text-slate-500',
};

export function articleStatusLabel(status: ArticleStatus): string {
  return LABELS[status];
}

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${TONES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
