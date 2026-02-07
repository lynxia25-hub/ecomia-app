import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PillLink from '@/components/ui/PillLink';
import ResearchFlowSteps from '@/components/ui/ResearchFlowSteps';

type ResearchSessionRow = {
  id: string;
  goal: string;
  status: string;
  notes: string | null;
  selected_candidate_id: string | null;
  created_at: string;
  updated_at: string;
};

type ProductCandidateRow = {
  id: string;
  session_id: string;
  name: string;
  summary: string | null;
  pros: string | null;
  cons: string | null;
  price_range: string | null;
  demand_level: string | null;
  competition_level: string | null;
  score: number | null;
  created_at: string;
};

type ProductSupplierRow = {
  id: string;
  session_id: string;
  candidate_id: string | null;
  name: string;
  website: string | null;
  contact: string | null;
  price_range: string | null;
  notes: string | null;
  created_at: string;
};

type ResearchSourceRow = {
  id: string;
  session_id: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  created_at: string;
};

type SessionBundle = {
  session: ResearchSessionRow;
  candidates: ProductCandidateRow[];
  suppliers: ProductSupplierRow[];
  sources: ResearchSourceRow[];
};

async function loadSessionBundle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: ResearchSessionRow
): Promise<SessionBundle> {
  const [candidates, suppliers, sources] = await Promise.all([
    supabase
      .from('product_candidates')
      .select('id, session_id, name, summary, pros, cons, price_range, demand_level, competition_level, score, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('product_suppliers')
      .select('id, session_id, candidate_id, name, website, contact, price_range, notes, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('research_sources')
      .select('id, session_id, title, url, summary, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    session,
    candidates: (candidates.data || []) as ProductCandidateRow[],
    suppliers: (suppliers.data || []) as ProductSupplierRow[],
    sources: (sources.data || []) as ResearchSourceRow[],
  };
}

export default async function ResearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;

  if (!effectiveUserId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Investigacion</h1>
          <p className="text-sm text-gray-500">Inicia sesion para ver tus sesiones.</p>
        </div>
        <ResearchFlowSteps />
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3">No hay una sesion activa porque no estas autenticado.</p>
            <PillLink href="/login" variant="neutral" size="sm">
              Ir a iniciar sesion
            </PillLink>
        </div>
      </div>
    );
  }

  const { data: sessions, error } = await supabase
    .from('research_sessions')
    .select('id, goal, status, notes, selected_candidate_id, created_at, updated_at')
    .eq('user_id', effectiveUserId)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudieron cargar las sesiones de investigacion.
      </div>
    );
  }

  const sessionBundles = await Promise.all(
    (sessions || []).map((session) => loadSessionBundle(supabase, session as ResearchSessionRow))
  );

  if (sessionBundles.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Investigacion</h1>
          <p className="text-sm text-gray-500">Aun no hay sesiones creadas.</p>
        </div>
        <ResearchFlowSteps />
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Inicia una investigacion desde el chat y aparecera aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Investigacion</h1>
        <p className="text-sm text-gray-500">Sesiones y resultados del flujo guiado.</p>
      </div>

      <ResearchFlowSteps />

      <div className="grid gap-6">
        {sessionBundles.map(({ session, candidates, suppliers, sources }) => (
          <div key={session.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{session.goal}</h2>
                <p className="text-xs text-gray-500">Sesion: {session.id}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">{session.status}</span>
                <span>Creada: {new Date(session.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {session.notes && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Notas: {session.notes}</p>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Productos recomendados</h3>
                {candidates.length === 0 ? (
                  <p className="text-xs text-gray-500">Sin candidatos registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        <p className="font-semibold">{candidate.name}</p>
                        {candidate.summary && <p className="mt-1">{candidate.summary}</p>}
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                          {candidate.demand_level && <span>Demanda: {candidate.demand_level}</span>}
                          {candidate.competition_level && <span>Competencia: {candidate.competition_level}</span>}
                          {candidate.price_range && <span>Precio: {candidate.price_range}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Proveedores</h3>
                {suppliers.length === 0 ? (
                  <p className="text-xs text-gray-500">Sin proveedores registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        <p className="font-semibold">{supplier.name}</p>
                        {supplier.website && (
                          <Link className="text-indigo-600 hover:text-indigo-700" href={supplier.website} target="_blank">
                            {supplier.website}
                          </Link>
                        )}
                        {supplier.contact && <p className="mt-1">Contacto: {supplier.contact}</p>}
                        {supplier.price_range && <p className="mt-1">Precio: {supplier.price_range}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fuentes</h3>
                {sources.length === 0 ? (
                  <p className="text-xs text-gray-500">Sin fuentes registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <div key={source.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        <p className="font-semibold">{source.title || 'Fuente'}</p>
                        {source.url && (
                          <Link className="text-indigo-600 hover:text-indigo-700" href={source.url} target="_blank">
                            {source.url}
                          </Link>
                        )}
                        {source.summary && <p className="mt-1">{source.summary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
