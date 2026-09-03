import { PageSkeleton } from '../../components/page-skeleton';
import { PageShell } from '../../components/page-shell';

export default function PublicLoading() {
  return (
    <PageShell>
      <PageSkeleton inset={false} variant="catalog" label="Loading published pages" />
    </PageShell>
  );
}
