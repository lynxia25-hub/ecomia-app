import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ResearchSessionRow = {
  id: string;
  user_id: string;
  goal: string;
  status: string;
  notes: string | null;
  selected_candidate_id: string | null;
  created_at: string;
  updated_at: string;
};

const SESSION_STATUSES = new Set(['draft', 'researching', 'proposed', 'selected', 'completed']);

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
    .from('research_sessions')
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ session: data as ResearchSessionRow });
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

  const body = await req.json().catch(() => ({} as unknown));
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const update: Record<string, unknown> = {};

  if (typeof payload.goal === 'string' && payload.goal.trim()) {
    update.goal = payload.goal.trim();
  }

  if (typeof payload.status === 'string' && payload.status.trim()) {
    const status = payload.status.trim().toLowerCase();
    if (!SESSION_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = status;
  }

  if (payload.notes !== undefined) {
    update.notes = typeof payload.notes === 'string' ? payload.notes.trim() : null;
  }

  if (payload.selected_candidate_id !== undefined) {
    update.selected_candidate_id = typeof payload.selected_candidate_id === 'string'
      ? payload.selected_candidate_id.trim() || null
      : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('research_sessions')
    .update(update)
    .eq('id', id)
    .eq('user_id', effectiveUserId)
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ session: data as ResearchSessionRow });
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

  const { data, error } = await supabase
    .from('research_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', effectiveUserId)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
