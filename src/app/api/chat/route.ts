import { createGroq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { tavily } from '@tavily/core';

// Allow streaming responses up to 60 seconds (research takes time)
export const maxDuration = 60;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Verificar autenticación
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const systemPrompt = `
    Eres EcomIA, un consultor experto en comercio electrónico y emprendimiento digital para LATAM.
    
    TU OBJETIVO PRINCIPAL:
    Ayudar a emprendedores a validar ideas de negocio y crear tiendas exitosas.
    
    PROTOCOLO DE ACTUACIÓN (SIGUE ESTRICTAMENTE):
    1. CUANDO EL USUARIO TIENE UNA IDEA:
       - NO crees la tienda de inmediato.
       - Primero, INVESTIGA EL MERCADO usando la herramienta 'searchMarket'. Busca tendencias actuales, competencia y demanda.
       - Basado en la investigación, dale un feedback honesto.
       - SIEMPRE ofrece 3 OPCIONES concretas de productos ganadores relacionados con su idea.
       - Para cada opción, sugiere proveedores reales (ej: Dropi, AliExpress, fabricantes locales) o modelos de negocio (Dropshipping, Marca propia).
    
    2. CUANDO EL USUARIO ELIGE UNA OPCIÓN:
       - Solo entonces, procede a crear la tienda usando la herramienta 'createStore'.
    
    PERSONALIDAD:
    - Habla en español coloquial, amigable y cercano (estilo LATAM: "chévere", "de una", "parce").
    - Sé directo y honesto. Si una idea es mala, dilo con tacto pero con datos.
    - Cero tecnicismos aburridos.
    
    HERRAMIENTAS:
    - searchMarket: Úsala OBLIGATORIAMENTE antes de validar cualquier idea de producto.
    - createStore: Úsala solo cuando el usuario confirme qué quiere vender después de tu asesoría.
  `;

  const result = streamText({
    model: groq('llama-3.1-70b-versatile'),
    system: systemPrompt,
    messages,
    maxSteps: 5, // Allow multi-step tool execution (Search -> Analyze -> Respond)
    tools: {
      searchMarket: tool({
        description: 'Investiga tendencias de mercado, competidores y proveedores para un producto o nicho específico en tiempo real.',
        parameters: z.object({
          query: z.string().describe('La búsqueda específica (ej: "tendencia termos digitales colombia 2025", "proveedores dropshipping ropa deportiva")'),
        }),
        execute: async ({ query }) => {
          try {
            const context = await tvly.search(query, {
              searchDepth: "advanced",
              maxResults: 5,
            });
            return JSON.stringify(context);
          } catch (error) {
            console.error('Tavily Error:', error);
            return 'No pude conectar con el mercado en este momento, pero basándome en mi conocimiento general...';
          }
        },
      }),
      createStore: tool({
        description: 'Crea una nueva tienda en la base de datos. USAR SOLO DESPUÉS DE VALIDAR EL PRODUCTO.',
        parameters: z.object({
          name: z.string().describe('El nombre de la tienda'),
          description: z.string().describe('Una breve descripción de qué vende la tienda o su nicho'),
          slug: z.string().describe('Un identificador único para la URL (basado en el nombre, sin espacios, minúsculas)'),
        }),
        execute: async ({ name, description, slug }) => {
          if (!user) {
            return 'Error: Debes iniciar sesión para crear una tienda.';
          }

          try {
            const { data, error } = await supabase
              .from('stores')
              .insert({
                user_id: user.id,
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
    },
  });

  return result.toDataStreamResponse();
}
