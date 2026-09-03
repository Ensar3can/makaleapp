import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleNotFoundError, Role, escapeJsonLd, isSafePublicHref } from '@aip/domain';
import { getConfig } from '@aip/config';
import type { PublicArticleDetail } from '@aip/application';
import { ArticleCardGrid } from '@/components/article-card';
import { AuthorAvatar } from '@/components/author-avatar';
import { AuthorshipRiskBadge } from '@/components/authorship-risk-badge';
import { FlagArticleForm } from '@/components/flag-article-form-lazy';
import { PageShell } from '@/components/page-shell';
import { ScoreGauge } from '@/components/score-gauge';
import { Card } from '@/components/ui/card';
import { getDiscoveryServices } from '@/lib/discovery/container';
import { getOptionalPageSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await getDiscoveryServices().getPublicArticle.execute({ slug });
    const canonical = `${getConfig().APP_URL}/articles/${article.slug}`;
    return {
      title: article.title,
      description: article.abstract || article.title,
      alternates: { canonical },
      openGraph: {
        type: 'article',
        title: article.title,
        description: article.abstract,
        url: canonical,
        publishedTime: article.publishedAt,
      },
      twitter: {
        card: 'summary',
        title: article.title,
        description: article.abstract,
      },
    };
  } catch (error) {
    if (error instanceof ArticleNotFoundError) {
      return { title: 'Article not found' };
    }

    throw error;
  }
}

export default async function PublicArticlePage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const [article, session] = await Promise.all([
      getDiscoveryServices().getPublicArticle.execute({ slug }),
      getOptionalPageSession(),
    ]);
    const canFlag = session?.user.role === Role.MODERATOR || session?.user.role === Role.ADMIN;
    return <ArticleDetail article={article} canFlag={canFlag} />;
  } catch (error) {
    if (error instanceof ArticleNotFoundError) {
      notFound();
    }

    throw error;
  }
}

function ArticleDetail({ article, canFlag }: { article: PublicArticleDetail; canFlag: boolean }) {
  const canonical = `${getConfig().APP_URL}/articles/${article.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.abstract,
    datePublished: article.publishedAt,
    inLanguage: article.language,
    author: {
      '@type': 'Person',
      name: article.author.displayName,
      url: `${getConfig().APP_URL}/profile/${article.author.username}`,
    },
    mainEntityOfPage: canonical,
  };

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(17rem,0.8fr)] lg:items-start">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(structuredData) }}
        />
        <div className="space-y-8">
          <header className="space-y-4">
            <p className="page-kicker">
              {article.categories.map((category) => category.name).join(' · ') || 'Published article'}
            </p>
            <h1 className="break-words font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
              {article.title}
            </h1>
            <p className="max-w-reading text-lg leading-7 text-muted">{article.abstract}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <Link href={`/profile/${article.author.username}`} className="inline-flex items-center gap-2">
                <AuthorAvatar name={article.author.displayName} src={article.author.avatarUrl} />
                <span className="link-accent">{article.author.displayName}</span>
              </Link>
              <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString()}</time>
              <span>{article.readingMinutes} min read</span>
            </div>
            {article.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag.id} className="chip">
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <article className="max-w-reading whitespace-pre-wrap break-words font-serif text-lg leading-8 text-ink">
            {article.content}
          </article>

          {canFlag && article.id ? (
            <Card className="space-y-3 p-6">
              <h2 className="font-serif text-2xl text-ink">Send to review</h2>
              <p className="text-sm text-muted">
                Moderators can move a published article into the review queue. This does not recalculate
                scores.
              </p>
              <FlagArticleForm articleId={article.id} />
            </Card>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-ink">Related articles</h2>
            <ArticleCardGrid articles={article.related} empty="No related published articles yet." />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="space-y-4 p-6">
            <h2 className="font-serif text-xl text-ink">Evaluation score</h2>
            <ScoreGauge
              value={article.score.overallScore}
              label="Overall"
              size="lg"
              caption="Persisted snapshot"
            />
            <ScoreGauge value={article.score.qualityScore} label="Quality" caption="Persisted snapshot" />
            <details className="rounded-xl bg-frost p-4 text-sm text-muted">
              <summary className="cursor-pointer font-semibold text-ink">How was this score calculated?</summary>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  Quality {article.score.qualityScore.toFixed(0)} and overall {article.score.overallScore.toFixed(0)}{' '}
                  come from the persisted snapshot (policy {article.score.scoringPolicyVersion}).
                </li>
                <li>
                  Authorship integrity {article.score.authorshipIntegrity.toFixed(0)} is stored on that snapshot; it
                  is not mixed here.
                </li>
                {article.metrics.map((metric) => (
                  <li key={metric.metricType}>
                    {metric.metricType.replaceAll('_', ' ').toLowerCase()}: {metric.score.toFixed(0)} (confidence{' '}
                    {metric.confidence.toFixed(0)})
                  </li>
                ))}
              </ul>
            </details>
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="font-serif text-xl text-ink">AI authorship assessment</h2>
            <AuthorshipRiskBadge classification={article.authorship.classification} />
            <p className="text-sm text-muted">
              Risk {article.authorship.riskScore.toFixed(0)} · confidence {article.authorship.confidenceScore.toFixed(0)}
            </p>
            <p className="text-xs leading-5 text-muted">{article.authorship.disclaimer}</p>
          </Card>

          {article.sources.length > 0 ? (
            <Card className="space-y-3 p-6">
              <h2 className="font-serif text-xl text-ink">Source verification</h2>
              <ul className="space-y-2 text-sm text-muted">
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <span className="font-medium text-ink">{source.title}</span>
                    {source.publisher ? ` · ${source.publisher}` : ''}
                    <span className="mt-1 block text-xs uppercase tracking-wide">{source.verificationStatus}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="space-y-3 p-6">
            <h2 className="font-serif text-xl text-ink">About the author</h2>
            <Link href={`/profile/${article.author.username}`} className="flex items-center gap-3">
              <AuthorAvatar name={article.author.displayName} src={article.author.avatarUrl} size={40} />
              <span>
                <span className="block font-semibold text-ink">{article.author.displayName}</span>
                <span className="text-sm text-muted">@{article.author.username}</span>
              </span>
            </Link>
            {article.author.bio ? <p className="text-sm leading-6 text-muted">{article.author.bio}</p> : null}
            {isSafePublicHref(article.author.websiteUrl) ? (
              <a
                href={article.author.websiteUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="link-accent text-sm"
              >
                Profile website
              </a>
            ) : null}
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
