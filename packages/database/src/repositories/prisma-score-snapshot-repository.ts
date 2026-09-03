import type {
  AnalysisRunId,
  ArticleVersionId,
  ScoreSnapshot,
  ScoreSnapshotId,
  ScoreSnapshotRepository,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { decimalFromScore, toScoreSnapshot } from '../mappers';

export class PrismaScoreSnapshotRepository implements ScoreSnapshotRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: ScoreSnapshotId): Promise<ScoreSnapshot | null> {
    const row = await this.prisma.scoreSnapshot.findUnique({ where: { id } });
    return row ? toScoreSnapshot(row) : null;
  }

  public async findLatestByArticleVersionId(
    articleVersionId: ArticleVersionId,
  ): Promise<ScoreSnapshot | null> {
    const row = await this.prisma.scoreSnapshot.findFirst({
      where: { articleVersionId },
      orderBy: { createdAt: 'desc' },
    });

    return row ? toScoreSnapshot(row) : null;
  }

  public async findLatestByArticleVersionIds(
    articleVersionIds: readonly ArticleVersionId[],
  ): Promise<readonly ScoreSnapshot[]> {
    if (articleVersionIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.scoreSnapshot.findMany({
      where: { articleVersionId: { in: [...articleVersionIds] } },
      orderBy: { createdAt: 'desc' },
    });
    const latest = new Map<string, (typeof rows)[number]>();

    for (const row of rows) {
      if (!latest.has(row.articleVersionId)) {
        latest.set(row.articleVersionId, row);
      }
    }

    return [...latest.values()].map(toScoreSnapshot);
  }

  public async findByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<ScoreSnapshot | null> {
    const row = await this.prisma.scoreSnapshot.findUnique({ where: { analysisRunId } });
    return row ? toScoreSnapshot(row) : null;
  }

  public async save(snapshot: ScoreSnapshot): Promise<void> {
    const data = {
      articleId: snapshot.articleId,
      articleVersionId: snapshot.articleVersionId,
      analysisRunId: snapshot.analysisRunId,
      qualityScore: decimalFromScore(snapshot.qualityScore),
      authorshipRisk: decimalFromScore(snapshot.authorshipRisk),
      authorshipConfidence: decimalFromScore(snapshot.authorshipConfidence),
      authorshipIntegrity: decimalFromScore(snapshot.authorshipIntegrity),
      authorshipClassification: snapshot.authorshipClassification,
      overallScore: decimalFromScore(snapshot.overallScore),
      scoringPolicyVersion: snapshot.scoringPolicyVersion,
      createdAt: snapshot.createdAt,
    };

    await this.prisma.scoreSnapshot.upsert({
      where: { id: snapshot.id },
      create: { id: snapshot.id, ...data },
      update: data,
    });
  }
}
