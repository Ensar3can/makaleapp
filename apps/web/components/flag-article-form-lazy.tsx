import dynamic from 'next/dynamic';

export const FlagArticleForm = dynamic(
  () => import('./flag-article-form').then((mod) => mod.FlagArticleForm),
  { loading: () => <p className="text-sm text-muted">Loading report form…</p> },
);
