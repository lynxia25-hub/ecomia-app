import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AGENT_CONFIGS, type AgentKey } from '@/lib/agents/config';

type AgentPromptRow = {
  agent_key: string;
  prompt: string | null;
};

type AgentDefinitionRow = {
  agent_key: string;
  name: string;
  description: string;
  default_prompt: string;
  active: boolean;
};

type AgentPromptInput = {
  key?: string;
  prompt?: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('agent_prompts')
    .select('agent_key, prompt')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to load prompts' }, { status: 500 });
  }

  const overrides = (data as AgentPromptRow[] || []).reduce((acc: Record<string, string>, row) => {
    acc[row.agent_key] = row.prompt || '';
    return acc;
  }, {});

  const { data: definitions, error: defError } = await supabase
    .from('agent_definitions')
    .select('agent_key, name, description, default_prompt, active')
    .eq('active', true)
    .order('name');

  const baseAgents = defError || !definitions || definitions.length === 0
    ? AGENT_CONFIGS.map((agent) => ({
        key: agent.key,
        name: agent.name,
        description: agent.description,
        defaultPrompt: agent.defaultPrompt,
      }))
    : (definitions as AgentDefinitionRow[]).map((agent) => ({
        key: agent.agent_key,
        name: agent.name,
        description: agent.description,
        defaultPrompt: agent.default_prompt,
      }));

  const agents = baseAgents.map((agent) => ({
    key: agent.key,
    name: agent.name,
    description: agent.description,
    prompt: overrides[agent.key] || '',
    defaultPrompt: agent.defaultPrompt,
  }));

  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agents: AgentPromptInput[] = Array.isArray(body?.agents) ? body.agents : [];

  const validKeys = new Set(AGENT_CONFIGS.map((a) => a.key));
  const payload = agents
    .filter((agent): agent is { key: AgentKey; prompt?: string } =>
      typeof agent.key === 'string' && validKeys.has(agent.key as AgentKey)
    )
    .map((agent) => ({
      user_id: user.id,
      agent_key: agent.key,
      prompt: String(agent.prompt || ''),
    }));

  if (payload.length === 0) {
    return NextResponse.json({ error: 'No valid agents provided' }, { status: 400 });
  }

  const { error } = await supabase
    .from('agent_prompts')
    .upsert(payload, { onConflict: 'user_id,agent_key' });

  if (error) {
    return NextResponse.json({ error: 'Failed to save prompts' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
