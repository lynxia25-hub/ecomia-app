'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, TrendingUp, Users, ShoppingBag } from 'lucide-react';

type ToolInvocation = {
  toolName?: string;
  state?: string;
  args?: { query?: string };
  result?: unknown;
};

type TavilyResult = {
  url: string;
  title: string;
  content: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

interface ResearchDisplayProps {
  toolInvocations: ToolInvocation[];
  isLoading: boolean;
  assistantMessage?: string;
  refreshKey?: number;
  onQuickPrompt?: (content: string) => Promise<void>;
}

type SessionRow = {
  id: string;
  goal: string;
  status: string;
  selected_candidate_id: string | null;
};

type CandidateRow = {
  id: string;
  name: string;
  summary: string | null;
  demand_level: string | null;
  competition_level: string | null;
  price_range: string | null;
};

type SupplierRow = {
  id: string;
  name: string;
  website: string | null;
  candidate_id: string | null;
};

type AssetRow = {
  id: string;
  candidate_id: string | null;
  asset_type: string;
  url: string | null;
  content: Record<string, unknown>;
  created_at: string;
};

function extractMarkdownTable(text?: string) {
  if (!text) return null;
  const defaultHeader = [
    'Producto',
    'Demanda',
    'Competencia',
    'Margen',
    'Proveedor',
    'Recomendacion',
  ];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const startIndex = lines.findIndex((line) => line.startsWith('|'));
  if (startIndex === -1) return null;

  const tableLines: string[] = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    if (!lines[i].startsWith('|')) break;
    tableLines.push(lines[i]);
  }

  if (tableLines.length < 2) return null;

  const rows = tableLines.map((line) =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
  );

  let header = rows[0] || [];
  let bodyRows = rows.slice(1);

  if (bodyRows.length > 0) {
    const alignmentRow = bodyRows[0];
    const isAlignment = alignmentRow.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, '')));
    if (isAlignment) {
      bodyRows = bodyRows.slice(1);
    }
  }

  const headerLooksValid = header.join(' ').toLowerCase().includes('producto');
  if (!headerLooksValid) {
    bodyRows = [header, ...bodyRows].filter((row) => row.length > 0);
    header = defaultHeader;
  }

  if (header.length === 0 || bodyRows.length === 0) return null;

  return { header, rows: bodyRows };
}

