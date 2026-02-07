import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';

async function canManageAgents(
  supabase: SupabaseClient,
  user: User | null
) {
  if (!user) return false;
  if (isSuperAdmin(user?.email)) return true;
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();
  return data?.role === 'admin';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageAgents(supabase, user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('agent_definitions')
    .select('agent_key, name, description, default_prompt, active')
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 });
  }

  return NextResponse.json({ agents: data || [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageAgents(supabase, user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agent = body?.agent || {};

  if (!agent.agent_key || !agent.name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('agent_definitions')
    .upsert({
      agent_key: String(agent.agent_key),
      name: String(agent.name),
      description: String(agent.description || ''),
      default_prompt: String(agent.default_prompt || ''),
      active: agent.active !== false,
    }, { onConflict: 'agent_key' });

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'Failed to save agent', details: error },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageAgents(supabase, user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agentKey = body?.agent_key;

  if (!agentKey) {
    return NextResponse.json({ error: 'Missing agent_key' }, { status: 400 });
  }

  const { error } = await supabase
    .from('agent_definitions')
    .delete()
    .eq('agent_key', String(agentKey));

  if (error) {
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}