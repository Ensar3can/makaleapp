import {
  UnauthenticatedError,
  Permission,
  type User,
  type UserRepository,
  asUserId,
} from '@aip/domain';
import { requirePermission } from './authorization';

export async function requireModerator(users: UserRepository, actorUserId: string): Promise<User> {
  const user = await users.findById(asUserId(actorUserId));

  if (!user?.isActive()) {
    throw new UnauthenticatedError();
  }

  requirePermission(user, Permission.ARTICLE_MODERATE);
  return user;
}
