'use server';

import { createClient } from '@/lib/supabase/server';

type ResearchSessionRow = {
  id: string;
  user_id: string;
  goal: string;
  status: string;
  notes: string | null;
  selected_candidate_id: string | null;
  created_at: string;
  updated_at: string;
};

const SESSION_STATUSES = new Set(['draft', 'researching', 'proposed', 'selected', 'completed']);

export async function listResearchSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('research_sessions')
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load sessions' } as const;

  return { sessions: (data || []) as ResearchSessionRow[] } as const;
}

export async function createResearchSession(input: {
  goal: string;
  status?: string;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const goal = input.goal.trim();
  if (!goal) return { error: 'Missing goal' } as const;

  const status = input.status?.trim().toLowerCase() || 'draft';
  if (!SESSION_STATUSES.has(status)) return { error: 'Invalid status' } as const;

  const { data, error } = await supabase
    .from('research_sessions')
    .insert({
      user_id: user.id,
      goal,
      status,
      notes: input.notes?.trim() || null,
    })
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .single();

  if (error) return { error: 'Failed to create session' } as const;

  return { session: data as ResearchSessionRow } as const;
}

export async function updateResearchSession(input: {
  id: string;
  goal?: string;
  status?: string;
  notes?: string | null;
  selected_candidate_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const update: Record<string, unknown> = {};

  if (input.goal && input.goal.trim()) update.goal = input.goal.trim();
  if (input.status && input.status.trim()) {
    const status = input.status.trim().toLowerCase();
    if (!SESSION_STATUSES.has(status)) return { error: 'Invalid status' } as const;
    update.status = status;
  }
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null;
  if (input.selected_candidate_id !== undefined) {
    update.selected_candidate_id = input.selected_candidate_id?.trim() || null;
  }

  if (Object.keys(update).length === 0) return { error: 'No valid updates' } as const;

  const { data, error } = await supabase
    .from('research_sessions')
    .update(update)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select('id, user_id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .maybeSingle();

  if (error) return { error: 'Failed to update session' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { session: data as ResearchSessionRow } as const;
}

export async function deleteResearchSession(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' } as const;

  const { data, error } = await supabase
    .from('research_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) return { error: 'Failed to delete session' } as const;
  if (!data) return { error: 'Not found' } as const;

  return { ok: true } as const;
}
