import type { Profile, ProfileId, ProfileRepository, Slug, UserId } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toProfile } from '../mappers';

export class PrismaProfileRepository implements ProfileRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: ProfileId): Promise<Profile | null> {
    const row = await this.prisma.profile.findUnique({ where: { id } });
    return row ? toProfile(row) : null;
  }

  public async findByUserId(userId: UserId): Promise<Profile | null> {
    const row = await this.prisma.profile.findUnique({ where: { userId } });
    return row ? toProfile(row) : null;
  }

  public async findManyByUserIds(userIds: readonly UserId[]): Promise<readonly Profile[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.profile.findMany({
      where: { userId: { in: [...userIds] } },
    });

    return rows.map(toProfile);
  }

  public async findByUsername(username: Slug): Promise<Profile | null> {
    const row = await this.prisma.profile.findUnique({ where: { username: username.value } });
    return row ? toProfile(row) : null;
  }

  public async save(profile: Profile): Promise<void> {
    const data = {
      userId: profile.userId,
      displayName: profile.displayName,
      username: profile.username.value,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      websiteUrl: profile.websiteUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    await this.prisma.profile.upsert({
      where: { id: profile.id },
      create: { id: profile.id, ...data },
      update: data,
    });
  }
}
