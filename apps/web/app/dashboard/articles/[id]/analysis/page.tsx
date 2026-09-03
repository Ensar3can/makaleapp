import { notFound } from 'next/navigation';
import { ArticleNotFoundError, ArticleStatus, type AnalysisJobStatus } from '@aip/domain';
import type { AuthorArticleDetail } from '@aip/application';
import { AuthorshipRiskBadge } from '../../../../../components/authorship-risk-badge';
import { PageHeading } from '../../../../../components/page-heading';
import { ScoreGauge } from '../../../../../components/score-gauge';
import { StatusBadge } from '../../../../../components/status-badge';
import { ButtonLink } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { DataTable } from '../../../../../components/ui/data-table';
import { EmptyState } from '../../../../../components/ui/empty-state';
import { metricLabel } from '../../../../../lib/analysis-labels';
import { getArticleServices } from '../../../../../lib/articles/container';
import { requirePageSession } from '../../../../../lib/auth/session';

export const dynamic = 'force-dynamic';

const JOB_LABELS: Record<AnalysisJobStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export default async function AuthorAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageSession();
  const { id } = await params;

  try {
    const article = await getArticleServices().getAuthorArticle.execute({
      actorUserId: session.userId,
      articleId: id,
    });

    return <AnalysisView article={article} />;
  } catch (error) {
    if (error instanceof ArticleNotFoundError) {
      notFound();
    }

    throw error;
  }
}

