'use server';

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

export async function listProductSuppliers(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  if (!sessionId.trim()) return { error: 'Missing session_id' } as const;

  const { data, error } = await supabase
    .from('product_suppliers')
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load suppliers' } as const;

  return { suppliers: (data || []) as ProductSupplierRow[] } as const;
}

export async function createProductSupplier(input: {
  session_id: string;
  candidate_id?: string | null;
  name: string;
  website?: string | null;
  contact?: string | null;
  price_range?: string | null;
  notes?: string | null;
  data?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const sessionId = input.session_id.trim();
  const name = input.name.trim();
  if (!sessionId) return { error: 'Missing session_id' } as const;
  if (!name) return { error: 'Missing name' } as const;

  const data = input.data ? asRecord(input.data) : null;
  if (input.data && !data) return { error: 'Invalid data' } as const;

  const { data: created, error } = await supabase
    .from('product_suppliers')
    .insert({
      session_id: sessionId,
      candidate_id: input.candidate_id?.trim() || null,
      name,
      website: input.website?.trim() || null,
      contact: input.contact?.trim() || null,
      price_range: input.price_range?.trim() || null,
      notes: input.notes?.trim() || null,
      data: data || {},
    })
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .single();

  if (error) return { error: 'Failed to create supplier' } as const;

  return { supplier: created as ProductSupplierRow } as const;
}

export async function updateProductSupplier(input: {
  id: string;
  candidate_id?: string | null;
  name?: string;
  website?: string | null;
  contact?: string | null;
  price_range?: string | null;
  notes?: string | null;
  data?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const update: Record<string, unknown> = {};
  if (input.name && input.name.trim()) update.name = input.name.trim();
  if (input.website !== undefined) update.website = input.website?.trim() || null;
  if (input.contact !== undefined) update.contact = input.contact?.trim() || null;
  if (input.price_range !== undefined) update.price_range = input.price_range?.trim() || null;
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null;
  if (input.candidate_id !== undefined) update.candidate_id = input.candidate_id?.trim() || null;

  if (input.data !== undefined) {
    const data = asRecord(input.data);
    if (!data) return { error: 'Invalid data' } as const;
    update.data = data;
  }

  if (Object.keys(update).length === 0) return { error: 'No valid updates' } as const;

  const { data, error } = await supabase
    .from('product_suppliers')
    .update(update)
    .eq('id', input.id)
    .select('id, session_id, candidate_id, name, website, contact, price_range, notes, data, created_at, updated_at')
    .maybeSingle();

  if (error) return { error: 'Failed to update supplier' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { supplier: data as ProductSupplierRow } as const;
}

export async function deleteProductSupplier(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('product_suppliers')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return { error: 'Failed to delete supplier' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { ok: true } as const;
}
