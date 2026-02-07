'use client';

import { useEffect, useState } from 'react';

interface RoleEntry {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) {
        throw new Error('No se pudieron cargar los roles');
      }
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const saveRole = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: { email, role } }),
      });
      if (!res.ok) {
        throw new Error('No se pudo guardar el rol');
      }
      setEmail('');
      setSuccess('Rol guardado.');
      await loadRoles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRole = async (id: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error('No se pudo eliminar el rol');
      }
      setSuccess('Rol eliminado.');
      await loadRoles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin de Roles</h1>
        <p className="text-gray-700 dark:text-gray-300">Define que usuarios pueden administrar agentes.</p>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Nuevo rol</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email del usuario"
            className="border border-gray-300 rounded-lg bg-white p-2 text-sm text-gray-900 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-lg bg-white p-2 text-sm text-gray-900 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="admin">admin</option>
          </select>
          <button
            onClick={saveRole}
            disabled={isSaving || !email}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-700 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
          >
            Asignar rol
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-700 dark:text-gray-300">Cargando roles...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Roles actuales</h2>
          <div className="space-y-3">
            {roles.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.email}</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">{item.role}</div>
                </div>
                <button
                  onClick={() => deleteRole(item.id)}
                  disabled={isSaving}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}