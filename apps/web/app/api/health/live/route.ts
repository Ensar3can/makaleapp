import { NextResponse } from 'next/server';
import { runApiRoute } from '../../../../lib/http';

export function GET(request: Request) {
  return runApiRoute(request, async () => NextResponse.json({ status: 'live' }));
}
