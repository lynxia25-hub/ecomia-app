'use server';

import { createClient } from '@/lib/supabase/server';

type ProductCandidateRow = {
  id: string;
  session_id: string;
  name: string;
  summary: string | null;
  pros: string | null;
  cons: string | null;
  price_range: string | null;
  demand_level: string | null;
  competition_level: string | null;
  score: number | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function listProductCandidates(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  if (!sessionId.trim()) return { error: 'Missing session_id' } as const;

  const { data, error } = await supabase
    .from('product_candidates')
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load candidates' } as const;

  return { candidates: (data || []) as ProductCandidateRow[] } as const;
}

export async function createProductCandidate(input: {
  session_id: string;
  name: string;
  summary?: string | null;
  pros?: string | null;
  cons?: string | null;
  price_range?: string | null;
  demand_level?: string | null;
  competition_level?: string | null;
  score?: number | null;
  meta?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const sessionId = input.session_id.trim();
  const name = input.name.trim();
  if (!sessionId) return { error: 'Missing session_id' } as const;
  if (!name) return { error: 'Missing name' } as const;

  const meta = input.meta ? asRecord(input.meta) : null;
  if (input.meta && !meta) return { error: 'Invalid meta' } as const;

  const { data, error } = await supabase
    .from('product_candidates')
    .insert({
      session_id: sessionId,
      name,
      summary: input.summary?.trim() || null,
      pros: input.pros?.trim() || null,
      cons: input.cons?.trim() || null,
      price_range: input.price_range?.trim() || null,
      demand_level: input.demand_level?.trim() || null,
      competition_level: input.competition_level?.trim() || null,
      score: typeof input.score === 'number' ? input.score : null,
      meta: meta || {},
    })
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .single();

  if (error) return { error: 'Failed to create candidate' } as const;

  return { candidate: data as ProductCandidateRow } as const;
}

export async function updateProductCandidate(input: {
  id: string;
  name?: string;
  summary?: string | null;
  pros?: string | null;
  cons?: string | null;
  price_range?: string | null;
  demand_level?: string | null;
  competition_level?: string | null;
  score?: number | null;
  meta?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const update: Record<string, unknown> = {};
  if (input.name && input.name.trim()) update.name = input.name.trim();
  if (input.summary !== undefined) update.summary = input.summary?.trim() || null;
  if (input.pros !== undefined) update.pros = input.pros?.trim() || null;
  if (input.cons !== undefined) update.cons = input.cons?.trim() || null;
  if (input.price_range !== undefined) update.price_range = input.price_range?.trim() || null;
  if (input.demand_level !== undefined) update.demand_level = input.demand_level?.trim() || null;
  if (input.competition_level !== undefined) update.competition_level = input.competition_level?.trim() || null;
  if (input.score !== undefined) update.score = typeof input.score === 'number' ? input.score : null;

  if (input.meta !== undefined) {
    const meta = asRecord(input.meta);
    if (!meta) return { error: 'Invalid meta' } as const;
    update.meta = meta;
  }

  if (Object.keys(update).length === 0) return { error: 'No valid updates' } as const;

  const { data, error } = await supabase
    .from('product_candidates')
    .update(update)
    .eq('id', input.id)
    .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, meta, created_at, updated_at')
    .maybeSingle();

  if (error) return { error: 'Failed to update candidate' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { candidate: data as ProductCandidateRow } as const;
}

export async function deleteProductCandidate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('product_candidates')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return { error: 'Failed to delete candidate' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { ok: true } as const;
}
