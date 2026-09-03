import type { PrismaClient } from './generated/client';

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.loginAttempt.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.articleView.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.operationalEvent.deleteMany();
  await prisma.systemHeartbeat.deleteMany();
  await prisma.aiUsageRecord.deleteMany();
  await prisma.moderationReview.deleteMany();
  await prisma.analysisEvidence.deleteMany();
  await prisma.analysisMetric.deleteMany();
  await prisma.sourceReference.deleteMany();
  await prisma.scoreSnapshot.deleteMany();
  await prisma.analysisRun.deleteMany();
  await prisma.analysisJob.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.articleCategory.deleteMany();
  await prisma.articleFile.deleteMany();
  await prisma.articleVersion.deleteMany();
  await prisma.article.deleteMany();
  await prisma.scoringPolicy.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
}
