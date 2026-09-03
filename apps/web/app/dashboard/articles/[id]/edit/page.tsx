import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { ArticleNotFoundError } from '@aip/domain';
import { getArticleServices } from '../../../../../lib/articles/container';
import { requirePageSession } from '../../../../../lib/auth/session';
import { PageHeading } from '../../../../../components/page-heading';
import { PageSkeleton } from '../../../../../components/page-skeleton';
import { ButtonLink } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';

export const dynamic = 'force-dynamic';

const ArticleEditor = nextDynamic(
  () => import('../../../../../components/article-editor').then((mod) => mod.ArticleEditor),
  { loading: () => <PageSkeleton inset={false} variant="form" label="Loading editor" /> },
);

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageSession();
  const { id } = await params;
  const services = getArticleServices();

  try {
    const [article, categories] = await Promise.all([
      services.getAuthorArticle.execute({ actorUserId: session.userId, articleId: id }),
      services.listActiveCategories.execute({ actorUserId: session.userId }),
    ]);

    return (
      <div className="space-y-6">
        <PageHeading
          kicker="Workspace"
          title="Edit article"
          description="Title and body live on the current version. Editing content creates a new version."
          actions={
            <ButtonLink href={`/dashboard/articles/${article.id}/analysis`} variant="secondary">
              View analysis
            </ButtonLink>
          }
        />
        <Card className="p-6 md:p-8">
          <ArticleEditor mode="edit" article={article} categories={categories} />
        </Card>
      </div>
    );
  } catch (error) {
    if (error instanceof ArticleNotFoundError) {
      notFound();
    }

    throw error;
  }
}
