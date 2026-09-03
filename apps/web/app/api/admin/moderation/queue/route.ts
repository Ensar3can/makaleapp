import { getModerationServices } from '../../../../../lib/moderation/container';
import { getRequestSession } from '../../../../../lib/auth/session';
import { jsonOk, mapError } from '../../../../../lib/http';

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    const items = await getModerationServices().listQueue.execute({
      actorUserId: session.userId,
    });
    return jsonOk({ items });
  } catch (error) {
    return mapError(error);
  }
}
