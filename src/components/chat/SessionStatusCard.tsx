'use client';

import { useEffect, useState } from 'react';
import PillLink from '@/components/ui/PillLink';

const REFRESH_DELAY_MS = 300;

type SessionRow = {
  id: string;
  goal: string;
  status: string;
  selected_candidate_id: string | null;
  created_at: string;
  updated_at: string;
};

type Counts = {
  candidates: number;
  suppliers: number;
  sources: number;
};

export default function SessionStatusCard({ refreshKey }: { refreshKey: number }) {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [counts, setCounts] = useState<Counts>({ candidates: 0, suppliers: 0, sources: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const timeout = setTimeout(() => {
      const load = async () => {
        try {
          const res = await fetch('/api/research-sessions');
          if (!res.ok) throw new Error('No se pudieron cargar sesiones');
          const data = await res.json();
          const latest = Array.isArray(data?.sessions) ? (data.sessions[0] as SessionRow | undefined) : undefined;
          if (!alive) return;
          if (!latest) {
            setSession(null);
            setCounts({ candidates: 0, suppliers: 0, sources: 0 });
            return;
          }

          setSession(latest);

          const qs = new URLSearchParams({ session_id: latest.id }).toString();
          const [candidatesRes, suppliersRes, sourcesRes] = await Promise.all([
            fetch(`/api/product-candidates?${qs}`),
            fetch(`/api/product-suppliers?${qs}`),
            fetch(`/api/research-sources?${qs}`),
          ]);

          if (!alive) return;

          const candidatesData = candidatesRes.ok ? await candidatesRes.json() : {};
          const suppliersData = suppliersRes.ok ? await suppliersRes.json() : {};
          const sourcesData = sourcesRes.ok ? await sourcesRes.json() : {};

          setCounts({
            candidates: Array.isArray(candidatesData?.candidates) ? candidatesData.candidates.length : 0,
            suppliers: Array.isArray(suppliersData?.suppliers) ? suppliersData.suppliers.length : 0,
            sources: Array.isArray(sourcesData?.sources) ? sourcesData.sources.length : 0,
          });
        } catch (err) {
          if (!alive) return;
          const message = err instanceof Error ? err.message : 'Error desconocido';
          setError(message);
        }
      };

      load();
    }, REFRESH_DELAY_MS);

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [refreshKey]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
        Sin sesion activa. Inicia una investigacion desde el chat.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Sesion actual</p>
          <PillLink href="/research" variant="indigo" size="xs">
            Ver todo
          </PillLink>
      </div>
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{session.goal}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{session.status}</span>
        {session.selected_candidate_id && <span>Producto seleccionado</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
        <span>{counts.candidates} candidatos</span>
        <span>{counts.suppliers} proveedores</span>
        <span>{counts.sources} fuentes</span>
      </div>
    </div>
  );
}
