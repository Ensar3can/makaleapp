import { articleDraftBodySchema } from '@aip/validation';
import { getArticleServices } from '../../../lib/articles/container';
import { getRequestSession } from '../../../lib/auth/session';
import { jsonOk, mapError, readJson } from '../../../lib/http';

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    const articles = await getArticleServices().listAuthorArticles.execute({
      actorUserId: session.userId,
    });
    return jsonOk({ articles });
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);
    const body = articleDraftBodySchema.parse(await readJson(request));
    const article = await getArticleServices().createDraft.execute({
      actorUserId: session.userId,
      ...body,
    });
    return jsonOk({ article }, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
