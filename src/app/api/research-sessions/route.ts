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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('research_sessions')
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .eq('user_id', effectiveUserId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }

  return NextResponse.json({ sessions: (data || []) as ResearchSessionRow[] });
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
  const goal = typeof payload.goal === 'string' ? payload.goal.trim() : '';

  if (!goal) {
    return NextResponse.json({ error: 'Missing goal' }, { status: 400 });
  }

  const status = typeof payload.status === 'string'
    ? payload.status.trim().toLowerCase()
    : 'draft';

  if (!SESSION_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : null;

  const { data, error } = await supabase
    .from('research_sessions')
    .insert({
      user_id: effectiveUserId,
      goal,
      status,
      notes,
    })
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  return NextResponse.json({ session: data as ResearchSessionRow }, { status: 201 });
}
