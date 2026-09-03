import { PageSkeleton } from '@/components/page-skeleton';
import { PageShell } from '@/components/page-shell';

export default function ArticleDetailLoading() {
  return (
    <PageShell>
      <PageSkeleton inset={false} variant="article" label="Loading article" />
    </PageShell>
  );
}
