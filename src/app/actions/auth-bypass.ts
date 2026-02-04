'use server';

import { cookies } from 'next/headers';

export async function bypassAuth() {
  const cookieStore = await cookies();
  cookieStore.set('ecomia_bypass', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  return { success: true };
}
