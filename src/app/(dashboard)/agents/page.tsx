'use client';

import { useEffect, useState } from 'react';

interface AgentPrompt {
  key: string;
  name: string;
  description: string;
  prompt: string;
  defaultPrompt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) {
          throw new Error('No se pudo cargar la configuracion de agentes');
        }
        const data = await res.json();
        setAgents(data.agents || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error inesperado';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  const updatePrompt = (key: string, value: string) => {
    setAgents((prev) =>
      prev.map((agent) => (agent.key === key ? { ...agent, prompt: value } : agent))
    );
  };

  const resetPrompt = (key: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.key === key ? { ...agent, prompt: agent.defaultPrompt } : agent
      )
    );
  };

  const savePrompts = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: agents.map((agent) => ({ key: agent.key, prompt: agent.prompt })),
        }),
      });
      if (!res.ok) {
        throw new Error('No se pudieron guardar los prompts');
      }
      setSuccess('Prompts guardados correctamente.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agentes</h1>
          <p className="text-gray-700 dark:text-gray-300">
            Define las instrucciones de cada agente. El orquestador decide a cual llamar.
          </p>
        </div>
        <button
          onClick={savePrompts}
          disabled={isSaving || isLoading}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      {isLoading ? (
        <div className="text-gray-700 dark:text-gray-300">Cargando agentes...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.key}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                      {agent.key}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 dark:text-gray-300">{agent.description}</p>
                </div>
                <button
                  onClick={() => resetPrompt(agent.key)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  Usar default
                </button>
              </div>

              <details className="text-xs text-gray-700 dark:text-gray-300">
                <summary className="cursor-pointer text-indigo-600 dark:text-indigo-300">Ver prompt por defecto</summary>
                <div className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  {agent.defaultPrompt}
                </div>
              </details>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 dark:text-gray-200">
                  Prompt personalizado
                </label>
                <textarea
                  value={agent.prompt}
                  onChange={(e) => updatePrompt(agent.key, e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg bg-white p-2 text-xs text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Escribe las instrucciones personalizadas..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
