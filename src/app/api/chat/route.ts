import { createGroq } from '@ai-sdk/groq';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { tavily } from '@tavily/core';
import { AGENT_CONFIGS, type AgentKey } from '@/lib/agents/config';

// Allow streaming responses up to 60 seconds (research takes time)
export const maxDuration = 60;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });


type ParsedTable = {
  header: string[];
  rows: string[][];
};

function parseMarkdownTable(text: string): ParsedTable | null {
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

  const header = rows[0] || [];
  let bodyRows = rows.slice(1);

  if (bodyRows.length > 0) {
    const alignmentRow = bodyRows[0];
    const isAlignment = alignmentRow.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, '')));
    if (isAlignment) {
      bodyRows = bodyRows.slice(1);
    }
  }

  if (header.length === 0 || bodyRows.length === 0) return null;

  return { header, rows: bodyRows };
}

export async function POST(req: Request) {
  try {
    let { messages } = await req.json();
    const url = new URL(req.url);
    const sync = url.searchParams.get('sync') === 'true';

    console.log('/api/chat: mensajes recibidos (original):', JSON.stringify(messages, null, 2));

    // Validar que tenemos al menos un mensaje
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('/api/chat: ERROR - no hay mensajes para procesar');
      return new Response(
        JSON.stringify({ error: 'Invalid prompt: messages must not be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar mensajes de formato UIMessage (@ai-sdk/react v3+ con 'parts')
    // al formato ModelMessage que streamText espera (con 'content')
    if (messages && Array.isArray(messages)) {
      messages = messages.map((msg: any) => {
        // Si tiene 'parts' (formato @ai-sdk/react v3+), convertir a 'content'
        if (msg.parts && Array.isArray(msg.parts)) {
          const content = msg.parts.map((part: any) => part.text || part.content || '').join('');
          console.log('/api/chat: transformando parts →', { role: msg.role, content });
          return { role: msg.role, content };
        }
        // Si ya tiene 'content', retornar tal cual
        console.log('/api/chat: mensaje ya transformado →', msg);
        return msg;
      });
    }

    console.log('/api/chat: mensajes transformados finales:', JSON.stringify(messages, null, 2));

  // Verificar autenticación (solo Supabase)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const effectiveUserId = user.id;
  const writeClient = supabase;
  const isDev = process.env.NODE_ENV !== 'production';

    const systemPrompt = `
     Eres EcomIA, un consultor experto en comercio electrónico y emprendimiento digital para LATAM.

    OBJETIVO PRINCIPAL:
    Guiar al usuario no tecnico para crear una tienda desde cero, con investigacion, seleccion de producto y contenido listo.

      FLUJO OBLIGATORIO (NO SALTAR PASOS):
      1) Entender que quiere vender o su objetivo.
      2) Crear una sesion de investigacion con 'createResearchSession'. Guarda el session_id y usalo en TODAS las herramientas.
      3) Investigar mercado con 'searchMarket' y guardar fuentes con 'createResearchSource'.
      4) Proponer 3 productos ganadores y guardarlos con 'createProductCandidate'.
      5) Para cada producto, buscar y guardar proveedores con 'createProductSupplier'.
      6) El usuario elige un producto; actualizar sesion con 'updateResearchSession' y marcar seleccionado.
      7) Generar copys e ideas visuales; guardar assets con 'createProductAsset'.
      8) Recién entonces crear la tienda o landing.

     FORMATO DE RESPUESTA (OBLIGATORIO):
     - Devuelve PRIMERO una tabla en Markdown para mostrar en la vista central.
     - Usa EXACTAMENTE este encabezado y columnas:
     | Producto | Demanda | Competencia | Margen | Proveedor | Recomendacion |
     - Luego agrega 2-3 bullets de recomendacion y una pregunta final corta.
     - Evita parrafos largos.
     - NUNCA muestres llamadas a herramientas en el texto (no imprimir <function=...> ni JSON de tools).

    PERSONALIDAD:
    - Espanol LATAM, persuasivo y enfocado en ventas.
    - Claro, directo y accionable.
    - Sin tecnicismos innecesarios.

    HERRAMIENTAS:
      - searchMarket: Usala OBLIGATORIAMENTE antes de validar cualquier idea de producto (incluye session_id).
    - createResearchSession: Inicia la sesion cuando el objetivo sea claro.
      - createResearchSource: Guarda fuentes de investigacion (usa el session_id actual).
      - createProductCandidate: Guarda 3 productos recomendados (usa el session_id actual).
      - createProductSupplier: Guarda proveedores con enlaces y contacto (usa session_id y candidate_id si aplica).
    - updateResearchSession: Marca el producto elegido y el estado.
    - createProductAsset: Guarda imagenes o textos clave generados.
    - createStore: Usala solo cuando el usuario confirme que quiere vender despues de tu asesoria.
    `;

  const tools = {
    searchMarket: (tool as any)({
      description: 'Investiga tendencias de mercado, competidores y proveedores para un producto o nicho específico en tiempo real.',
      parameters: z.object({
        session_id: z.string().optional().describe('ID de la sesion para guardar fuentes'),
      }).passthrough().describe(
        'Parametros flexibles para investigar. Preferir query; acepta producto/niche/mercado/tendencias/etc.'
      ),
      execute: async (params: any) => {
        const {
          query,
          producto,
          niche,
          mercado,
          tendencias,
          competidores,
          proveedores,
          demandatendencia,
          session_id,
        } = params || {};
        const normalizedQuery =
          query ||
          [
            'tendencia',
            producto,
            niche,
            mercado,
            tendencias,
            competidores,
            proveedores,
            demandatendencia,
          ]
            .filter(Boolean)
            .join(' ')
            .trim() || 'tendencias mercado e-commerce LATAM';
        try {
          const context = await tvly.search(normalizedQuery, {
            searchDepth: "advanced",
            maxResults: 5,
          });
          const sessionId = typeof session_id === 'string' ? session_id.trim() : '';
          const hasUser = Boolean(effectiveUserId);

          if (sessionId && hasUser) {
            const results = Array.isArray((context as { results?: unknown }).results)
              ? (context as { results: Array<Record<string, unknown>> }).results
              : [];

            if (results.length > 0) {
              const payload = results.slice(0, 6).map((result) => ({
                session_id: sessionId,
                title: typeof result.title === 'string' ? result.title : null,
                url: typeof result.url === 'string' ? result.url : null,
                summary: typeof result.content === 'string'
                  ? result.content
                  : typeof result.snippet === 'string'
                    ? result.snippet
                    : null,
                data: result,
              }));

              const { error: sourceError } = await writeClient
                .from('research_sources')
                .insert(payload);

              if (sourceError) {
                console.warn('No se pudieron guardar fuentes de investigacion', sourceError);
              }
            }
          }
          return JSON.stringify(context);
        } catch (error) {
          console.error('Tavily Error:', error);
          return 'No pude conectar con el mercado en este momento, pero basándome en mi conocimiento general...';
        }
      },
    }),
    createResearchSession: (tool as any)({
      description: 'Crea una sesion de investigacion para el usuario actual.',
      parameters: z.object({
        goal: z.string().describe('Objetivo o idea de negocio del usuario'),
        status: z.string().optional().describe('Estado inicial de la sesion'),
        notes: z.string().optional().describe('Notas iniciales'),
      }),
      execute: async (params: any) => {
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesion para crear una sesion de investigacion.';
        }

        const goal = typeof params?.goal === 'string' ? params.goal.trim() : '';
        if (!goal) return 'Error: goal requerido.';

        const status = typeof params?.status === 'string' ? params.status.trim().toLowerCase() : 'draft';
        const notes = typeof params?.notes === 'string' ? params.notes.trim() : null;

        const { data, error } = await writeClient
          .from('research_sessions')
          .insert({ user_id: effectiveUserId, goal, status, notes })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating research session:', error);
          return 'Error: No se pudo crear la sesion.';
        }

        return JSON.stringify({ session_id: data?.id });
      },
    }),
    createResearchSource: (tool as any)({
      description: 'Guarda una fuente de investigacion asociada a una sesion.',
      parameters: z.object({
        session_id: z.string().describe('ID de la sesion'),
        title: z.string().optional(),
        url: z.string().optional(),
        summary: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
      execute: async (params: any) => {
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesion para guardar fuentes.';
        }
        const sessionId = typeof params?.session_id === 'string' ? params.session_id.trim() : '';
        if (!sessionId) return 'Error: session_id requerido.';

        const { error } = await writeClient
          .from('research_sources')
          .insert({
            session_id: sessionId,
            title: typeof params?.title === 'string' ? params.title.trim() : null,
            url: typeof params?.url === 'string' ? params.url.trim() : null,
            summary: typeof params?.summary === 'string' ? params.summary.trim() : null,
            data: typeof params?.data === 'object' && params.data ? params.data : {},
          });

        if (error) {
          console.error('Error creating research source:', error);
          return 'Error: No se pudo guardar la fuente.';
        }

        return 'OK';
      },
    }),
    createProductCandidate: (tool as any)({
      description: 'Guarda un producto candidato para una sesion.',
      parameters: z.object({
        session_id: z.string().describe('ID de la sesion'),
        name: z.string().describe('Nombre del producto'),
        summary: z.string().optional(),
        pros: z.string().optional(),
        cons: z.string().optional(),
        price_range: z.string().optional(),
        demand_level: z.string().optional(),
        competition_level: z.string().optional(),
        score: z.number().optional(),
        meta: z.record(z.any()).optional(),
      }),
      execute: async (params: any) => {
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesion para guardar candidatos.';
        }
        const sessionId = typeof params?.session_id === 'string' ? params.session_id.trim() : '';
        const name = typeof params?.name === 'string' ? params.name.trim() : '';
        if (!sessionId || !name) return 'Error: session_id y name requeridos.';

        const { data, error } = await writeClient
          .from('product_candidates')
          .insert({
            session_id: sessionId,
            name,
            summary: typeof params?.summary === 'string' ? params.summary.trim() : null,
            pros: typeof params?.pros === 'string' ? params.pros.trim() : null,
            cons: typeof params?.cons === 'string' ? params.cons.trim() : null,
            price_range: typeof params?.price_range === 'string' ? params.price_range.trim() : null,
            demand_level: typeof params?.demand_level === 'string' ? params.demand_level.trim() : null,
            competition_level: typeof params?.competition_level === 'string'
              ? params.competition_level.trim()
              : null,
            score: typeof params?.score === 'number' ? params.score : null,
            meta: typeof params?.meta === 'object' && params.meta ? params.meta : {},
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating candidate:', error);
          return 'Error: No se pudo guardar el candidato.';
        }

        return JSON.stringify({ candidate_id: data?.id });
      },
    }),
    createProductSupplier: (tool as any)({
      description: 'Guarda un proveedor asociado a una sesion o producto.',
      parameters: z.object({
        session_id: z.string().describe('ID de la sesion'),
        candidate_id: z.string().optional().describe('ID del candidato'),
        name: z.string().describe('Nombre del proveedor'),
        website: z.string().optional(),
        contact: z.string().optional(),
        price_range: z.string().optional(),
        notes: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
      execute: async (params: any) => {
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesion para guardar proveedores.';
        }
        const sessionId = typeof params?.session_id === 'string' ? params.session_id.trim() : '';
        const name = typeof params?.name === 'string' ? params.name.trim() : '';
        if (!sessionId || !name) return 'Error: session_id y name requeridos.';

        const { error } = await writeClient
          .from('product_suppliers')
          .insert({
            session_id: sessionId,
            candidate_id: typeof params?.candidate_id === 'string' ? params.candidate_id.trim() : null,
            name,
            website: typeof params?.website === 'string' ? params.website.trim() : null,
            contact: typeof params?.contact === 'string' ? params.contact.trim() : null,
            price_range: typeof params?.price_range === 'string' ? params.price_range.trim() : null,
            notes: typeof params?.notes === 'string' ? params.notes.trim() : null,
            data: typeof params?.data === 'object' && params.data ? params.data : {},
          });

        if (error) {
          console.error('Error creating supplier:', error);
          return 'Error: No se pudo guardar el proveedor.';
        }

        return 'OK';
      },
    }),
    updateResearchSession: (tool as any)({
      description: 'Actualiza la sesion con estado o candidato seleccionado.',
      parameters: z.object({
        session_id: z.string().describe('ID de la sesion'),
        status: z.string().optional(),
        selected_candidate_id: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (params: any) => {
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesion para actualizar la sesion.';
        }
        const sessionId = typeof params?.session_id === 'string' ? params.session_id.trim() : '';
        if (!sessionId) return 'Error: session_id requerido.';

        const update: Record<string, unknown> = {};
        if (typeof params?.status === 'string' && params.status.trim()) {
          update.status = params.status.trim().toLowerCase();
        }
        if (typeof params?.selected_candidate_id === 'string') {
          update.selected_candidate_id = params.selected_candidate_id.trim() || null;
        }
        if (typeof params?.notes === 'string') {
          update.notes = params.notes.trim();
        }

        if (Object.keys(update).length === 0) return 'Error: No hay cambios.';

        const { error } = await writeClient
          .from('research_sessions')
          .update(update)
          .eq('id', sessionId)
          .eq('user_id', effectiveUserId);

        if (error) {
          console.error('Error updating session:', error);
          return 'Error: No se pudo actualizar la sesion.';
        }

        return 'OK';
      },
    }),
    createProductAsset: (tool as any)({
      description: 'Guarda assets (imagenes, copys, specs) para una sesion o producto.',
      parameters: z.object({
        session_id: z.string().describe('ID de la sesion'),
        candidate_id: z.string().optional(),
        asset_type: z.string().describe('Tipo de asset: image, copy, spec, etc'),
        url: z.string().optional(),
        content: z.record(z.any()).optional(),
      }),
      execute: async (params: any) => {
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesion para guardar assets.';
        }
        const sessionId = typeof params?.session_id === 'string' ? params.session_id.trim() : '';
        const assetType = typeof params?.asset_type === 'string' ? params.asset_type.trim() : '';
        if (!sessionId || !assetType) return 'Error: session_id y asset_type requeridos.';

        const { error } = await writeClient
          .from('product_assets')
          .insert({
            session_id: sessionId,
            candidate_id: typeof params?.candidate_id === 'string' ? params.candidate_id.trim() : null,
            asset_type: assetType,
            url: typeof params?.url === 'string' ? params.url.trim() : null,
            content: typeof params?.content === 'object' && params.content ? params.content : {},
          });

        if (error) {
          console.error('Error creating asset:', error);
          return 'Error: No se pudo guardar el asset.';
        }

        return 'OK';
      },
    }),
    createStore: (tool as any)({
      description: 'Crea una nueva tienda en la base de datos. USAR SOLO DESPUÉS DE VALIDAR EL PRODUCTO.',
      parameters: z.object({
        name: z.string().describe('El nombre de la tienda'),
        description: z.string().describe('Una breve descripción de qué vende la tienda o su nicho'),
        slug: z.string().describe('Un identificador único para la URL (basado en el nombre, sin espacios, minúsculas)'),
      }),
      execute: async (params: any) => {
        const { name, description, slug } = params;
        if (!effectiveUserId) {
          return 'Error: Debes iniciar sesión para crear una tienda.';
        }

        try {
          const { error } = await writeClient
            .from('stores')
            .insert({
              user_id: effectiveUserId,
              name,
              description,
              slug,
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') { // Unique violation
              return `Ups, el nombre "${name}" (slug: ${slug}) ya está ocupado. ¿Probamos con otro?`;
            }
            console.error('Error creating store:', error);
            return 'Tuve un problema técnico creando la tienda. Intenta de nuevo en un momento.';
          }

          return `¡Listo el pollo! He creado tu tienda "${name}" exitosamente. Ahora vamos a configurarla.`;
        } catch (err) {
          console.error('Unexpected error:', err);
          return 'Ocurrió un error inesperado. Intenta nuevamente.';
        }
      },
    }),
  } as any;

  let promptOverrides: Record<string, string> = {};
  let agentDefinitions: { key: string; name: string; description: string; defaultPrompt: string }[] = [];

  if (effectiveUserId) {
    try {
      const { data, error } = await supabase
        .from('agent_prompts')
        .select('agent_key, prompt')
        .eq('user_id', effectiveUserId);

      if (!error && data) {
        promptOverrides = data.reduce((acc: Record<string, string>, row: any) => {
          acc[row.agent_key] = row.prompt;
          return acc;
        }, {});
      }
    } catch (err) {
      console.warn('/api/chat: no se pudieron cargar prompts personalizados', err);
    }
  }

  try {
    const { data, error } = await supabase
      .from('agent_definitions')
      .select('agent_key, name, description, default_prompt, active')
      .eq('active', true)
      .order('name');

    if (!error && data && data.length > 0) {
      agentDefinitions = data.map((agent: any) => ({
        key: agent.agent_key,
        name: agent.name,
        description: agent.description,
        defaultPrompt: agent.default_prompt,
      }));
    }
  } catch (err) {
    console.warn('/api/chat: no se pudieron cargar agentes dinamicos', err);
  }

  if (agentDefinitions.length === 0) {
    agentDefinitions = AGENT_CONFIGS.map((agent) => ({
      key: agent.key,
      name: agent.name,
      description: agent.description,
      defaultPrompt: agent.defaultPrompt,
    }));
  }

  const getAgentPrompt = (key: AgentKey | string) => {
    const base = agentDefinitions.find((cfg) => cfg.key === key)?.defaultPrompt || '';
    const custom = promptOverrides[key];
    return custom ? `${base}\n\nInstrucciones personalizadas:\n${custom}` : base;
  };

  if (sync) {
    const latestUser = [...messages].reverse().find((msg: any) => msg.role === 'user');
    const seedQuery = latestUser?.content ? String(latestUser.content) : '';
    const availableKeys = agentDefinitions.map((agent) => agent.key);
    const orchestratorPrompt = getAgentPrompt('orchestrator');

    let activeSessionId: string | null = null;
    let selectedCandidateId: string | null = null;
    let sessionErrorMessage: string | null = null;
    const debugInfo: Record<string, unknown> = {};

    if (effectiveUserId) {
      const { data: existingSession } = await writeClient
        .from('research_sessions')
        .select('id, status, selected_candidate_id')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession && existingSession.status !== 'completed') {
        activeSessionId = existingSession.id;
        selectedCandidateId = existingSession.selected_candidate_id || null;
      } else if (seedQuery.trim()) {
        const { data: createdSession, error: sessionError } = await writeClient
          .from('research_sessions')
          .insert({
            user_id: effectiveUserId,
            goal: seedQuery,
            status: 'researching',
          })
          .select('id')
          .single();

        if (!sessionError) {
          activeSessionId = createdSession?.id || null;
        } else {
          sessionErrorMessage = sessionError.message || 'No se pudo crear la sesion.';
        }
      }
    }

    if (isDev) {
      debugInfo.sessionId = activeSessionId;
      if (sessionErrorMessage) {
        debugInfo.sessionError = sessionErrorMessage;
      }
    }

    const wantsStoreDraft = /(crear|armar|generar)\s+(tienda|store)/i.test(seedQuery);
    const wantsStoreConfirm = /(confirmo|confirmar|aprobado|dale|si\s*,?\s*crea)/i.test(seedQuery)
      && /tienda|store/i.test(seedQuery);
    const wantsLandingDraft = /(crear|armar|generar)\s+landing/i.test(seedQuery);
    const wantsLandingConfirm = /(confirmo|confirmar|aprobado|dale|si\s*,?\s*crea)/i.test(seedQuery)
      && /landing/i.test(seedQuery);

    const slugify = (value: string) => value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const loadSelectedCandidate = async () => {
      if (!activeSessionId || !selectedCandidateId) return null;
      const { data } = await writeClient
        .from('product_candidates')
        .select('id, name, summary')
        .eq('id', selectedCandidateId)
        .eq('session_id', activeSessionId)
        .maybeSingle();
      return data || null;
    };

    const loadLatestStoreDraft = async () => {
      if (!activeSessionId) return null;
      const { data } = await writeClient
        .from('product_assets')
        .select('id, content')
        .eq('session_id', activeSessionId)
        .eq('asset_type', 'store_draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || null;
    };

    const loadLatestLandingDraft = async () => {
      if (!activeSessionId) return null;
      const { data } = await writeClient
        .from('product_assets')
        .select('id, content')
        .eq('session_id', activeSessionId)
        .eq('asset_type', 'landing_draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || null;
    };

    const resolveLandingStoreId = async () => {
      if (!effectiveUserId) return null;
      const storeDraft = await loadLatestStoreDraft();
      const draftContent = storeDraft?.content as { slug?: string; name?: string } | undefined;

      if (draftContent?.slug) {
        const { data } = await writeClient
          .from('stores')
          .select('id')
          .eq('user_id', effectiveUserId)
          .eq('slug', draftContent.slug)
          .maybeSingle();
        if (data?.id) return data.id;
      }

      if (draftContent?.name) {
        const { data } = await writeClient
          .from('stores')
          .select('id')
          .eq('user_id', effectiveUserId)
          .eq('name', draftContent.name)
          .maybeSingle();
        if (data?.id) return data.id;
      }

      const { data } = await writeClient
        .from('stores')
        .select('id')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data?.id || null;
    };

    const ensureLandingSlug = async (baseSlug: string) => {
      if (!baseSlug) return baseSlug;
      const { data } = await writeClient
        .from('landing_pages')
        .select('id')
        .eq('slug', baseSlug)
        .maybeSingle();
      if (!data) return baseSlug;
      const suffix = Date.now().toString().slice(-4);
      return `${baseSlug}-${suffix}`;
    };

    if (wantsStoreDraft) {
      if (!activeSessionId || !effectiveUserId) {
        return new Response(JSON.stringify({ content: 'Primero inicia una investigacion para poder crear la tienda.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!selectedCandidateId) {
        return new Response(JSON.stringify({ content: 'Selecciona un producto primero para poder crear la tienda.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const candidate = await loadSelectedCandidate();
      const baseName = candidate?.name || 'Mi tienda';
      const suggestedName = `Tienda ${baseName}`;
      const suggestedSlug = slugify(suggestedName);
      const suggestedDescription = candidate?.summary
        ? `Tienda especializada en ${candidate.summary.toLowerCase()}.`
        : `Tienda especializada en ${baseName.toLowerCase()}.`;

      await writeClient
        .from('product_assets')
        .insert({
          session_id: activeSessionId,
          candidate_id: selectedCandidateId,
          asset_type: 'store_draft',
          content: {
            name: suggestedName,
            slug: suggestedSlug,
            description: suggestedDescription,
          },
        });

      const responseText = `Te propongo estos datos para la tienda:\n- Nombre: ${suggestedName}\n- Slug: ${suggestedSlug}\n- Descripcion: ${suggestedDescription}\n\nSi quieres que la cree asi, responde: "Confirmo crear tienda".`;

      return new Response(JSON.stringify({ content: responseText, debug: isDev ? debugInfo : undefined }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (wantsStoreConfirm) {
      if (!activeSessionId || !effectiveUserId) {
        return new Response(JSON.stringify({ content: 'Necesito una sesion activa para crear la tienda.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const draft = await loadLatestStoreDraft();
      const draftContent = draft?.content as { name?: string; slug?: string; description?: string } | undefined;

      if (!draftContent?.name || !draftContent?.slug || !draftContent?.description) {
        return new Response(JSON.stringify({ content: 'No tengo un borrador de tienda. Dime "crear tienda" para generarlo primero.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { error } = await writeClient
        .from('stores')
        .insert({
          user_id: effectiveUserId,
          name: draftContent.name,
          slug: draftContent.slug,
          description: draftContent.description,
        })
        .select('id')
        .single();

      if (error) {
        return new Response(JSON.stringify({ content: 'No pude crear la tienda. Dime si quieres intentar con otro nombre.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await writeClient
        .from('research_sessions')
        .update({ status: 'completed' })
        .eq('id', activeSessionId)
        .eq('user_id', effectiveUserId);

      return new Response(JSON.stringify({ content: `Listo. La tienda "${draftContent.name}" quedo creada.` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (wantsLandingDraft) {
      if (!activeSessionId || !effectiveUserId) {
        return new Response(JSON.stringify({ content: 'Primero inicia una investigacion para crear la landing.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!selectedCandidateId) {
        return new Response(JSON.stringify({ content: 'Selecciona un producto primero para crear la landing.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const candidate = await loadSelectedCandidate();
      const candidateName = candidate?.name || 'Producto';
      const landingPrompt = `
Eres LandingBuilderAgent. Creas estructura y copy de landing pages.
Idea/producto: "${candidateName}"
Contexto: ${researchContext}

Instrucciones del orquestador:
${orchestratorPrompt}

Instrucciones del agente:
${getAgentPrompt('landing_builder')}

Entrega:
- Titulo principal
- Subtitulo
- 3 beneficios
- Prueba social
- Seccion FAQ (3 preguntas)
- CTA final

No menciones herramientas ni el proceso. Responde solo con el contenido.
`;

      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: landingPrompt,
        messages,
      } as any);

      const title = `Landing ${candidateName}`;
      const baseSlug = slugify(title || candidateName);
      const slug = await ensureLandingSlug(baseSlug || `landing-${Date.now().toString().slice(-4)}`);
      const content = { raw: result.text || '', kind: 'landing' };

      await writeClient
        .from('product_assets')
        .insert({
          session_id: activeSessionId,
          candidate_id: selectedCandidateId,
          asset_type: 'landing_draft',
          content: {
            title,
            slug,
            status: 'draft',
            content,
          },
        });

      const responseText = `Tengo listo el borrador de landing:\n- Titulo: ${title}\n- Slug: ${slug}\n\nSi quieres que la cree asi, responde: "Confirmo crear landing".`;

      return new Response(JSON.stringify({ content: responseText, debug: isDev ? debugInfo : undefined }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (wantsLandingConfirm) {
      if (!activeSessionId || !effectiveUserId) {
        return new Response(JSON.stringify({ content: 'Necesito una sesion activa para crear la landing.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const draft = await loadLatestLandingDraft();
      const draftContent = draft?.content as {
        title?: string;
        slug?: string;
        status?: string;
        content?: Record<string, unknown>;
      } | undefined;

      if (!draftContent?.title || !draftContent?.slug || !draftContent?.content) {
        return new Response(JSON.stringify({ content: 'No tengo un borrador de landing. Dime "crear landing" para generarlo primero.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const slug = await ensureLandingSlug(draftContent.slug);
      const storeId = await resolveLandingStoreId();

      const { error } = await writeClient
        .from('landing_pages')
        .insert({
          user_id: effectiveUserId,
          store_id: storeId,
          title: draftContent.title,
          slug,
          status: draftContent.status || 'draft',
          content: draftContent.content,
        })
        .select('id')
        .single();

      if (error) {
        return new Response(JSON.stringify({ content: 'No pude crear la landing. Dime si quieres intentar de nuevo.' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const storeMessage = storeId ? ' y la vincule a tu tienda.' : '.';

      return new Response(JSON.stringify({
        content: `Listo. La landing "${draftContent.title}" quedo creada${storeMessage}`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let intent = (() => {
      const text = seedQuery.toLowerCase();
      if (/(copy|caption|post|instagram|tiktok|facebook|anuncio|ads|publicidad)/.test(text)) {
        return 'copy';
      }
      if (/(landing|pagina|página|sitio|home|web|embudo)/.test(text)) {
        return 'landing_builder';
      }
      if (/(imagen|imagenes|video|videos|reel|reels|short|shorts|creativo|creativos)/.test(text)) {
        return 'media_creator';
      }
      if (/(error|falla|fallo|no funciona|no responde|arreglar|solucionar|debug)/.test(text)) {
        return 'fallback_monitor';
      }
      if (/(recomienda|mejor|opcion|opciones|comparar|tabla)/.test(text)) {
        return 'recommendation';
      }
      return 'research';
    })();

    try {
      const routingPrompt = `
Eres un orquestador. Elige SOLO una clave de agente para responder.
Claves disponibles: ${availableKeys.join(', ')}

Instrucciones del orquestador:
${orchestratorPrompt}

Mensaje del usuario: "${seedQuery}"

Responde solo con la clave exacta.
`;

      const routingResult = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: routingPrompt,
        messages: [],
      } as any);

      const selected = String(routingResult.text || '').trim();
      if (availableKeys.includes(selected)) {
        intent = selected;
      }
    } catch (err) {
      console.warn('/api/chat: router IA fallo, usando heuristica', err);
    }

    let researchContext = 'Sin datos externos disponibles.';
    let researchResults: Array<Record<string, unknown>> = [];

    try {
      const context = await tvly.search(`tendencia ${seedQuery} LATAM`, {
        searchDepth: "advanced",
        maxResults: 5,
      });
      researchContext = JSON.stringify(context);
      if (Array.isArray((context as { results?: unknown }).results)) {
        researchResults = (context as { results: Array<Record<string, unknown>> }).results;
      }

      if (activeSessionId && effectiveUserId && researchResults.length > 0) {
        const payload = researchResults.slice(0, 6).map((result) => ({
          session_id: activeSessionId,
          title: typeof result.title === 'string' ? result.title : null,
          url: typeof result.url === 'string' ? result.url : null,
          summary: typeof result.content === 'string'
            ? result.content
            : typeof result.snippet === 'string'
              ? result.snippet
              : null,
          data: result,
        }));

        const { error: sourceError } = await writeClient
          .from('research_sources')
          .insert(payload);

        if (sourceError) {
          console.warn('No se pudieron guardar fuentes de investigacion (sync)', sourceError);
        }
      }
    } catch (error) {
      console.error('Tavily Error (sync):', error);
    }

    const saveGeneratedAsset = async (assetType: string, rawText: string) => {
      if (!activeSessionId || !effectiveUserId) return;
      try {
        await writeClient
          .from('product_assets')
          .insert({
            session_id: activeSessionId,
            candidate_id: selectedCandidateId,
            asset_type: assetType,
            content: { raw: rawText, kind: assetType },
          });
      } catch (error) {
        console.warn('No se pudo guardar asset generado', error);
      }
    };

    if (intent === 'copy') {
      const copyPrompt = `
Eres CopySocialAgent. Genera copys de ventas en español LATAM.
Idea/producto: "${seedQuery}"
Contexto: ${researchContext}

  Instrucciones del orquestador:
  ${orchestratorPrompt}

Instrucciones del agente:
${getAgentPrompt('copy')}

Entrega:
  - Seccion Instagram: 3 opciones numeradas, cada una con texto y CTA.
  - Seccion TikTok: 2 opciones numeradas, cada una con gancho + CTA.
  - Seccion Facebook: 2 opciones numeradas, beneficios + CTA.
  - Seccion Hashtags: 12 hashtags en una sola linea.

No menciones herramientas ni el proceso. Responde solo con el contenido.
`;

      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: copyPrompt,
        messages,
      } as any);

      await saveGeneratedAsset('copy', result.text || '');

      return new Response(JSON.stringify({ content: result.text, debug: isDev ? debugInfo : undefined }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (intent === 'landing_builder') {
      const landingPrompt = `
Eres LandingBuilderAgent. Creas estructura y copy de landing pages.
Idea/producto: "${seedQuery}"
Contexto: ${researchContext}

Instrucciones del orquestador:
${orchestratorPrompt}

Instrucciones del agente:
${getAgentPrompt('landing_builder')}

Entrega:
- Titulo principal
- Subtitulo
- 3 beneficios
- Prueba social
- Seccion FAQ (3 preguntas)
- CTA final

No menciones herramientas ni el proceso. Responde solo con el contenido.
`;

      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: landingPrompt,
        messages,
      } as any);

      await saveGeneratedAsset('landing', result.text || '');

      return new Response(JSON.stringify({ content: result.text, debug: isDev ? debugInfo : undefined }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (intent === 'media_creator') {
      const mediaPrompt = `
Eres MediaCreatorAgent. Generas ideas de imagenes y videos cortos.
Idea/producto: "${seedQuery}"
Contexto: ${researchContext}

Instrucciones del orquestador:
${orchestratorPrompt}

Instrucciones del agente:
${getAgentPrompt('media_creator')}

Entrega:
- 3 ideas de imagen con prompt visual
- 2 guiones cortos para video (gancho, desarrollo, CTA)

No menciones herramientas ni el proceso. Responde solo con el contenido.
`;

      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: mediaPrompt,
        messages,
      } as any);

      await saveGeneratedAsset('media', result.text || '');

      return new Response(JSON.stringify({ content: result.text, debug: isDev ? debugInfo : undefined }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (intent === 'fallback_monitor') {
      const fallbackPrompt = `
Eres FallbackMonitorAgent. Diagnosticas fallos y propones soluciones claras.
Contexto del usuario: "${seedQuery}"

Instrucciones del orquestador:
${orchestratorPrompt}

Instrucciones del agente:
${getAgentPrompt('fallback_monitor')}

Entrega:
- Posible causa principal
- 3 pasos concretos para resolver
- 1 pregunta de verificacion

No menciones herramientas ni el proceso. Responde solo con el contenido.
`;

      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: fallbackPrompt,
        messages,
      } as any);

      return new Response(JSON.stringify({ content: result.text, debug: isDev ? debugInfo : undefined }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recommendationPrompt = `
Eres ProductRecommendationAgent para LATAM.
Idea/producto: "${seedQuery}"
Contexto de investigacion: ${researchContext}

  Instrucciones del orquestador:
  ${orchestratorPrompt}

  Instrucciones del agente:
  ${getAgentPrompt('recommendation')}

  Responde SIEMPRE con:
  1) Tabla Markdown (primera linea de la respuesta) con encabezado exacto:
| Producto | Demanda | Competencia | Margen | Proveedor | Recomendacion |
2) 2-3 bullets de recomendacion
3) 1 pregunta final corta para avanzar

No menciones herramientas ni el proceso.
`;

    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: recommendationPrompt,
      messages,
    } as any);

    if (activeSessionId && effectiveUserId) {
      const { count } = await writeClient
        .from('product_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', activeSessionId);

      if (!count || count === 0) {
        const parsed = parseMarkdownTable(result.text || '');
        if (parsed) {
          for (const row of parsed.rows) {
            const [product, demand, competition, margin, supplier, recommendation] = row;
            if (!product) continue;

            const { data: candidate } = await writeClient
              .from('product_candidates')
              .insert({
                session_id: activeSessionId,
                name: product,
                demand_level: demand || null,
                competition_level: competition || null,
                price_range: margin || null,
                summary: recommendation || null,
                meta: {
                  proveedor: supplier || null,
                  recomendacion: recommendation || null,
                },
              })
              .select('id')
              .single();

            if (supplier && candidate?.id) {
              await writeClient
                .from('product_suppliers')
                .insert({
                  session_id: activeSessionId,
                  candidate_id: candidate.id,
                  name: supplier,
                });
            }
          }

          await writeClient
            .from('research_sessions')
            .update({ status: 'proposed' })
            .eq('id', activeSessionId)
            .eq('user_id', effectiveUserId);
        }
      }
    }

    return new Response(JSON.stringify({ content: result.text, debug: isDev ? debugInfo : undefined }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    system: systemPrompt,
    messages,
    tools,
  } as any);

    console.log('/api/chat: streamText creado exitosamente');
    
    if (!sync && typeof (result as any).toDataStreamResponse === 'function') {
      return (result as any).toDataStreamResponse({
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    if (!sync) {
      console.warn('/api/chat: toDataStreamResponse no disponible, usando fallback');
    }

    // Fallback: petición sin stream al API de Groq (OpenAI-compatible)
    try {
      const modelName = typeof (result as { model?: unknown }).model === 'string'
        ? (result as unknown as { model: string }).model
        : 'llama-3.1-8b-instant';
      console.log('/api/chat: fallback usando modelo', modelName);
      const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      const body = JSON.stringify({ model: modelName, messages });
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body,
      });

      console.log('/api/chat: fallback response status', r.status);
      const json = await r.json();
      console.log('/api/chat: fallback response body', JSON.stringify(json).slice(0, 2000));
      // Intentar extraer texto compatible (OpenAI-style)
      const text = (json?.choices && json.choices[0] && (json.choices[0].message?.content || json.choices[0].text)) || JSON.stringify(json);

      if (sync) {
        return new Response(JSON.stringify({ content: String(text) }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Enviar como un único chunk para que el cliente lo muestre
      const encoder = new TextEncoder();
      const singleStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify([String(text)])}\n`));
          controller.enqueue(encoder.encode(`e:${JSON.stringify({ finishReason: 'stop' })}\n`));
          controller.close();
        },
      });

      return new Response(singleStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    } catch (err) {
      console.error('/api/chat: fallback error:', err);
      return new Response('Error en fallback del chat', { status: 500 });
    }
  } catch (error) {
    console.error('/api/chat: ERROR CRÍTICO:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Devolver un stream de error simple
    return new Response(`Error en el chat: ${errorMessage}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
