import { getRequestSession } from '../../../../lib/auth/session';
import { jsonOk, runApiRoute } from '../../../../lib/http';
import { getObservabilityServices } from '../../../../lib/observability/container';

export async function GET(request: Request) {
  return runApiRoute(request, async () => {
    const session = await getRequestSession(request);
    const dashboard = await getObservabilityServices().dashboard.execute({
      actorUserId: session.userId,
    });
    return jsonOk({ dashboard });
  });
}
