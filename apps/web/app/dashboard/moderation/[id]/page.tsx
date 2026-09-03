import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleNotFoundError } from '@aip/domain';
import { ModerationDecisionForm } from '../../../../components/moderation-decision-form';
import { StatusBadge } from '../../../../components/status-badge';
import { Card } from '../../../../components/ui/card';
import { authorshipClassificationLabel } from '../../../../lib/analysis-labels';
import { getModerationServices } from '../../../../lib/moderation/container';
import { requireModeratorPage } from '../../../../lib/auth/require-moderator';

export const dynamic = 'force-dynamic';

export default async function ModerationArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModeratorPage();
  const { id } = await params;

  try {
    const article = await getModerationServices().getArticle.execute({
      actorUserId: session.userId,
      articleId: id,
    });

    return (
      <div className="space-y-8">
        <div>
          <p className="page-kicker">
            <Link href="/dashboard/moderation" className="hover:underline">
              Review queue
            </Link>
          </p>
          <h1 className="page-title">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <StatusBadge status={article.status} />
            <span>
              {article.authorDisplayName} · @{article.authorUsername}
            </span>
          </div>
        </div>
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-ink">Flag reasons</h2>
          {article.flags.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Manually sent to review. No automatic flags.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {article.flags.map((flag) => (
                <li key={flag.code}>
                  <p className="font-medium text-ink">{flag.code.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-muted">{flag.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {article.score ? (
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-ink">Score snapshot</h2>
            <p className="mt-2 text-xs text-muted">
              Persisted for this version (policy {article.score.scoringPolicyVersion}). Not recalculated here.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Overall</dt>
                <dd className="text-lg font-semibold text-ink">{article.score.overallScore.toFixed(0)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Quality</dt>
                <dd className="text-lg font-semibold text-ink">{article.score.qualityScore.toFixed(0)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Authorship risk</dt>
                <dd className="text-lg font-semibold text-ink">
                  {authorshipClassificationLabel(article.score.authorshipClassification)}{' '}
                  · {article.score.authorshipRisk.toFixed(0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Confidence</dt>
                <dd className="text-lg font-semibold text-ink">
                  {article.score.authorshipConfidence.toFixed(0)}
                </dd>
              </div>
            </dl>
          </Card>
        ) : null}
        {article.contentAnalysis?.authorship ? (
          <Card className="p-6 text-sm text-muted">
            <h2 className="font-serif text-2xl text-ink">Detector signals</h2>
            <p className="mt-2 text-xs text-muted">{article.contentAnalysis.authorship.disclaimer}</p>
            <p className="mt-3">{article.contentAnalysis.authorship.explanation}</p>
            {article.contentAnalysis.authorship.signals.length > 0 ? (
              <p className="mt-3 text-xs">Signals: {article.contentAnalysis.authorship.signals.join(', ')}</p>
            ) : null}
            {article.contentAnalysis.authorship.detectors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs">
                {article.contentAnalysis.authorship.detectors.map((detector) => (
                  <li key={detector.name}>
                    {detector.name} · risk {detector.riskScore.toFixed(0)} · confidence{' '}
                    {detector.confidenceScore.toFixed(0)}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}
        {(article.contentAnalysis?.sources.length ?? 0) > 0 ? (
          <Card className="p-6 text-sm">
            <h2 className="font-serif text-2xl text-ink">Research sources</h2>
            <ul className="mt-4 space-y-2">
              {article.contentAnalysis?.sources.map((source) => (
                <li key={source.url}>
                  <span className="font-medium text-ink">{source.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {source.verificationStatus.replaceAll('_', ' ')} · {source.url}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-ink">Current version</h2>
          <p className="mt-3 text-sm text-muted">{article.abstract}</p>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink">{article.content}</div>
        </Card>
        {article.reviews.length > 0 ? (
          <Card className="p-6 text-sm">
            <h2 className="font-serif text-2xl text-ink">Prior decisions</h2>
            <ul className="mt-4 space-y-3">
              {article.reviews.map((review) => (
                <li key={review.id}>
                  <p className="font-medium text-ink">{review.decision}</p>
                  <p className="mt-1 text-muted">{review.reason}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-ink">Decision</h2>
          <p className="mt-2 text-sm text-muted">
            Approve returns the article to publication. Request revision sends it back to the author as a draft.
            Reject removes it from the public path.
          </p>
          <div className="mt-4">
            <ModerationDecisionForm articleId={article.id} />
          </div>
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
