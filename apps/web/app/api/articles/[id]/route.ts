import { updateArticleDraftBodySchema } from '@aip/validation';
import { getArticleServices } from '../../../../lib/articles/container';
import { getRequestSession } from '../../../../lib/auth/session';
import { jsonOk, mapError, readJson } from '../../../../lib/http';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getRequestSession(request);
    const { id } = await context.params;
    const article = await getArticleServices().getAuthorArticle.execute({
      actorUserId: session.userId,
      articleId: id,
    });
    return jsonOk({ article });
  } catch (error) {
    return mapError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getRequestSession(request);
    const { id } = await context.params;
    const body = updateArticleDraftBodySchema.parse(await readJson(request));
    const article = await getArticleServices().updateDraft.execute({
      actorUserId: session.userId,
      articleId: id,
      ...body,
    });
    return jsonOk({ article });
  } catch (error) {
    return mapError(error);
  }
}
