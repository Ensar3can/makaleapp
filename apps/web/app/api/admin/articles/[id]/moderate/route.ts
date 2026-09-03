import { moderateArticleBodySchema } from '@aip/validation';
import { hashClientIp } from '../../../../../../lib/audit-ip';
import { getModerationServices } from '../../../../../../lib/moderation/container';
import { getRequestSession } from '../../../../../../lib/auth/session';
import { clientIp, jsonOk, mapError, readJson } from '../../../../../../lib/http';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getRequestSession(request);
    const { id } = await context.params;
    const body = moderateArticleBodySchema.parse(await readJson(request));
    const result = await getModerationServices().moderateArticle.execute({
      actorUserId: session.userId,
      articleId: id,
      decision: body.decision,
      reason: body.reason,
      notes: body.notes,
      ipHash: hashClientIp(clientIp(request)),
    });
    return jsonOk({ result });
  } catch (error) {
    return mapError(error);
  }
}
