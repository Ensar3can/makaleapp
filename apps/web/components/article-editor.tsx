'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArticleStatus } from '@aip/domain';
import { authorshipClassificationLabel, metricLabel } from '../lib/analysis-labels';
import { flashToast, showToast } from '../lib/toast-store';
import { Alert, FormStatus } from './ui/alert';
import { Button, ButtonLink } from './ui/button';
import { Card } from './ui/card';
import { CheckboxField, RadioField, TextareaField, TextField } from './ui/field';
import { StatusBadge } from './status-badge';

interface EditorCategory {
  readonly id: string;
  readonly name: string;
}

interface EditorTag {
  readonly name: string;
}

interface EditorVersion {
  readonly id: string;
  readonly versionNumber: number;
  readonly createdAt: string;
}

interface EditorContentMetric {
  readonly metricType: string;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

interface EditorSourceReference {
  readonly url: string;
  readonly title: string;
  readonly publisher: string | null;
  readonly verificationStatus: string;
}

interface EditorAuthorship {
  readonly riskScore: number;
  readonly confidenceScore: number;
  readonly classification: string | null;
  readonly explanation: string;
  readonly disclaimer: string;
  readonly signals: readonly string[];
  readonly detectors: readonly { name: string; riskScore: number; confidenceScore: number }[];
}

interface EditorContentAnalysis {
  readonly articleType: string | null;
  readonly detectedTopics: readonly string[];
  readonly pipelineVersion: string;
  readonly metrics: readonly EditorContentMetric[];
  readonly sources?: readonly EditorSourceReference[];
  readonly authorship?: EditorAuthorship | null;
}

interface EditorScore {
  readonly overallScore: number;
  readonly qualityScore: number;
  readonly authorshipRisk: number;
  readonly authorshipConfidence: number;
  readonly authorshipIntegrity: number;
  readonly authorshipClassification: string;
  readonly scoringPolicyVersion: string;
}

interface EditorArticle {
  readonly id: string;
  readonly slug: string;
  readonly status: ArticleStatus;
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly language: string;
  readonly currentVersionNumber: number;
  readonly categories: readonly EditorCategory[];
  readonly tags: readonly EditorTag[];
  readonly versions: readonly EditorVersion[];
  readonly contentAnalysis?: EditorContentAnalysis | null;
  readonly score?: EditorScore | null;
}

const CONTENT_CHANGE_WARNING_STATUSES: readonly ArticleStatus[] = [
  ArticleStatus.SUBMITTED,
  ArticleStatus.QUEUED_FOR_ANALYSIS,
  ArticleStatus.PROCESSING,
  ArticleStatus.ANALYSIS_COMPLETED,
  ArticleStatus.READY_FOR_PUBLICATION,
  ArticleStatus.REQUIRES_REVIEW,
  ArticleStatus.REJECTED,
  ArticleStatus.PUBLISHED,
  ArticleStatus.ANALYSIS_FAILED,
];

export function ArticleEditor({
  mode,
  categories,
  article,
}: {
  mode: 'create' | 'edit';
  categories: readonly EditorCategory[];
  article?: EditorArticle;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<'save' | 'submit' | 'publish' | null>(null);
  const [status, setStatus] = useState(article?.status ?? ArticleStatus.DRAFT);
  const [slug] = useState(article?.slug ?? '');
  const [versionNumber, setVersionNumber] = useState(article?.currentVersionNumber ?? 1);
  const [versions, setVersions] = useState(article?.versions ?? []);
  const [contentAnalysis, setContentAnalysis] = useState(article?.contentAnalysis ?? null);
  const [score, setScore] = useState(article?.score ?? null);
  const submitAfterSaveRef = useRef(false);
  const analysisNoticeRef = useRef<ArticleStatus | null>(null);
  const articleId = article?.id;

  useEffect(() => {
    if (!articleId) {
      return;
    }

    if (status !== ArticleStatus.QUEUED_FOR_ANALYSIS && status !== ArticleStatus.PROCESSING) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        const body = (await response.json()) as {
          data?: { article: Pick<EditorArticle, 'status' | 'contentAnalysis' | 'score'> };
        };

        if (cancelled || !response.ok || !body.data) {
          return;
        }

        const nextStatus = body.data.article.status;
        setStatus(nextStatus);
        if (body.data.article.contentAnalysis) {
          setContentAnalysis(body.data.article.contentAnalysis);
        }
        if (body.data.article.score) {
          setScore(body.data.article.score);
        }

        if (
          nextStatus === ArticleStatus.ANALYSIS_COMPLETED &&
          analysisNoticeRef.current !== ArticleStatus.ANALYSIS_COMPLETED
        ) {
          analysisNoticeRef.current = ArticleStatus.ANALYSIS_COMPLETED;
          const message =
            'Analysis finished. Complete score, quality metrics, and AI authorship risk are ready.';
          setSuccess(message);
          showToast({ tone: 'success', message });
        }

        if (
          nextStatus === ArticleStatus.ANALYSIS_FAILED &&
          analysisNoticeRef.current !== ArticleStatus.ANALYSIS_FAILED
        ) {
          analysisNoticeRef.current = ArticleStatus.ANALYSIS_FAILED;
          const message = 'Analysis failed. You can edit the article and submit again.';
          setError(message);
          showToast({ tone: 'error', message });
        }
      } catch {
        // Transient poll failures should not break the editor.
      }
    };

    const timer = window.setInterval(() => {
      void poll();
    }, 2_000);
    void poll();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [articleId, status]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitAfterSave = submitAfterSaveRef.current;
    setPending(submitAfterSave ? 'submit' : 'save');
    setError(null);
    setSuccess(null);
    if (submitAfterSave) {
      analysisNoticeRef.current = null;
    }

    try {
    const form = new FormData(event.currentTarget);
    const categoryIds = form.getAll('categoryIds').map(String);
    const tagNames = String(form.get('tagNames') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    const payload = {
      title: String(form.get('title') ?? ''),
      abstract: String(form.get('abstract') ?? ''),
      content: String(form.get('content') ?? ''),
      language: String(form.get('language') ?? 'en'),
      categoryIds,
      tagNames,
    };

    const saved =
      mode === 'create'
        ? await fetch('/api/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/articles/${article?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: payload.title,
              abstract: payload.abstract,
              content: payload.content,
              categoryIds,
              tagNames,
            }),
          });
    const savedBody = (await saved.json()) as { data?: { article: EditorArticle }; error?: { message: string } };

    if (!saved.ok || !savedBody.data) {
      setError(savedBody.error?.message ?? 'Unable to save the draft.');
      setPending(null);
      return;
    }

    const next = savedBody.data.article;
    setStatus(next.status);
    setVersionNumber(next.currentVersionNumber);
    setVersions(next.versions);
    if (next.contentAnalysis) {
      setContentAnalysis(next.contentAnalysis);
    } else if (next.status === ArticleStatus.DRAFT) {
      setContentAnalysis(null);
      setScore(null);
    }
    if (next.score) {
      setScore(next.score);
    }

    if (mode === 'create' && !submitAfterSave) {
      flashToast({ tone: 'success', message: 'Draft saved.' });
      window.location.assign(`/dashboard/articles/${next.id}/edit`);
      return;
    }

    if (!submitAfterSave) {
      setSuccess('Draft saved.');
      showToast({ tone: 'success', message: 'Draft saved.' });
      setPending(null);
      return;
    }

    const submitted = await fetch(`/api/articles/${next.id}/submit`, { method: 'POST' });
    const submittedBody = (await submitted.json()) as {
      data?: { article: EditorArticle };
      error?: { message: string };
    };

    if (!submitted.ok || !submittedBody.data) {
      const message = submittedBody.error?.message ?? 'Draft saved, but submission failed.';
      setError(message);
      showToast({ tone: 'error', message });
      setPending(null);
      if (mode === 'create') {
        flashToast({ tone: 'error', message });
        window.location.assign(`/dashboard/articles/${next.id}/edit`);
      }
      return;
    }

    setStatus(submittedBody.data.article.status);
    const submittedMessage = 'Submitted for analysis. The worker is processing this job.';
    setSuccess(submittedMessage);
    setPending(null);

    if (mode === 'create') {
      flashToast({ tone: 'success', message: submittedMessage });
      window.location.assign(`/dashboard/articles/${submittedBody.data.article.id}/edit`);
    } else {
      showToast({ tone: 'success', message: submittedMessage });
    }
    } catch {
      setError('Unable to reach the server.');
      setPending(null);
    }
  }

  async function publish() {
    if (!articleId) {
      return;
    }

    setError(null);
    setSuccess(null);
    setPending('publish');

    try {
      const response = await fetch(`/api/articles/${articleId}/publish`, { method: 'POST' });
      const body = (await response.json()) as {
        data?: { article: EditorArticle };
        error?: { message: string };
      };

      if (!response.ok || !body.data) {
        setError(body.error?.message ?? 'Unable to publish the article.');
        setPending(null);
        return;
      }

      setStatus(body.data.article.status);
      if (body.data.article.score) {
        setScore(body.data.article.score);
      }
      const message = 'Published. The article is now available in public discovery.';
      setSuccess(message);
      showToast({ tone: 'success', message });
      setPending(null);
    } catch {
      setError('Unable to reach the server.');
      setPending(null);
    }
  }

  const canPublish =
    Boolean(score) &&
    (status === ArticleStatus.ANALYSIS_COMPLETED || status === ArticleStatus.READY_FOR_PUBLICATION);

  return (
    <form className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]" onSubmit={(event) => void save(event)}>
      <div className="space-y-6">
        <FormStatus error={error} success={success} />
        {status === ArticleStatus.REQUIRES_REVIEW ? (
          <Alert tone="info">
            This version is in the moderation queue. Publishing is unavailable until a moderator
            approves it. Authorship remains a risk estimate, not a verdict.
          </Alert>
        ) : null}
        {status === ArticleStatus.REJECTED ? (
          <Alert tone="error">
            Publication was rejected. You can edit this article to create a new version and submit again.
          </Alert>
        ) : null}
        {CONTENT_CHANGE_WARNING_STATUSES.includes(status) ? (
          <Alert tone="warning">
            Changing the title, abstract, or body creates a new version and invalidates the previous
            analysis for publication.
          </Alert>
        ) : null}
        {mode === 'edit' ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <StatusBadge status={status} />
            <span>Version {versionNumber}</span>
          </div>
        ) : null}
        <TextField name="title" label="Title" required maxLength={200} defaultValue={article?.title} />
        {mode === 'create' ? (
          <fieldset className="space-y-2">
            <legend className="field-label">Language</legend>
            <div className="flex flex-wrap gap-4">
              <RadioField
                name="language"
                value="en"
                label="English"
                defaultChecked={(article?.language ?? 'en') === 'en'}
              />
              <RadioField
                name="language"
                value="tr"
                label="Turkish"
                defaultChecked={article?.language === 'tr'}
              />
            </div>
          </fieldset>
        ) : null}
        <TextareaField
          name="abstract"
          label="Abstract"
          maxLength={2000}
          rows={4}
          defaultValue={article?.abstract}
        />
        <fieldset className="space-y-2">
          <legend className="field-label">Categories</legend>
          {categories.length === 0 ? (
            <p className="text-sm text-muted">No active categories are available.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <CheckboxField
                  key={category.id}
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={article?.categories.some((item) => item.id === category.id)}
                  label={category.name}
                />
              ))}
            </div>
          )}
        </fieldset>
        <TextField
          name="tagNames"
          label="Tags"
          defaultValue={article?.tags.map((tag) => tag.name).join(', ')}
          placeholder="research methods, evaluation"
          hint="Separate tags with commas."
        />
        <TextareaField
          name="content"
          label="Body"
          rows={16}
          defaultValue={article?.content}
          className="font-mono"
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={pending !== null}
            pending={pending === 'save'}
            onClick={() => {
              submitAfterSaveRef.current = false;
            }}
          >
            {mode === 'create' ? 'Save draft' : 'Save changes'}
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={pending !== null}
            pending={pending === 'submit'}
            onClick={() => {
              submitAfterSaveRef.current = true;
            }}
          >
            Submit for analysis
          </Button>
          {canPublish ? (
            <Button
              type="button"
              variant="accent"
              disabled={pending !== null}
              pending={pending === 'publish'}
              onClick={() => void publish()}
            >
              Publish
            </Button>
          ) : null}
          {status === ArticleStatus.PUBLISHED && slug ? (
            <ButtonLink href={`/articles/${slug}`} variant="secondary">
              View public page
            </ButtonLink>
          ) : null}
        </div>
      </div>
      <aside className="space-y-4">
        <Card className="p-4 text-sm text-muted">
          <h2 className="font-medium text-ink">Submission guide</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>Saving a draft does not start analysis.</li>
            <li>Submission queues an analysis job. The worker processes it asynchronously.</li>
            <li>Content changes create a new version and require a new submission.</li>
            <li>This screen displays persisted metric scores and the ScoreSnapshot. It never calculates them.</li>
            <li>Publish is available after analysis completes with a ScoreSnapshot. It does not recalculate scores.</li>
          </ul>
        </Card>
        {score ? (
          <Card className="p-4 text-sm text-muted">
            <h2 className="font-medium text-ink">Complete score</h2>
            <p className="mt-2 text-xs text-muted">
              Persisted ScoreSnapshot for this version (policy {score.scoringPolicyVersion}). Not calculated in this
              screen.
            </p>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">Overall</span>
              <span>{score.overallScore.toFixed(0)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">Quality</span>
              <span>{score.qualityScore.toFixed(0)}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Authorship integrity {score.authorshipIntegrity.toFixed(0)} · risk {score.authorshipRisk.toFixed(0)} ·
              confidence {score.authorshipConfidence.toFixed(0)}
            </p>
          </Card>
        ) : null}
        {contentAnalysis ? (
          <Card className="p-4 text-sm text-muted">
            <h2 className="font-medium text-ink">Content analysis</h2>
            <p className="mt-2 text-xs text-muted">
              Metric scores for this version. Overall score lives on the ScoreSnapshot above.
            </p>
            {contentAnalysis.articleType ? (
              <p className="mt-3">
                Type: <span className="font-medium text-ink">{contentAnalysis.articleType}</span>
              </p>
            ) : null}
            <ul className="mt-3 space-y-3">
              {contentAnalysis.metrics
                .filter((metric) => metric.metricType !== 'AI_AUTHORSHIP_RISK')
                .map((metric) => (
                  <li key={metric.metricType}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-ink">
                        {metricLabel(metric.metricType)}
                      </span>
                      <span>{metric.score.toFixed(0)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5">{metric.explanation}</p>
                  </li>
                ))}
            </ul>
            {contentAnalysis.detectedTopics.length > 0 ? (
              <p className="mt-3 text-xs">Topics: {contentAnalysis.detectedTopics.join(', ')}</p>
            ) : null}
            {(contentAnalysis.sources ?? []).length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs">
                {(contentAnalysis.sources ?? []).map((source) => (
                  <li key={source.url}>
                    <span className="font-medium text-ink">{source.title}</span>
                    <span className="mt-0.5 block text-muted">
                      {source.verificationStatus.replaceAll('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}
        {contentAnalysis?.authorship ? (
          <Card className="p-4 text-sm text-muted">
            <h2 className="font-medium text-ink">AI authorship risk</h2>
            <p className="mt-2 text-xs leading-5 text-muted">{contentAnalysis.authorship.disclaimer}</p>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">
                {contentAnalysis.authorship.classification
                  ? authorshipClassificationLabel(contentAnalysis.authorship.classification)
                  : 'Risk'}
              </span>
              <span>{contentAnalysis.authorship.riskScore.toFixed(0)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Confidence {contentAnalysis.authorship.confidenceScore.toFixed(0)}
            </p>
            <p className="mt-2 text-xs leading-5">{contentAnalysis.authorship.explanation}</p>
            {contentAnalysis.authorship.signals.length > 0 ? (
              <p className="mt-3 text-xs">Signals: {contentAnalysis.authorship.signals.join(', ')}</p>
            ) : null}
            {contentAnalysis.authorship.detectors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs">
                {contentAnalysis.authorship.detectors.map((detector) => (
                  <li key={detector.name}>
                    <span className="font-medium text-ink">{detector.name}</span>
                    <span className="text-muted">
                      {' '}
                      · risk {detector.riskScore.toFixed(0)} · confidence {detector.confidenceScore.toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}
        {mode === 'edit' ? (
          <Card className="p-4 text-sm text-muted">
            <h2 className="font-medium text-ink">Version history</h2>
            {versions.length === 0 ? (
              <p className="mt-3">No versions yet.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {versions.map((version) => (
                  <li key={version.id}>
                    v{version.versionNumber} · {new Date(version.createdAt).toLocaleString()}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ) : null}
      </aside>
    </form>
  );
}
