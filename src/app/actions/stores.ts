'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type StoreRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type StoreFormState = {
  ok?: boolean;
  error?: string;
};

export type GuidedStoreFormState = {
  ok?: boolean;
  error?: string;
};

const STORE_STATUSES = new Set(['draft', 'active', 'archived']);
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

function normalizeDomain(value?: string | null) {
  const raw = value?.trim().toLowerCase() || '';
  if (!raw) return null;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(raw)) return null;
  return raw;
}

function normalizeEmail(value?: string | null) {
  const raw = value?.trim().toLowerCase() || '';
  if (!raw) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return null;
  return raw;
}

function normalizePaymentProvider(value?: string | null) {
  const raw = value?.trim().toLowerCase() || '';
  if (!raw) return null;
  const allowed = new Set(['stripe', 'mercadopago', 'payu', 'manual', 'other']);
  return allowed.has(raw) ? raw : null;
}

export async function listStores() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('stores')
    .select('id, user_id, name, slug, status, meta, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load stores' } as const;

  return { stores: (data || []) as StoreRow[] } as const;
}

export async function createStore(input: {
  name: string;
  slug?: string | null;
  status?: string;
  meta?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const name = input.name.trim();
  if (!name) return { error: 'Missing name' } as const;

  const slug = normalizeSlug(input.slug);
  if (input.slug && !slug) {
    return { error: 'Invalid slug format' } as const;
  }

  const status = input.status?.trim().toLowerCase() || 'draft';
  if (!STORE_STATUSES.has(status)) {
    return { error: 'Invalid status' } as const;
  }

  const meta = input.meta ? asRecord(input.meta) : null;
  if (input.meta && !meta) return { error: 'Invalid meta' } as const;

  if (slug) {
    const { data: existing, error: slugError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) return { error: 'Failed to validate slug' } as const;
    if (existing) return { error: 'Slug already in use' } as const;
  }

  const { data, error } = await supabase
    .from('stores')
    .insert({
      user_id: user.id,
      name,
      slug,
      status,
      meta: meta || {},
    })
    .select('id, user_id, name, slug, status, meta, created_at, updated_at')
    .single();

  if (error) return { error: 'Failed to create store' } as const;

  revalidatePath('/stores');
  return { store: data as StoreRow } as const;
}

export async function updateStore(input: {
  id: string;
  name?: string;
  slug?: string | null;
  status?: string;
  meta?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const update: Record<string, unknown> = {};
  if (input.name && input.name.trim()) update.name = input.name.trim();
  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);
    if (input.slug && !slug) return { error: 'Invalid slug format' } as const;
    update.slug = slug;
  }
  if (input.status && input.status.trim()) {
    const status = input.status.trim().toLowerCase();
    if (!STORE_STATUSES.has(status)) return { error: 'Invalid status' } as const;
    update.status = status;
  }

  if (input.meta !== undefined) {
    const meta = asRecord(input.meta);
    if (!meta) return { error: 'Invalid meta' } as const;
    update.meta = meta;
  }

  if (Object.keys(update).length === 0) {
    return { error: 'No valid updates' } as const;
  }

  if (update.slug) {
    const { data: existing, error: slugError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', update.slug as string)
      .neq('id', input.id)
      .maybeSingle();

    if (slugError) return { error: 'Failed to validate slug' } as const;
    if (existing) return { error: 'Slug already in use' } as const;
  }

  const { data, error } = await supabase
    .from('stores')
    .update(update)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select('id, user_id, name, slug, status, meta, created_at, updated_at')
    .maybeSingle();

  if (error) return { error: 'Failed to update store' } as const;
  if (!data) return { error: 'Not found' } as const;

  revalidatePath('/stores');
  return { store: data as StoreRow } as const;
}

export async function deleteStore(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) return { error: 'Failed to delete store' } as const;
  if (!data) return { error: 'Not found' } as const;

  revalidatePath('/stores');
  return { ok: true } as const;
}

export async function createStoreFromForm(
  _prevState: StoreFormState,
  formData: FormData
) {
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const status = String(formData.get('status') || '').trim();
  const result = await createStore({
    name,
    slug: slug || null,
    status: status || undefined,
  });

  if ('error' in result) {
    return { error: result.error } as StoreFormState;
  }

  return { ok: true } as StoreFormState;
}

export async function updateStoreFromForm(
  _prevState: StoreFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const status = String(formData.get('status') || '').trim();

  if (!id) {
    return { error: 'Missing store id' } as StoreFormState;
  }

  const result = await updateStore({
    id,
    name: name || undefined,
    slug: slug || null,
    status: status || undefined,
  });

  if ('error' in result) {
    return { error: result.error } as StoreFormState;
  }

  return { ok: true } as StoreFormState;
}

export async function deleteStoreFromForm(
  _prevState: StoreFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  if (!id) {
    return { error: 'Missing store id' } as StoreFormState;
  }

  const result = await deleteStore(id);
  if ('error' in result) {
    return { error: result.error } as StoreFormState;
  }

  return { ok: true } as StoreFormState;
}

