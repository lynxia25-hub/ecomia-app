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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load landing pages' }, { status: 500 });
  }

  return NextResponse.json({ landingPages: (data || []) as LandingPageRow[] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as unknown));
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';

  if (!title) {
    return NextResponse.json({ error: 'Missing title' }, { status: 400 });
  }

  const slug = normalizeSlug(typeof payload.slug === 'string' ? payload.slug : null);
  if (payload.slug && !slug) {
    return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
  }

  const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : 'draft';
  if (!LANDING_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const content = payload.content ? asRecord(payload.content) : null;
  if (payload.content && !content) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }

  const storeId = typeof payload.store_id === 'string' && payload.store_id.trim()
    ? payload.store_id.trim()
    : null;
  if (storeId) {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (storeError) {
      return NextResponse.json({ error: 'Failed to validate store' }, { status: 500 });
    }
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 400 });
    }
  }

  if (slug) {
    const { data: existing, error: slugError } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('slug', slug)
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
    .insert({
      user_id: user.id,
      store_id: storeId,
      title,
      slug,
      status,
      content: content || {},
    })
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create landing page' }, { status: 500 });
  }

  return NextResponse.json({ landingPage: data as LandingPageRow }, { status: 201 });
}
