import { getArticleServices } from '../../../lib/articles/container';
import { getRequestSession } from '../../../lib/auth/session';
import { jsonOk, mapError } from '../../../lib/http';

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    const categories = await getArticleServices().listActiveCategories.execute({
      actorUserId: session.userId,
    });
    return jsonOk({ categories });
  } catch (error) {
    return mapError(error);
  }
}
