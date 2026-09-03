import { requireRole } from '@aip/application';
import { Role } from '@aip/domain';
import { getRequestSession } from '../../../../lib/auth/session';
import { jsonOk, mapError } from '../../../../lib/http';

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    requireRole(session, Role.ADMIN);
    return jsonOk({ user: session.user, profile: session.profile });
  } catch (error) {
    return mapError(error);
  }
}