function AnalysisView({ article }: { article: AuthorArticleDetail }) {
  const inFlight =
    article.status === ArticleStatus.SUBMITTED ||
    article.status === ArticleStatus.QUEUED_FOR_ANALYSIS ||
    article.status === ArticleStatus.PROCESSING;
  const failed = article.status === ArticleStatus.ANALYSIS_FAILED;
  const hasResults = article.contentAnalysis !== null || article.score !== null;

  return (
    <div className="space-y-8">
      <PageHeading
        kicker="Analysis"
        title={article.title}
        description="This page reads persisted metrics, evidence, and the ScoreSnapshot for the current version. It never calculates scores. AI authorship is risk and confidence, not a verdict."
        actions={
          <ButtonLink href={`/dashboard/articles/${article.id}/edit`} variant="secondary">
            Edit article
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={article.status} />
        <p className="text-sm text-muted">
          Version {article.currentVersionNumber}
          {article.analysisJobStatus
            ? ` · job ${JOB_LABELS[article.analysisJobStatus]}`
            : ' · no active analysis job'}
        </p>
      </div>

      <Card className="p-5">
        <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ProgressStep
          done={article.status !== ArticleStatus.DRAFT}
          label="Submitted"
          detail={article.status === ArticleStatus.DRAFT ? 'Not submitted yet' : 'Recorded'}
        />
        <ProgressStep
          done={inFlight || hasResults || failed}
          active={inFlight}
          label="Job status"
          detail={
            article.analysisJobStatus
              ? JOB_LABELS[article.analysisJobStatus]
              : failed
                ? 'Failed'
                : inFlight
                  ? 'Waiting for the worker'
                  : 'None'
          }
        />
        <ProgressStep
          done={article.contentAnalysis !== null}
          label="Metrics persisted"
          detail={article.contentAnalysis ? 'Analysis run stored' : 'Not written yet'}
        />
        <ProgressStep
          done={article.score !== null}
          label="Score snapshot"
          detail={article.score ? `Policy ${article.score.scoringPolicyVersion}` : 'Not written yet'}
        />
        </ol>
      </Card>

      {failed && !hasResults ? (
        <EmptyState
          title="Analysis did not complete"
          description="No ScoreSnapshot was written for this version. Open the editor and submit again. This screen does not invent progress or scores."
          action={
            <ButtonLink href={`/dashboard/articles/${article.id}/edit`}>Return to editor</ButtonLink>
          }
        />
      ) : null}

      {!failed && !hasResults ? (
        <EmptyState
          title={inFlight ? 'Analysis is in progress' : 'No analysis yet'}
          description={
            inFlight
              ? 'Only completed, persisted steps are marked above. Fake pipeline progress is not shown.'
              : 'Submit the article from the editor to queue analysis. Results appear here after the worker writes metrics and a ScoreSnapshot.'
          }
          action={
            <ButtonLink href={`/dashboard/articles/${article.id}/edit`}>
              {inFlight ? 'Return to editor' : 'Open editor'}
            </ButtonLink>
          }
        />
      ) : null}

      {article.score ? (
        <Card className="space-y-4 p-6">
          <h2 className="font-serif text-2xl text-ink">Complete score</h2>
          <p className="text-sm text-muted">
            Persisted ScoreSnapshot for this version (policy {article.score.scoringPolicyVersion}).
          </p>
          <div className="flex flex-wrap gap-8">
            <ScoreGauge value={article.score.overallScore} label="Overall" size="lg" caption="Snapshot" />
            <ScoreGauge value={article.score.qualityScore} label="Quality" caption="Snapshot" />
          </div>
          <p className="text-sm text-muted">
            Authorship integrity {article.score.authorshipIntegrity.toFixed(0)} · risk{' '}
            {article.score.authorshipRisk.toFixed(0)} · confidence {article.score.authorshipConfidence.toFixed(0)}
          </p>
          {article.status === ArticleStatus.READY_FOR_PUBLICATION ||
          article.status === ArticleStatus.ANALYSIS_COMPLETED ? (
            <ButtonLink href={`/dashboard/articles/${article.id}/edit`} variant="accent">
              Publish from editor
            </ButtonLink>
          ) : null}
        </Card>
      ) : null}

      {article.contentAnalysis ? (
        <Card className="space-y-4 p-6">
          <h2 className="font-serif text-2xl text-ink">Score breakdown</h2>
          <p className="text-sm text-muted">
            Metric scores from the completed analysis run
            {article.contentAnalysis.articleType ? ` · type ${article.contentAnalysis.articleType}` : ''}.
          </p>
          <ul className="space-y-4">
            {article.contentAnalysis.metrics
              .filter((metric) => metric.metricType !== 'AI_AUTHORSHIP_RISK')
              .map((metric) => (
                <li key={metric.metricType}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-ink">
                      {metricLabel(metric.metricType)}
                    </span>
                    <span className="text-sm text-muted">
                      {metric.score.toFixed(0)} · confidence {metric.confidence.toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-navy"
                      style={{ width: `${Math.max(0, Math.min(100, metric.score))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{metric.explanation}</p>
                </li>
              ))}
          </ul>
          {article.contentAnalysis.detectedTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {article.contentAnalysis.detectedTopics.map((topic) => (
                <span key={topic} className="chip">
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {article.contentAnalysis?.authorship ? (
        <Card className="space-y-3 p-6">
          <h2 className="font-serif text-2xl text-ink">AI authorship assessment</h2>
          {article.contentAnalysis.authorship.classification ? (
            <AuthorshipRiskBadge classification={article.contentAnalysis.authorship.classification} />
          ) : null}
          <p className="text-sm text-muted">
            Risk {article.contentAnalysis.authorship.riskScore.toFixed(0)} · confidence{' '}
            {article.contentAnalysis.authorship.confidenceScore.toFixed(0)}
          </p>
          <p className="text-sm leading-6 text-muted">{article.contentAnalysis.authorship.explanation}</p>
          <p className="text-xs leading-5 text-muted">{article.contentAnalysis.authorship.disclaimer}</p>
          {article.contentAnalysis.authorship.signals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {article.contentAnalysis.authorship.signals.map((signal) => (
                <span key={signal} className="chip">
                  {signal}
                </span>
              ))}
            </div>
          ) : null}
          {article.contentAnalysis.authorship.detectors.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted">
              {article.contentAnalysis.authorship.detectors.map((detector) => (
                <li key={detector.name}>
                  <span className="font-medium text-ink">{detector.name}</span>
                  {' · '}
                  risk {detector.riskScore.toFixed(0)} · confidence {detector.confidenceScore.toFixed(0)}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-muted">Pipeline {article.contentAnalysis.pipelineVersion}</p>
        </Card>
      ) : null}

      {article.contentAnalysis && article.contentAnalysis.sources.length > 0 ? (
        <DataTable
          caption="Verified sources"
          heading={<h2 className="font-serif text-2xl text-ink">Source verification</h2>}
        >
            <thead>
              <tr>
                <th>Source</th>
                <th>Status</th>
                <th>Reliability</th>
              </tr>
            </thead>
            <tbody>
              {article.contentAnalysis.sources.map((source) => (
                <tr key={source.url}>
                  <td>
                    <p className="font-medium text-ink">{source.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {source.publisher ? `${source.publisher} · ` : ''}
                      {source.url}
                    </p>
                  </td>
                  <td>{source.verificationStatus.replaceAll('_', ' ')}</td>
                  <td>{source.reliabilityScore === null ? '—' : source.reliabilityScore.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
        </DataTable>
      ) : null}
    </div>
  );
}

function ProgressStep({
  done,
  active = false,
  label,
  detail,
}: {
  done: boolean;
  active?: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={`text-sm font-medium ${done || active ? 'text-ink' : 'text-muted'}`}>
        {done ? 'Recorded' : active ? 'In progress' : 'Waiting'}
      </p>
      <p className="text-xs text-muted">{detail}</p>
    </li>
  );
}
