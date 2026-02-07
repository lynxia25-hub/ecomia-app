import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ResearchSourceRow = {
  id: string;
  session_id: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  data: Record<string, unknown>;
  created_at: string;
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
    .from('research_sources')
    .select('id, session_id, title, url, summary, data, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load source' }, { status: 500 });
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

  return NextResponse.json({ source: data as ResearchSourceRow });
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

  const { data: source, error: sourceError } = await supabase
    .from('research_sources')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (sourceError) {
    return NextResponse.json({ error: 'Failed to load source' }, { status: 500 });
  }

  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', source.session_id)
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

  if (payload.title !== undefined) {
    update.title = typeof payload.title === 'string' ? payload.title.trim() : null;
  }

  if (payload.url !== undefined) {
    update.url = typeof payload.url === 'string' ? payload.url.trim() : null;
  }

  if (payload.summary !== undefined) {
    update.summary = typeof payload.summary === 'string' ? payload.summary.trim() : null;
  }

  if (payload.data !== undefined) {
    const data = asRecord(payload.data);
    if (!data) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    update.data = data;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('research_sources')
    .update(update)
    .eq('id', id)
    .select('id, session_id, title, url, summary, data, created_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ source: data as ResearchSourceRow });
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

  const { data: source, error: sourceError } = await supabase
    .from('research_sources')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (sourceError) {
    return NextResponse.json({ error: 'Failed to load source' }, { status: 500 });
  }

  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', source.session_id)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('research_sources')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
