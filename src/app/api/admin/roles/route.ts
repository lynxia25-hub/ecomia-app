import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';

async function canManageRoles(user: User | null) {
  if (!user) return false;
  return isSuperAdmin(user.email);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageRoles(user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('id, user_id, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load roles' }, { status: 500 });
  }

  return NextResponse.json({ roles: data || [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageRoles(user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const role = body?.role || {};

  if (!role.email || !role.role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_roles')
    .upsert({
      email: String(role.email).toLowerCase(),
      role: String(role.role),
    }, { onConflict: 'email,role' });

  if (error) {
    return NextResponse.json({ error: 'Failed to save role' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageRoles(user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const roleId = body?.id;

  if (!roleId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', String(roleId));

  if (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}