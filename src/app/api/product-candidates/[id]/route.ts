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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('product_candidates')
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', data.session_id)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ candidate: data as ProductCandidateRow });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from('product_candidates')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (candidateError) {
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 });
  }

  if (!candidate) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', candidate.session_id)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({} as unknown));
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const update: Record<string, unknown> = {};

  if (typeof payload.name === 'string' && payload.name.trim()) {
    update.name = payload.name.trim();
  }

  if (payload.summary !== undefined) {
    update.summary = typeof payload.summary === 'string' ? payload.summary.trim() : null;
  }

  if (payload.pros !== undefined) {
    update.pros = typeof payload.pros === 'string' ? payload.pros.trim() : null;
  }

  if (payload.cons !== undefined) {
    update.cons = typeof payload.cons === 'string' ? payload.cons.trim() : null;
  }

  if (payload.price_range !== undefined) {
    update.price_range = typeof payload.price_range === 'string' ? payload.price_range.trim() : null;
  }

  if (payload.demand_level !== undefined) {
    update.demand_level = typeof payload.demand_level === 'string' ? payload.demand_level.trim() : null;
  }

  if (payload.competition_level !== undefined) {
    update.competition_level = typeof payload.competition_level === 'string' ? payload.competition_level.trim() : null;
  }

  if (payload.score !== undefined) {
    update.score = typeof payload.score === 'number' ? payload.score : null;
  }

  if (payload.meta !== undefined) {
    const meta = asRecord(payload.meta);
    if (!meta) {
      return NextResponse.json({ error: 'Invalid meta' }, { status: 400 });
    }
    update.meta = meta;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('product_candidates')
    .update(update)
    .eq('id', id)
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ candidate: data as ProductCandidateRow });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from('product_candidates')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (candidateError) {
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 });
  }

  if (!candidate) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', candidate.session_id)
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
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
