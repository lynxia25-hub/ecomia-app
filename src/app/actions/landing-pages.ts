'use server';

import { revalidatePath } from 'next/cache';
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

export type LandingFormState = {
  ok?: boolean;
  error?: string;
};

export type GuidedLandingFormState = {
  ok?: boolean;
  error?: string;
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

export async function listLandingPages() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load landing pages' } as const;

  return { landingPages: (data || []) as LandingPageRow[] } as const;
}

export async function createLandingPage(input: {
  title: string;
  store_id?: string | null;
  slug?: string | null;
  status?: string;
  content?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const title = input.title.trim();
  if (!title) return { error: 'Missing title' } as const;

  const slug = normalizeSlug(input.slug);
  if (input.slug && !slug) {
    return { error: 'Invalid slug format' } as const;
  }

  const status = input.status?.trim().toLowerCase() || 'draft';
  if (!LANDING_STATUSES.has(status)) {
    return { error: 'Invalid status' } as const;
  }

  const content = input.content ? asRecord(input.content) : null;
  if (input.content && !content) return { error: 'Invalid content' } as const;

  const storeId = input.store_id?.trim() || null;
  if (storeId) {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (storeError) return { error: 'Failed to validate store' } as const;
    if (!store) return { error: 'Store not found' } as const;
  }

  if (slug) {
    const { data: existing, error: slugError } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (slugError) return { error: 'Failed to validate slug' } as const;
    if (existing) return { error: 'Slug already in use' } as const;
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

  if (error) return { error: 'Failed to create landing page' } as const;

  revalidatePath('/landing');
  return { landingPage: data as LandingPageRow } as const;
}

export async function updateLandingPage(input: {
  id: string;
  title?: string;
  store_id?: string | null;
  slug?: string | null;
  status?: string;
  content?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const update: Record<string, unknown> = {};
  if (input.title && input.title.trim()) update.title = input.title.trim();
  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);
    if (input.slug && !slug) return { error: 'Invalid slug format' } as const;
    update.slug = slug;
  }
  if (input.status && input.status.trim()) {
    const status = input.status.trim().toLowerCase();
    if (!LANDING_STATUSES.has(status)) return { error: 'Invalid status' } as const;
    update.status = status;
  }
  if (input.store_id !== undefined) {
    update.store_id = input.store_id?.trim() || null;
  }

  if (input.content !== undefined) {
    const content = asRecord(input.content);
    if (!content) return { error: 'Invalid content' } as const;
    update.content = content;
  }

  if (Object.keys(update).length === 0) {
    return { error: 'No valid updates' } as const;
  }

  if (update.store_id) {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', update.store_id as string)
      .eq('user_id', user.id)
      .maybeSingle();
    if (storeError) return { error: 'Failed to validate store' } as const;
    if (!store) return { error: 'Store not found' } as const;
  }

  if (update.slug) {
    const { data: existing, error: slugError } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('slug', update.slug as string)
      .neq('id', input.id)
      .maybeSingle();
    if (slugError) return { error: 'Failed to validate slug' } as const;
    if (existing) return { error: 'Slug already in use' } as const;
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .update(update)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .maybeSingle();

  if (error) return { error: 'Failed to update landing page' } as const;
  if (!data) return { error: 'Not found' } as const;

  revalidatePath('/landing');
  return { landingPage: data as LandingPageRow } as const;
}

export async function deleteLandingPage(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) return { error: 'Failed to delete landing page' } as const;
  if (!data) return { error: 'Not found' } as const;

  revalidatePath('/landing');
  return { ok: true } as const;
}

export async function createLandingFromForm(
  _prevState: LandingFormState,
  formData: FormData
) {
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const storeId = String(formData.get('store_id') || '').trim();
  const status = String(formData.get('status') || '').trim();

  const result = await createLandingPage({
    title,
    slug: slug || null,
    store_id: storeId || null,
    status: status || undefined,
  });

  if ('error' in result) {
    return { error: result.error } as LandingFormState;
  }

  return { ok: true } as LandingFormState;
}

export async function updateLandingFromForm(
  _prevState: LandingFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const storeId = String(formData.get('store_id') || '').trim();
  const status = String(formData.get('status') || '').trim();

  if (!id) {
    return { error: 'Missing landing id' } as LandingFormState;
  }

  const result = await updateLandingPage({
    id,
    title: title || undefined,
    slug: slug || null,
    store_id: storeId || null,
    status: status || undefined,
  });

  if ('error' in result) {
    return { error: result.error } as LandingFormState;
  }

  return { ok: true } as LandingFormState;
}

export async function deleteLandingFromForm(
  _prevState: LandingFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  if (!id) {
    return { error: 'Missing landing id' } as LandingFormState;
  }

  const result = await deleteLandingPage(id);
  if ('error' in result) {
    return { error: result.error } as LandingFormState;
  }

  return { ok: true } as LandingFormState;
}

function normalizeAccent(value?: string | null) {
  const raw = value?.trim() || '';
  if (!raw) return null;
  const accent = raw.startsWith('#') ? raw : `#${raw}`;
  if (!/^#[0-9a-fA-F]{3,8}$/.test(accent)) return null;
  return accent;
}

function normalizeUrl(value?: string | null) {
  const raw = value?.trim() || '';
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return null;
  return raw;
}

function normalizeEmail(value?: string | null) {
  const raw = value?.trim().toLowerCase() || '';
  if (!raw) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return null;
  return raw;
}

function normalizePrice(value?: string | null) {
  const raw = value?.replace(/[^0-9.,]/g, '').replace(',', '.') || '';
  if (!raw) return null;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

export async function updateLandingGuidedFromForm(
  _prevState: GuidedLandingFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const heroTitle = String(formData.get('hero_title') || '').trim();
  const heroSubtitle = String(formData.get('hero_subtitle') || '').trim();
  const heroCta = String(formData.get('hero_cta') || '').trim();
  const accentRaw = String(formData.get('accent_color') || '').trim();
  const heroImageRaw = String(formData.get('hero_image_url') || '').trim();

  if (!id) {
    return { error: 'Missing landing id' } as GuidedLandingFormState;
  }

  const accent = accentRaw ? normalizeAccent(accentRaw) : null;
  if (accentRaw && !accent) {
    return { error: 'Color invalido. Usa un valor hex (#0f172a).' } as GuidedLandingFormState;
  }

  const heroImageUrl = heroImageRaw ? normalizeUrl(heroImageRaw) : null;
  if (heroImageRaw && !heroImageUrl) {
    return { error: 'URL invalida. Usa https://...' } as GuidedLandingFormState;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedLandingFormState;

  const { data: landing, error: landingError } = await supabase
    .from('landing_pages')
    .select('id, content')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (landingError) return { error: 'Failed to load landing' } as GuidedLandingFormState;
  if (!landing) return { error: 'Not found' } as GuidedLandingFormState;

  const existingContent = asRecord(landing.content) || {};
  const existingHero = asRecord(existingContent.hero) || {};
  const existingTheme = asRecord(existingContent.theme) || {};
  const existingMedia = asRecord(existingContent.media) || {};

  const nextContent = {
    ...existingContent,
    hero: {
      ...existingHero,
      title: heroTitle || existingHero.title || '',
      subtitle: heroSubtitle || existingHero.subtitle || '',
      cta: heroCta || existingHero.cta || '',
    },
    theme: {
      ...existingTheme,
      accent: accent || existingTheme.accent || null,
    },
    media: {
      ...existingMedia,
      hero_image_url: heroImageUrl || existingMedia.hero_image_url || null,
    },
  };

  const { error } = await supabase
    .from('landing_pages')
    .update({ content: nextContent })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update landing content' } as GuidedLandingFormState;

  revalidatePath('/landing');
  return { ok: true } as GuidedLandingFormState;
}

export async function publishLandingFromForm(
  _prevState: GuidedLandingFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  if (!id) {
    return { error: 'Missing landing id' } as GuidedLandingFormState;
  }

  const seoTitle = String(formData.get('seo_title') || '').trim();
  const seoDescription = String(formData.get('seo_description') || '').trim();
  const legalBusiness = String(formData.get('legal_business') || '').trim();
  const legalEmailRaw = String(formData.get('legal_email') || '').trim();
  const legalTermsRaw = String(formData.get('legal_terms_url') || '').trim();
  const legalPrivacyRaw = String(formData.get('legal_privacy_url') || '').trim();
  const legalRefundRaw = String(formData.get('legal_refund_url') || '').trim();

  const legalEmail = legalEmailRaw ? normalizeEmail(legalEmailRaw) : null;
  if (legalEmailRaw && !legalEmail) {
    return { error: 'Email legal invalido' } as GuidedLandingFormState;
  }

  const legalTermsUrl = legalTermsRaw ? normalizeUrl(legalTermsRaw) : null;
  if (legalTermsRaw && !legalTermsUrl) {
    return { error: 'URL de terminos invalida' } as GuidedLandingFormState;
  }

  const legalPrivacyUrl = legalPrivacyRaw ? normalizeUrl(legalPrivacyRaw) : null;
  if (legalPrivacyRaw && !legalPrivacyUrl) {
    return { error: 'URL de privacidad invalida' } as GuidedLandingFormState;
  }

  const legalRefundUrl = legalRefundRaw ? normalizeUrl(legalRefundRaw) : null;
  if (legalRefundRaw && !legalRefundUrl) {
    return { error: 'URL de devoluciones invalida' } as GuidedLandingFormState;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedLandingFormState;

  const { data: landing, error: landingError } = await supabase
    .from('landing_pages')
    .select('id, title, slug, content')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (landingError) return { error: 'Failed to load landing' } as GuidedLandingFormState;
  if (!landing) return { error: 'Not found' } as GuidedLandingFormState;

  const existingContent = asRecord(landing.content) || {};
  const existingHero = asRecord(existingContent.hero) || {};
  const existingSeo = asRecord(existingContent.seo) || {};
  const existingLegal = asRecord(existingContent.legal) || {};

  const fallbackDescription = typeof existingHero.subtitle === 'string'
    ? existingHero.subtitle.trim()
    : '';

  const nextContent = {
    ...existingContent,
    seo: {
      ...existingSeo,
      title: seoTitle || existingSeo.title || landing.title,
      description: seoDescription || existingSeo.description || fallbackDescription || 'Landing lista para convertir visitas en ventas.',
    },
    legal: {
      ...existingLegal,
      business_name: legalBusiness || existingLegal.business_name || landing.title,
      contact_email: legalEmail || existingLegal.contact_email || null,
      terms_url: legalTermsUrl || existingLegal.terms_url || null,
      privacy_url: legalPrivacyUrl || existingLegal.privacy_url || null,
      refund_url: legalRefundUrl || existingLegal.refund_url || null,
      notice: existingLegal.notice || 'Consulta terminos, privacidad y devoluciones antes de comprar.',
    },
  };

  const { error } = await supabase
    .from('landing_pages')
    .update({ status: 'published', content: nextContent })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to publish landing' } as GuidedLandingFormState;

  revalidatePath('/landing');
  if (landing.slug) {
    revalidatePath(`/l/${landing.slug}`);
  }
  return { ok: true } as GuidedLandingFormState;
}

export async function updateLandingCheckoutFromForm(
  _prevState: GuidedLandingFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  if (!id) {
    return { error: 'Missing landing id' } as GuidedLandingFormState;
  }

  const enabled = String(formData.get('checkout_enabled') || '') === 'on';
  const priceRaw = String(formData.get('checkout_price') || '').trim();
  const productName = String(formData.get('checkout_product') || '').trim();
  const source = String(formData.get('checkout_source') || '').trim();

  const price = priceRaw ? normalizePrice(priceRaw) : null;
  if (priceRaw && !price) {
    return { error: 'Precio invalido' } as GuidedLandingFormState;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedLandingFormState;

  const { data: landing, error: landingError } = await supabase
    .from('landing_pages')
    .select('id, content')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (landingError) return { error: 'Failed to load landing' } as GuidedLandingFormState;
  if (!landing) return { error: 'Not found' } as GuidedLandingFormState;

  const existingContent = asRecord(landing.content) || {};
  const existingProduct = asRecord(existingContent.product) || {};
  const existingCheckout = asRecord(existingContent.checkout) || {};

  const nextContent = {
    ...existingContent,
    product: {
      ...existingProduct,
      name: productName || existingProduct.name || '',
      source: source || existingProduct.source || 'research',
    },
    checkout: {
      ...existingCheckout,
      enabled,
      price_cop: price ?? existingCheckout.price_cop ?? null,
      product_name: productName || existingCheckout.product_name || existingProduct.name || '',
      source: source || existingCheckout.source || 'research',
    },
  };

  const { error } = await supabase
    .from('landing_pages')
    .update({ content: nextContent })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update checkout' } as GuidedLandingFormState;

  revalidatePath('/landing');
  return { ok: true } as GuidedLandingFormState;
}
