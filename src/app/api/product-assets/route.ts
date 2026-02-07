import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ProductAssetRow = {
  id: string;
  session_id: string;
  candidate_id: string | null;
  asset_type: string;
  url: string | null;
  content: Record<string, unknown>;
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
  const candidateId = url.searchParams.get('candidate_id')?.trim();

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

  let query = supabase
    .from('product_assets')
    .select('id, session_id, candidate_id, asset_type, url, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (candidateId) {
    query = query.eq('candidate_id', candidateId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 });
  }

  return NextResponse.json({ assets: (data || []) as ProductAssetRow[] });
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
  const assetType = typeof payload.asset_type === 'string' ? payload.asset_type.trim() : '';

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  if (!assetType) {
    return NextResponse.json({ error: 'Missing asset_type' }, { status: 400 });
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

  const content = payload.content ? asRecord(payload.content) : null;
  if (payload.content && !content) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }

  const { data: created, error } = await supabase
    .from('product_assets')
    .insert({
      session_id: sessionId,
      candidate_id: typeof payload.candidate_id === 'string' ? payload.candidate_id.trim() : null,
      asset_type: assetType,
      url: typeof payload.url === 'string' ? payload.url.trim() : null,
      content: content || {},
    })
    .select('id, session_id, candidate_id, asset_type, url, content, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }

  return NextResponse.json({ asset: created as ProductAssetRow }, { status: 201 });
}
