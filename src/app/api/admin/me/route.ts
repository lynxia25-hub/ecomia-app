import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isAdmin: false });
  }

  if (isSuperAdmin(user.email)) {
    return NextResponse.json({ isAdmin: true });
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({ isAdmin: data?.role === 'admin' });
}