function extractCopySections(text?: string) {
  if (!text) return null;
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const sections: { name: string; items: string[] }[] = [];
  let current: { name: string; items: string[] } | null = null;

  const pushCurrent = () => {
    if (current && current.items.length > 0) {
      sections.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const sectionMatch = line.match(/^(\*\*|__)?\s*(Secci[oó]n\s+)?(Instagram|TikTok|Facebook|Hashtags)[:\s-]*/i);
    if (sectionMatch) {
      pushCurrent();
      const name = sectionMatch[3] || 'Seccion';
      current = { name, items: [] };
      const remaining = line.replace(sectionMatch[0], '').replace(/\*\*|__/g, '').trim();
      if (remaining) current.items.push(remaining);
      continue;
    }

    if (current) {
      if (/^[-*•]\s+/.test(line)) {
        current.items.push(line.replace(/^[-*•]\s+/, ''));
      } else {
        current.items.push(line);
      }
    }
  }

  pushCurrent();
  if (sections.length === 0) return null;
  return sections;
}

export function ResearchDisplay({
  toolInvocations,
  isLoading,
  assistantMessage,
  refreshKey = 0,
  onQuickPrompt,
}: ResearchDisplayProps) {
  const marketTable = useMemo(() => extractMarkdownTable(assistantMessage), [assistantMessage]);
  const copySections = useMemo(() => extractCopySections(assistantMessage), [assistantMessage]);
  const [lastMarketTable, setLastMarketTable] = useState<typeof marketTable>(null);
  const [lastCopySections, setLastCopySections] = useState<typeof copySections>(null);
  const [session, setSession] = useState<SessionRow | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (marketTable) setLastMarketTable(marketTable);
  }, [marketTable]);

  useEffect(() => {
    if (copySections) setLastCopySections(copySections);
  }, [copySections]);

  useEffect(() => {
    let alive = true;

    const loadSession = async () => {
      setIsSessionLoading(true);
      setSessionError(null);
      try {
        const res = await fetch('/api/research-sessions');
        if (!res.ok) {
          throw new Error('No se pudieron cargar sesiones');
        }
        const data = await res.json();
        const latest = Array.isArray(data?.sessions) ? data.sessions[0] : null;
        if (!alive) return;

        if (!latest) {
          setSession(null);
          setCandidates([]);
          setSuppliers([]);
          setAssets([]);
          return;
        }

        setSession(latest as SessionRow);

        const qs = new URLSearchParams({ session_id: latest.id }).toString();
        const [candidatesRes, suppliersRes, assetsRes] = await Promise.all([
          fetch(`/api/product-candidates?${qs}`),
          fetch(`/api/product-suppliers?${qs}`),
          fetch(`/api/product-assets?${qs}`),
        ]);

        if (!alive) return;

        const candidatesData = candidatesRes.ok ? await candidatesRes.json() : {};
        const suppliersData = suppliersRes.ok ? await suppliersRes.json() : {};
        const assetsData = assetsRes.ok ? await assetsRes.json() : {};

        setCandidates(Array.isArray(candidatesData?.candidates) ? candidatesData.candidates : []);
        setSuppliers(Array.isArray(suppliersData?.suppliers) ? suppliersData.suppliers : []);
        setAssets(Array.isArray(assetsData?.assets) ? assetsData.assets : []);
      } catch (error) {
        if (!alive) return;
        const message = error instanceof Error ? error.message : 'Error cargando sesiones';
        setSessionError(message);
      } finally {
        if (alive) setIsSessionLoading(false);
      }
    };

    loadSession();
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const handleSelectCandidate = async (candidateId: string) => {
    if (!session || !candidateId) return;
    try {
      const res = await fetch(`/api/research-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'selected', selected_candidate_id: candidateId }),
      });
      if (!res.ok) {
        throw new Error('No se pudo seleccionar el producto');
      }
      setSession((prev) => prev ? { ...prev, status: 'selected', selected_candidate_id: candidateId } : prev);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error seleccionando producto';
      setSessionError(message);
    }
  };

  const handleRequestAssets = async (candidateName: string) => {
    if (!onQuickPrompt) return;
    await onQuickPrompt(
      `Elijo el producto "${candidateName}". Genera copy de ventas y anuncios (Instagram, TikTok, Facebook) con CTA.`
    );
    await onQuickPrompt(
      `Para el producto "${candidateName}", genera ideas de imagenes y guiones cortos para video con CTA.`
    );
  };

  const candidateLookup = useMemo(() => {
    return candidates.reduce((acc: Record<string, string>, candidate) => {
      acc[candidate.id] = candidate.name;
      return acc;
    }, {});
  }, [candidates]);

  const selectedCandidateName = session?.selected_candidate_id
    ? candidateLookup[session.selected_candidate_id] || null
    : null;

  const sessionPanel = session ? (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sesion activa</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{session.goal}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {session.status}
        </span>
      </div>

      {sessionError && (
        <p className="mt-2 text-xs text-red-600">{sessionError}</p>
      )}

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Productos candidatos</p>
        {isSessionLoading && (
          <p className="text-xs text-gray-500">Cargando candidatos...</p>
        )}
        {!isSessionLoading && candidates.length === 0 && (
          <p className="text-xs text-gray-500">Aun no hay candidatos guardados.</p>
        )}
        <div className="space-y-2">
          {candidates.map((candidate) => {
            const isSelected = session.selected_candidate_id === candidate.id;
            return (
              <div
                key={candidate.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    {candidate.summary && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{candidate.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectCandidate(candidate.id)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : 'border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                      }`}
                    >
                      {isSelected ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                    {isSelected && onQuickPrompt && (
                      <button
                        type="button"
                        onClick={() => handleRequestAssets(candidate.name)}
                        className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-600 transition-all hover:bg-purple-100"
                      >
                        Generar assets
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  {candidate.demand_level && <span>Demanda: {candidate.demand_level}</span>}
                  {candidate.competition_level && <span>Competencia: {candidate.competition_level}</span>}
                  {candidate.price_range && <span>Margen: {candidate.price_range}</span>}
                </div>
                {suppliers.length > 0 && (
                  <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                    Proveedores: {suppliers.filter((supplier) => !supplier.candidate_id || supplier.candidate_id === candidate.id).length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Assets generados</p>
        {isSessionLoading && (
          <p className="text-xs text-gray-500">Cargando assets...</p>
        )}
        {!isSessionLoading && assets.length === 0 && (
          <p className="text-xs text-gray-500">Aun no hay assets guardados.</p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{asset.asset_type}</p>
                  {asset.candidate_id && candidateLookup[asset.candidate_id] && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Producto: {candidateLookup[asset.candidate_id]}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {new Date(asset.created_at).toLocaleDateString()}
                </span>
              </div>
              {asset.url && (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                >
                  Ver enlace
                </a>
              )}
              {asset.content && Object.keys(asset.content).length > 0 && (
                <pre className="mt-2 whitespace-pre-wrap text-[11px] text-gray-500 dark:text-gray-400">
{JSON.stringify(asset.content, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        {session.selected_candidate_id && assets.length > 0 && onQuickPrompt && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onQuickPrompt(
                `Estoy listo para crear la landing del producto "${selectedCandidateName || 'seleccionado'}". Dame el contenido y la estructura final.`
              )}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-medium text-indigo-600 transition-all hover:bg-indigo-100"
            >
              Crear landing
            </button>
            <button
              type="button"
              onClick={() => onQuickPrompt(
                `Estoy listo para crear la tienda del producto "${selectedCandidateName || 'seleccionado'}". Sugiere nombre, slug y descripcion para confirmar.`
              )}
              className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-[11px] font-medium text-purple-600 transition-all hover:bg-purple-100"
            >
              Crear tienda
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;
  // Find the most recent searchMarket tool invocation
  const latestSearch = toolInvocations
    .filter((t) => t.toolName === 'searchMarket')
    .slice(-1)[0];

  if (!latestSearch && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-blue-500" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-xl font-medium text-gray-900 dark:text-white"
        >
          Analizando el mercado...
        </motion.h3>
        <p className="text-gray-700 mt-2 dark:text-gray-300">Buscando oportunidades y competidores</p>
      </div>
    );
  }

  if (!latestSearch && !isLoading) {
    const activeMarketTable = marketTable || lastMarketTable;
    const activeCopySections = copySections || lastCopySections;

    if (activeMarketTable || activeCopySections) {
      return (
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {sessionPanel}
            {activeMarketTable && (
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tabla de Recomendacion</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Resumen claro de opciones y oportunidades</p>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <table className="min-w-[720px] w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <tr>
                        {activeMarketTable.header.map((cell, idx) => (
                          <th key={idx} className="px-4 py-2 font-semibold border-b border-gray-100">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeMarketTable.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2 border-b border-gray-100 text-gray-800 dark:text-gray-200 dark:border-gray-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeCopySections && (
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Copys por Red Social</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Texto sugerido listo para publicar</p>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <table className="min-w-[720px] w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold border-b border-gray-100">Red</th>
                        <th className="px-4 py-2 font-semibold border-b border-gray-100">Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCopySections.flatMap((section) =>
                        section.items.map((item, idx) => (
                          <tr key={`${section.name}-${idx}`} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                            <td className="px-4 py-2 border-b border-gray-100 text-gray-800 font-medium dark:text-gray-200 dark:border-gray-800">
                              {section.name}
                            </td>
                            <td className="px-4 py-2 border-b border-gray-100 text-gray-800 dark:text-gray-200 dark:border-gray-800">
                              {item}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {sessionPanel}
          <div className="flex flex-col items-center justify-center text-gray-500 p-8 text-center dark:text-gray-300">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium mb-2">Investigación de Mercado</h3>
            <p className="max-w-md">
              Cuéntame tu idea de negocio en el chat y realizaré una investigación en tiempo real sobre tendencias, competidores y proveedores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (latestSearch && latestSearch.state !== 'result') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-blue-500" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-xl font-medium text-gray-900 dark:text-white"
        >
          Analizando el mercado...
        </motion.h3>
        <p className="text-gray-700 mt-2 dark:text-gray-300">Buscando &quot;{latestSearch.args?.query}&quot;</p>
      </div>
    );
  }

  // Result State
  if (latestSearch && latestSearch.state === 'result') {
    let data: TavilyResponse = {};
    if (latestSearch.result) {
      if (typeof latestSearch.result === 'string') {
        try {
          data = JSON.parse(latestSearch.result) as TavilyResponse;
        } catch {
          data = {};
        }
      } else {
        data = latestSearch.result as TavilyResponse;
      }
    }

    return (
      <div className="h-full overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {sessionPanel}
          {marketTable && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tabla de Recomendacion</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Resumen claro de opciones y oportunidades</p>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <table className="min-w-[720px] w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      {marketTable.header.map((cell, idx) => (
                        <th key={idx} className="px-4 py-2 font-semibold border-b border-gray-100">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marketTable.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-2 border-b border-gray-100 text-gray-800 dark:text-gray-200 dark:border-gray-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {copySections && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Copys por Red Social</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Texto sugerido listo para publicar</p>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <table className="min-w-[720px] w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold border-b border-gray-100">Red</th>
                      <th className="px-4 py-2 font-semibold border-b border-gray-100">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copySections.flatMap((section) =>
                      section.items.map((item, idx) => (
                        <tr key={`${section.name}-${idx}`} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                          <td className="px-4 py-2 border-b border-gray-100 text-gray-800 font-medium dark:text-gray-200 dark:border-gray-800">
                            {section.name}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-100 text-gray-800 dark:text-gray-200 dark:border-gray-800">
                            {item}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl dark:bg-blue-900/30">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados de Investigación</h2>
              <p className="text-gray-700 dark:text-gray-300">Consulta: {latestSearch.args?.query}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Results Mapping - Adapting to Tavily's response structure */}
            {data.results && data.results.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800"
              >
                <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2 dark:text-white">
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    {result.title}
                  </a>
                </h4>
                <p className="text-sm text-gray-700 line-clamp-3 mb-3 dark:text-gray-300">
                  {result.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    Fuente Externa
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {new URL(result.url).hostname}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {(!data.results || data.results.length === 0) && (
            <div className="text-center text-gray-600 py-10 dark:text-gray-300">
              No se encontraron resultados específicos, pero he analizado el contexto general.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return null;
}
