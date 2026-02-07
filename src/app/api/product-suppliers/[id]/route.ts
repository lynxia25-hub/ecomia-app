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
    .from('product_suppliers')
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load supplier' }, { status: 500 });
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

  return NextResponse.json({ supplier: data as ProductSupplierRow });
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

  const { data: supplier, error: supplierError } = await supabase
    .from('product_suppliers')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (supplierError) {
    return NextResponse.json({ error: 'Failed to load supplier' }, { status: 500 });
  }

  if (!supplier) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', supplier.session_id)
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

  if (payload.website !== undefined) {
    update.website = typeof payload.website === 'string' ? payload.website.trim() : null;
  }

  if (payload.contact !== undefined) {
    update.contact = typeof payload.contact === 'string' ? payload.contact.trim() : null;
  }

  if (payload.price_range !== undefined) {
    update.price_range = typeof payload.price_range === 'string' ? payload.price_range.trim() : null;
  }

  if (payload.notes !== undefined) {
    update.notes = typeof payload.notes === 'string' ? payload.notes.trim() : null;
  }

  if (payload.candidate_id !== undefined) {
    update.candidate_id = typeof payload.candidate_id === 'string'
      ? payload.candidate_id.trim() || null
      : null;
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
    .from('product_suppliers')
    .update(update)
    .eq('id', id)
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ supplier: data as ProductSupplierRow });
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

  const { data: supplier, error: supplierError } = await supabase
    .from('product_suppliers')
    .select('id, session_id')
    .eq('id', id)
    .maybeSingle();

  if (supplierError) {
    return NextResponse.json({ error: 'Failed to load supplier' }, { status: 500 });
  }

  if (!supplier) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', supplier.session_id)
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
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
