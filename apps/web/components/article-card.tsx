import Link from 'next/link';
import type { PublicArticleCard } from '@aip/application';
import { AuthorAvatar } from './author-avatar';
import { AuthorshipRiskBadge } from './authorship-risk-badge';
import { ScoreGauge } from './score-gauge';
import { EmptyState } from './ui/empty-state';

function ArticleCard({
  article,
  variant = 'tile',
  className = '',
}: {
  article: PublicArticleCard;
  variant?: 'tile' | 'row';
  className?: string;
}) {
  const category = article.categories[0];

  if (variant === 'row') {
    return (
      <article className={`card-interactive group relative flex flex-col gap-6 p-6 md:flex-row ${className}`}>
        <div className="flex shrink-0 items-center gap-4 md:w-[7.5rem] md:flex-col md:items-start">
          <ScoreGauge value={article.score.overallScore} size="md" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {category ? (
              <Link
                href={`/categories/${category.slug}`}
                className="relative z-10 font-semibold uppercase tracking-[0.12em] text-navy hover:underline"
              >
                {category.name}
              </Link>
            ) : null}
            <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString()}</time>
            <span>{article.readingMinutes} min read</span>
          </p>
          <h2 className="mt-2 font-serif text-2xl leading-tight text-ink transition-colors duration-300 group-hover:text-navy md:text-[1.75rem]">
            <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
              {article.title}
            </Link>
          </h2>
          <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{article.abstract}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/profile/${article.author.username}`}
              className="relative z-10 inline-flex items-center gap-2"
            >
              <AuthorAvatar name={article.author.displayName} src={article.author.avatarUrl} />
              <span className="text-sm font-semibold text-ink">{article.author.displayName}</span>
            </Link>
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <AuthorshipRiskBadge classification={article.score.authorshipClassification} compact />
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag.id} className="chip">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`card-interactive flex h-full flex-col p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        {category ? (
          <span className="inline-flex rounded-md bg-frost px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
            {category.name}
          </span>
        ) : (
          <span />
        )}
        <ScoreGauge value={article.score.overallScore} size="sm" />
      </div>
      <h3 className="mt-3 font-serif text-lg leading-snug text-ink">
        <Link href={`/articles/${article.slug}`} className="transition-colors duration-300 hover:text-accent">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-muted">{article.abstract}</p>
      <div className="mt-4 flex items-center gap-3 border-t border-mist pt-3">
        <AuthorAvatar name={article.author.displayName} src={article.author.avatarUrl} />
        <div className="min-w-0">
          <Link href={`/profile/${article.author.username}`} className="block text-xs font-semibold text-ink hover:underline">
            {article.author.displayName}
          </Link>
          <p className="text-[10px] text-muted">
            {new Date(article.publishedAt).toLocaleDateString()} · {article.readingMinutes} min
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag.id} className="chip">
              {tag.name}
            </span>
          ))}
        </div>
        <AuthorshipRiskBadge classification={article.score.authorshipClassification} compact />
      </div>
    </article>
  );
}

export function ArticleCardGrid({
  articles,
  empty,
  columns = 2,
}: {
  articles: readonly PublicArticleCard[];
  empty: string;
  columns?: 2 | 3;
}) {
  if (articles.length === 0) {
    return <EmptyState description={empty} />;
  }

  return (
    <div className={`grid gap-4 ${columns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </div>
  );
}

export function ArticleCardRail({
  articles,
  empty,
}: {
  articles: readonly PublicArticleCard[];
  empty: string;
}) {
  if (articles.length === 0) {
    return <EmptyState description={empty} />;
  }

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {articles.map((article) => (
        <ArticleCard
          key={article.slug}
          article={article}
          className="w-[min(18rem,calc(100vw-2rem))] max-w-[22.5rem] shrink-0"
        />
      ))}
    </div>
  );
}

export function ArticleCardList({
  articles,
  empty,
}: {
  articles: readonly PublicArticleCard[];
  empty: string;
}) {
  if (articles.length === 0) {
    return <EmptyState description={empty} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} variant="row" />
      ))}
    </div>
  );
}
