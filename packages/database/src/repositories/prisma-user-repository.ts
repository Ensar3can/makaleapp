import type { EmailAddress, User, UserId, UserRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toUser } from '../mappers';

export class PrismaUserRepository implements UserRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  public async findByEmail(email: EmailAddress): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.value } });
    return row ? toUser(row) : null;
  }

  public async save(user: User): Promise<void> {
    const data = {
      email: user.email.value,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...data },
      update: data,
    });
  }
}
