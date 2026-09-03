import { getArticleServices } from '../../../../../lib/articles/container';
import { getRequestSession } from '../../../../../lib/auth/session';
import { jsonOk, mapError } from '../../../../../lib/http';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getRequestSession(request);
    const { id } = await context.params;
    const article = await getArticleServices().submitArticle.execute({
      actorUserId: session.userId,
      articleId: id,
    });
    return jsonOk({ article });
  } catch (error) {
    return mapError(error);
  }
}
