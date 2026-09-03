import { getRequestSession } from '../../../../../../lib/auth/session';
import { jsonOk, runApiRoute } from '../../../../../../lib/http';
import { getObservabilityServices } from '../../../../../../lib/observability/container';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return runApiRoute(request, async () => {
    const session = await getRequestSession(request);
    const { id } = await context.params;
    const result = await getObservabilityServices().retryJob.execute({
      actorUserId: session.userId,
      analysisJobId: id,
    });
    return jsonOk(result);
  });
}
