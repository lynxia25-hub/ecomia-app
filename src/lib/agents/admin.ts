export const SUPERADMIN_EMAIL = 'lincecarlos01@gmail.com';

export function isSuperAdmin(email?: string | null) {
  return Boolean(email && email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase());
}

export function isAdminRole(role?: string | null) {
  return role === 'admin';
}