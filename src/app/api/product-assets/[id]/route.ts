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
    .from('product_assets')
    .select('id, session_id, candidate_id, asset_type, url, content, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load asset' }, { status: 500 });
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

  return NextResponse.json({ asset: data as ProductAssetRow });
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

  const { data: asset, error: assetError } = await supabase
    .from('product_assets')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (assetError) {
    return NextResponse.json({ error: 'Failed to load asset' }, { status: 500 });
  }

  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', asset.session_id)
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

  if (typeof payload.asset_type === 'string' && payload.asset_type.trim()) {
    update.asset_type = payload.asset_type.trim();
  }

  if (payload.url !== undefined) {
    update.url = typeof payload.url === 'string' ? payload.url.trim() : null;
  }

  if (payload.candidate_id !== undefined) {
    update.candidate_id = typeof payload.candidate_id === 'string'
      ? payload.candidate_id.trim() || null
      : null;
  }

  if (payload.content !== undefined) {
    const content = asRecord(payload.content);
    if (!content) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }
    update.content = content;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('product_assets')
    .update(update)
    .eq('id', id)
    .select('id, session_id, candidate_id, asset_type, url, content, created_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ asset: data as ProductAssetRow });
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

  const { data: asset, error: assetError } = await supabase
    .from('product_assets')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (assetError) {
    return NextResponse.json({ error: 'Failed to load asset' }, { status: 500 });
  }

  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', asset.session_id)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('product_assets')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
