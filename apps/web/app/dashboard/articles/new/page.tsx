import dynamic from 'next/dynamic';
import { getArticleServices } from '../../../../lib/articles/container';
import { requirePageSession } from '../../../../lib/auth/session';
import { PageHeading } from '../../../../components/page-heading';
import { PageSkeleton } from '../../../../components/page-skeleton';
import { Card } from '../../../../components/ui/card';

const ArticleEditor = dynamic(
  () => import('../../../../components/article-editor').then((mod) => mod.ArticleEditor),
  { loading: () => <PageSkeleton inset={false} variant="form" label="Loading editor" /> },
);

export default async function NewArticlePage() {
  const session = await requirePageSession();
  const categories = await getArticleServices().listActiveCategories.execute({
    actorUserId: session.userId,
  });

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Workspace"
        title="New article"
        description="Save a draft first. Submission queues analysis for the current version. Scores appear from the persisted snapshot when the job finishes."
      />
      <Card className="p-6 md:p-8">
        <ArticleEditor mode="create" categories={categories} />
      </Card>
    </div>
  );
}
