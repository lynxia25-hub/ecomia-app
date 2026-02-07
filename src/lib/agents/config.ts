export type AgentKey = 'orchestrator' | 'research' | 'recommendation' | 'copy';

export interface AgentConfig {
  key: AgentKey;
  name: string;
  description: string;
  defaultPrompt: string;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    key: 'orchestrator',
    name: 'Orquestador',
    description: 'Decide que agente usar segun la intencion del usuario.',
    defaultPrompt:
      'Detecta intencion con claridad y asigna el agente correcto sin explicar el proceso.',
  },
  {
    key: 'research',
    name: 'Investigacion de Mercado',
    description: 'Resume tendencias, demanda y competencia en formato util.',
    defaultPrompt:
      'Enfoca la investigacion en LATAM, tendencias, competencia y demanda real.',
  },
  {
    key: 'recommendation',
    name: 'Recomendacion de Producto',
    description: 'Entrega tabla de opciones y recomendaciones accionables.',
    defaultPrompt:
      'Entrega tabla clara, recomendaciones cortas y una pregunta de cierre.',
  },
  {
    key: 'copy',
    name: 'Copy para Redes',
    description: 'Crea copys por red social con CTA.',
    defaultPrompt:
      'Copys persuasivos, claros y directos. Evita relleno.',
  },
];
