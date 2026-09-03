import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileNotFoundError, isSafePublicHref } from '@aip/domain';
import { getConfig } from '@aip/config';
import { ArticleCardGrid } from '@/components/article-card';
import { AuthorAvatar } from '@/components/author-avatar';
import { PageShell } from '@/components/page-shell';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { getDiscoveryServices } from '@/lib/discovery/container';
import { discoveryQueryFromSearchParams, nextPageHref } from '@/lib/discovery/query';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await getDiscoveryServices().getPublicAuthor.execute({ username });
    return {
      title: profile.displayName,
      description: profile.bio || `Published articles by ${profile.displayName}.`,
      alternates: { canonical: `${getConfig().APP_URL}/profile/${profile.username}` },
    };
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return { title: 'Profile not found' };
    }

    throw error;
  }
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const queryParams = await searchParams;
  const query = discoveryQueryFromSearchParams(queryParams);

  try {
    const profile = await getDiscoveryServices().getPublicAuthor.execute({
      username,
      sort: query.sort,
      cursor: query.cursor,
      limit: query.limit,
    });
    const nextHref = nextPageHref(`/profile/${profile.username}`, queryParams, profile.articles.nextCursor);

    return (
      <PageShell>
        <div className="space-y-10">
          <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <AuthorAvatar name={profile.displayName} src={profile.avatarUrl} size={88} />
            <div className="min-w-0">
              <p className="page-kicker">Author</p>
              <h1 className="mt-2 break-words font-serif text-3xl text-ink sm:text-4xl">{profile.displayName}</h1>
              <p className="mt-1 text-muted">@{profile.username}</p>
              {profile.bio ? <p className="mt-3 max-w-2xl text-muted">{profile.bio}</p> : null}
              {isSafePublicHref(profile.websiteUrl) ? (
                <a
                  href={profile.websiteUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="link-accent mt-3 inline-block break-all text-sm"
                >
                  {profile.websiteUrl}
                </a>
              ) : null}
            </div>
          </Card>
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-ink">Published articles</h2>
            <ArticleCardGrid
              articles={profile.articles.items}
              columns={3}
              empty="This author has not published an article yet."
            />
            <Pagination href={nextHref} />
          </section>
        </div>
      </PageShell>
    );
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      notFound();
    }

    throw error;
  }
}
