import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type LandingPageRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  title: string;
  slug: string | null;
  content: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
};

const LANDING_STATUSES = new Set(['draft', 'published', 'archived']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value?: string | null) {
  const slug = value?.trim().toLowerCase() || '';
  if (!slug) return null;
  return SLUG_PATTERN.test(slug) ? slug : null;
}

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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load landing page' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ landingPage: data as LandingPageRow });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as unknown));
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const update: Record<string, unknown> = {};

  if (typeof payload.title === 'string' && payload.title.trim()) {
    update.title = payload.title.trim();
  }

  if (typeof payload.slug === 'string') {
    const slug = normalizeSlug(payload.slug);
    if (payload.slug && !slug) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }
    update.slug = slug;
  }

  if (typeof payload.status === 'string' && payload.status.trim()) {
    const status = payload.status.trim().toLowerCase();
    if (!LANDING_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = status;
  }

  if (typeof payload.store_id === 'string') {
    update.store_id = payload.store_id.trim() ? payload.store_id.trim() : null;
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

  if (update.store_id) {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', update.store_id as string)
      .eq('user_id', user.id)
      .maybeSingle();
    if (storeError) {
      return NextResponse.json({ error: 'Failed to validate store' }, { status: 500 });
    }
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 400 });
    }
  }

  if (update.slug) {
    const { data: existing, error: slugError } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('slug', update.slug as string)
      .neq('id', id)
      .maybeSingle();
    if (slugError) {
      return NextResponse.json({ error: 'Failed to validate slug' }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update landing page' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ landingPage: data as LandingPageRow });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to delete landing page' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