export async function updateStoreGuidedFromForm(
  _prevState: GuidedStoreFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const tagline = String(formData.get('tagline') || '').trim();
  const whatsapp = String(formData.get('support_whatsapp') || '').trim();
  const shippingNote = String(formData.get('shipping_note') || '').trim();

  if (!id) {
    return { error: 'Missing store id' } as GuidedStoreFormState;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedStoreFormState;

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, meta')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (storeError) return { error: 'Failed to load store' } as GuidedStoreFormState;
  if (!store) return { error: 'Not found' } as GuidedStoreFormState;

  const existingMeta = asRecord(store.meta) || {};
  const nextMeta = {
    ...existingMeta,
    tagline: tagline || existingMeta.tagline || '',
    support_whatsapp: whatsapp || existingMeta.support_whatsapp || '',
    shipping_note: shippingNote || existingMeta.shipping_note || '',
  };

  const { error } = await supabase
    .from('stores')
    .update({ meta: nextMeta })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update store info' } as GuidedStoreFormState;

  revalidatePath('/stores');
  return { ok: true } as GuidedStoreFormState;
}

export async function updateStoreDomainFromForm(
  _prevState: GuidedStoreFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const domainRaw = String(formData.get('domain_name') || '').trim();
  const mode = String(formData.get('domain_mode') || '').trim();
  const provider = String(formData.get('domain_provider') || '').trim();

  if (!id) {
    return { error: 'Missing store id' } as GuidedStoreFormState;
  }

  const domain = domainRaw ? normalizeDomain(domainRaw) : null;
  if (domainRaw && !domain) {
    return { error: 'Dominio invalido. Ejemplo: mitienda.com' } as GuidedStoreFormState;
  }

  const normalizedMode = mode === 'buy' ? 'buy' : 'connect';
  const normalizedProvider = provider || 'other';
  const status = normalizedMode === 'buy' ? 'needs_purchase' : 'pending';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedStoreFormState;

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, meta')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (storeError) return { error: 'Failed to load store' } as GuidedStoreFormState;
  if (!store) return { error: 'Not found' } as GuidedStoreFormState;

  const existingMeta = asRecord(store.meta) || {};
  const existingDomain = asRecord(existingMeta.domain) || {};

  const nextMeta = {
    ...existingMeta,
    domain: {
      ...existingDomain,
      name: domain,
      mode: normalizedMode,
      provider: normalizedProvider,
      status,
    },
  };

  const { error } = await supabase
    .from('stores')
    .update({ meta: nextMeta })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update domain' } as GuidedStoreFormState;

  revalidatePath('/stores');
  return { ok: true } as GuidedStoreFormState;
}

export async function updateStoreDomainStatusFromForm(
  _prevState: GuidedStoreFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const status = String(formData.get('domain_status') || '').trim();

  if (!id) {
    return { error: 'Missing store id' } as GuidedStoreFormState;
  }

  const allowed = new Set([
    'needs_purchase',
    'pending',
    'verification_requested',
    'verified',
  ]);

  if (!allowed.has(status)) {
    return { error: 'Estado de dominio invalido' } as GuidedStoreFormState;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedStoreFormState;

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, meta')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (storeError) return { error: 'Failed to load store' } as GuidedStoreFormState;
  if (!store) return { error: 'Not found' } as GuidedStoreFormState;

  const existingMeta = asRecord(store.meta) || {};
  const existingDomain = asRecord(existingMeta.domain) || {};

  const nextDomain = {
    ...existingDomain,
    status,
    dns_target: existingDomain.dns_target || 'storefront.ecomia.app',
    verified_at: status === 'verified' ? new Date().toISOString() : existingDomain.verified_at || null,
  };

  const nextMeta = {
    ...existingMeta,
    domain: nextDomain,
  };

  const { error } = await supabase
    .from('stores')
    .update({ meta: nextMeta })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update domain status' } as GuidedStoreFormState;

  revalidatePath('/stores');
  return { ok: true } as GuidedStoreFormState;
}

export async function updateStorePaymentsFromForm(
  _prevState: GuidedStoreFormState,
  formData: FormData
) {
  const id = String(formData.get('id') || '').trim();
  const providerRaw = String(formData.get('payment_provider') || '').trim();
  const accountEmailRaw = String(formData.get('payment_email') || '').trim();
  const statusRaw = String(formData.get('payment_status') || '').trim();

  if (!id) {
    return { error: 'Missing store id' } as GuidedStoreFormState;
  }

  const provider = normalizePaymentProvider(providerRaw);
  if (!provider) {
    return { error: 'Proveedor de pagos invalido' } as GuidedStoreFormState;
  }

  const accountEmail = accountEmailRaw ? normalizeEmail(accountEmailRaw) : null;
  if (accountEmailRaw && !accountEmail) {
    return { error: 'Email invalido' } as GuidedStoreFormState;
  }

  const allowedStatuses = new Set(['pending', 'active']);
  const status = allowedStatuses.has(statusRaw) ? statusRaw : 'pending';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' } as GuidedStoreFormState;

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, meta')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (storeError) return { error: 'Failed to load store' } as GuidedStoreFormState;
  if (!store) return { error: 'Not found' } as GuidedStoreFormState;

  const existingMeta = asRecord(store.meta) || {};
  const existingPayments = asRecord(existingMeta.payments) || {};

  const nextPayments = {
    ...existingPayments,
    provider,
    status,
    account_email: accountEmail,
    connected_at: status === 'active'
      ? new Date().toISOString()
      : existingPayments.connected_at || null,
  };

  const nextMeta = {
    ...existingMeta,
    payments: nextPayments,
  };

  const { error } = await supabase
    .from('stores')
    .update({ meta: nextMeta })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update payments' } as GuidedStoreFormState;

  revalidatePath('/stores');
  return { ok: true } as GuidedStoreFormState;
}
