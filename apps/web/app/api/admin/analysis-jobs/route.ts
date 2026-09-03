import { getRequestSession } from '../../../../lib/auth/session';
import { jsonOk, runApiRoute } from '../../../../lib/http';
import { getObservabilityServices } from '../../../../lib/observability/container';

export async function GET(request: Request) {
  return runApiRoute(request, async () => {
    const session = await getRequestSession(request);
    const status = new URL(request.url).searchParams.get('status') ?? undefined;
    const jobs = await getObservabilityServices().listJobs.execute({
      actorUserId: session.userId,
      status,
    });
    return jsonOk({ jobs });
  });
}
