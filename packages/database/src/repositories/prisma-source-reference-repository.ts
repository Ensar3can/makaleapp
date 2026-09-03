import type {
  AnalysisRunId,
  SourceReference,
  SourceReferenceId,
  SourceReferenceRepository,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { decimalFromScore, toSourceReference } from '../mappers';

export class PrismaSourceReferenceRepository implements SourceReferenceRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: SourceReferenceId): Promise<SourceReference | null> {
    const row = await this.prisma.sourceReference.findUnique({ where: { id } });
    return row ? toSourceReference(row) : null;
  }

  public async listByAnalysisRunId(
    analysisRunId: AnalysisRunId,
  ): Promise<readonly SourceReference[]> {
    const rows = await this.prisma.sourceReference.findMany({
      where: { analysisRunId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toSourceReference);
  }

  public async saveMany(sources: readonly SourceReference[]): Promise<void> {
    for (const source of sources) {
      const data = {
        articleId: source.articleId,
        analysisRunId: source.analysisRunId,
        url: source.url,
        title: source.title,
        publisher: source.publisher,
        doi: source.doi,
        sourceType: source.sourceType,
        verificationStatus: source.verificationStatus,
        reliabilityScore: source.reliabilityScore ? decimalFromScore(source.reliabilityScore) : null,
        createdAt: source.createdAt,
      };

      await this.prisma.sourceReference.upsert({
        where: { id: source.id },
        create: { id: source.id, ...data },
        update: data,
      });
    }
  }
}
