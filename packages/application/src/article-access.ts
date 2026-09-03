import {
  Article,
  ArticleNotFoundError,
  ArticleStatus,
  EmailNotVerifiedError,
  Permission,
  UnauthenticatedError,
  asArticleId,
  asUserId,
  assertPermission,
  type ArticleRepository,
  type User,
  type UserRepository,
} from '@aip/domain';

export async function requireArticleAuthor(users: UserRepository, actorUserId: string): Promise<User> {
  const user = await users.findById(asUserId(actorUserId));

  if (!user?.isActive()) {
    throw new UnauthenticatedError();
  }

  assertPermission(user.role, Permission.ARTICLE_CREATE);
  return user;
}

export async function loadOwnedArticle(
  articles: ArticleRepository,
  actor: User,
  articleId: string,
): Promise<Article> {
  const article = await articles.findById(asArticleId(articleId));

  if (!article || article.status === ArticleStatus.REMOVED || !article.isOwnedBy(actor.id)) {
    throw new ArticleNotFoundError(articleId);
  }

  return article;
}

export function assertEmailVerified(user: User): void {
  if (!user.emailVerifiedAt) {
    throw new EmailNotVerifiedError();
  }
}
