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
    .from('research_sources')
    .select('id, session_id, title, url, summary, data, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load sources' }, { status: 500 });
  }

  return NextResponse.json({ sources: (data || []) as ResearchSourceRow[] });
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

  const data = payload.data ? asRecord(payload.data) : null;
  if (payload.data && !data) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { data: created, error } = await supabase
    .from('research_sources')
    .insert({
      session_id: sessionId,
      title: typeof payload.title === 'string' ? payload.title.trim() : null,
      url: typeof payload.url === 'string' ? payload.url.trim() : null,
      summary: typeof payload.summary === 'string' ? payload.summary.trim() : null,
      data: data || {},
    })
    .select('id, session_id, title, url, summary, data, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }

  return NextResponse.json({ source: created as ResearchSourceRow }, { status: 201 });
}
