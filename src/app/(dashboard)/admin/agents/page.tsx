'use client';

import { useEffect, useState } from 'react';

interface AgentDefinition {
  agent_key: string;
  name: string;
  description: string;
  default_prompt: string;
  active: boolean;
}

const emptyAgent: AgentDefinition = {
  agent_key: '',
  name: '',
  description: '',
  default_prompt: '',
  active: true,
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [draft, setDraft] = useState<AgentDefinition>(emptyAgent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/agents');
      if (!res.ok) {
        throw new Error('No se pudieron cargar los agentes');
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

  useEffect(() => {
    loadAgents();
  }, []);

  const updateAgent = (key: string, field: keyof AgentDefinition, value: string | boolean) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.agent_key === key ? { ...agent, [field]: value } : agent
      )
    );
  };

  const saveAgent = async (agent: AgentDefinition) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent }),
      });
      if (!res.ok) {
        throw new Error('No se pudo guardar el agente');
      }
      setSuccess('Agente guardado.');
      await loadAgents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAgent = async (agentKey: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_key: agentKey }),
      });
      if (!res.ok) {
        throw new Error('No se pudo eliminar el agente');
      }
      setSuccess('Agente eliminado.');
      await loadAgents();
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin de Agentes</h1>
          <p className="text-gray-700 dark:text-gray-300">Crea, edita y activa agentes sin tocar codigo.</p>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Nuevo agente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={draft.agent_key}
            onChange={(e) => setDraft({ ...draft, agent_key: e.target.value })}
            placeholder="agent_key (ej: ads)"
            className="border border-gray-300 rounded-lg bg-white p-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          />
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nombre"
            className="border border-gray-300 rounded-lg bg-white p-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          />
          <input
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Descripcion"
            className="border border-gray-300 rounded-lg bg-white p-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
            Activo
          </label>
        </div>
        <textarea
          value={draft.default_prompt}
          onChange={(e) => setDraft({ ...draft, default_prompt: e.target.value })}
          placeholder="Prompt por defecto"
          rows={5}
          className="mt-4 w-full border border-gray-300 rounded-lg bg-white p-3 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
        />
        <button
          onClick={() => saveAgent(draft)}
          disabled={isSaving || !draft.agent_key || !draft.name}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-700 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
        >
          Crear agente
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-700 dark:text-gray-300">Cargando agentes...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {agents.map((agent) => (
            <div key={agent.agent_key} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Key: {agent.agent_key}</p>
                </div>
                <button
                  onClick={() => deleteAgent(agent.agent_key)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
              <input
                value={agent.description}
                onChange={(e) => updateAgent(agent.agent_key, 'description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg bg-white p-2 text-sm text-gray-900 mb-3 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
              <textarea
                value={agent.default_prompt}
                onChange={(e) => updateAgent(agent.agent_key, 'default_prompt', e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg bg-white p-3 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={agent.active}
                    onChange={(e) => updateAgent(agent.agent_key, 'active', e.target.checked)}
                  />
                  Activo
                </label>
                <button
                  onClick={() => saveAgent(agent)}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-700 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                >
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}