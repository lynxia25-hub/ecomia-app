'use server';

import { createClient } from '@/lib/supabase/server';

type ResearchSourceRow = {
  id: string;
  session_id: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function listResearchSources(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  if (!sessionId.trim()) return { error: 'Missing session_id' } as const;

  const { data, error } = await supabase
    .from('research_sources')
    .select('id, session_id, title, url, summary, data, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load sources' } as const;

  return { sources: (data || []) as ResearchSourceRow[] } as const;
}

export async function createResearchSource(input: {
  session_id: string;
  title?: string | null;
  url?: string | null;
  summary?: string | null;
  data?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const sessionId = input.session_id.trim();
  if (!sessionId) return { error: 'Missing session_id' } as const;

  const data = input.data ? asRecord(input.data) : null;
  if (input.data && !data) return { error: 'Invalid data' } as const;

  const { data: created, error } = await supabase
    .from('research_sources')
    .insert({
      session_id: sessionId,
      title: input.title?.trim() || null,
      url: input.url?.trim() || null,
      summary: input.summary?.trim() || null,
      data: data || {},
    })
    .select('id, session_id, title, url, summary, data, created_at')
    .single();

  if (error) return { error: 'Failed to create source' } as const;

  return { source: created as ResearchSourceRow } as const;
}

export async function updateResearchSource(input: {
  id: string;
  title?: string | null;
  url?: string | null;
  summary?: string | null;
  data?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title?.trim() || null;
  if (input.url !== undefined) update.url = input.url?.trim() || null;
  if (input.summary !== undefined) update.summary = input.summary?.trim() || null;

  if (input.data !== undefined) {
    const data = asRecord(input.data);
    if (!data) return { error: 'Invalid data' } as const;
    update.data = data;
  }

  if (Object.keys(update).length === 0) return { error: 'No valid updates' } as const;

  const { data, error } = await supabase
    .from('research_sources')
    .update(update)
    .eq('id', input.id)
    .select('id, session_id, title, url, summary, data, created_at')
    .maybeSingle();

  if (error) return { error: 'Failed to update source' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { source: data as ResearchSourceRow } as const;
}

export async function deleteResearchSource(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('research_sources')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return { error: 'Failed to delete source' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { ok: true } as const;
}
