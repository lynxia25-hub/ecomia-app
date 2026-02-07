import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ProductSupplierRow = {
  id: string;
  session_id: string;
  candidate_id: string | null;
  name: string;
  website: string | null;
  contact: string | null;
  price_range: string | null;
  notes: string | null;
  data: Record<string, unknown>;
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
    .from('product_suppliers')
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load suppliers' }, { status: 500 });
  }

  return NextResponse.json({ suppliers: (data || []) as ProductSupplierRow[] });
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

  const data = payload.data ? asRecord(payload.data) : null;
  if (payload.data && !data) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { data: created, error } = await supabase
    .from('product_suppliers')
    .insert({
      session_id: sessionId,
      candidate_id: typeof payload.candidate_id === 'string' ? payload.candidate_id.trim() : null,
      name,
      website: typeof payload.website === 'string' ? payload.website.trim() : null,
      contact: typeof payload.contact === 'string' ? payload.contact.trim() : null,
      price_range: typeof payload.price_range === 'string' ? payload.price_range.trim() : null,
      notes: typeof payload.notes === 'string' ? payload.notes.trim() : null,
      data: data || {},
    })
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }

  return NextResponse.json({ supplier: created as ProductSupplierRow }, { status: 201 });
}
