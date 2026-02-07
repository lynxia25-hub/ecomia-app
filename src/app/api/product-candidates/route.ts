import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ProductCandidateRow = {
  id: string;
  session_id: string;
  name: string;
  summary: string | null;
  pros: string | null;
  cons: string | null;
  price_range: string | null;
  demand_level: string | null;
  competition_level: string | null;
  score: number | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id')?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('product_candidates')
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 });
  }

  return NextResponse.json({ candidates: (data || []) as ProductCandidateRow[] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as unknown));
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const sessionId = typeof payload.session_id === 'string' ? payload.session_id.trim() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const meta = payload.meta ? asRecord(payload.meta) : null;
  if (payload.meta && !meta) {
    return NextResponse.json({ error: 'Invalid meta' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('product_candidates')
    .insert({
      session_id: sessionId,
      name,
      summary: typeof payload.summary === 'string' ? payload.summary.trim() : null,
      pros: typeof payload.pros === 'string' ? payload.pros.trim() : null,
      cons: typeof payload.cons === 'string' ? payload.cons.trim() : null,
      price_range: typeof payload.price_range === 'string' ? payload.price_range.trim() : null,
      demand_level: typeof payload.demand_level === 'string' ? payload.demand_level.trim() : null,
      competition_level: typeof payload.competition_level === 'string' ? payload.competition_level.trim() : null,
      score: typeof payload.score === 'number' ? payload.score : null,
      meta: meta || {},
    })
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }

  return NextResponse.json({ candidate: data as ProductCandidateRow }, { status: 201 });
}
