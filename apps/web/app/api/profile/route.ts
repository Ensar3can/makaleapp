import { updateProfileBodySchema } from '@aip/validation';
import { getAuthServices } from '../../../lib/auth/container';
import { getRequestSession } from '../../../lib/auth/session';
import { jsonOk, mapError, readJson } from '../../../lib/http';

export async function PATCH(request: Request) {
  try {
    const session = await getRequestSession(request);
    const body = updateProfileBodySchema.parse(await readJson(request));
    const profile = await getAuthServices().updateOwnProfile.execute({
      actorUserId: session.userId,
      ...body,
    });
    return jsonOk({ profile });
  } catch (error) {
    return mapError(error);
  }
}
