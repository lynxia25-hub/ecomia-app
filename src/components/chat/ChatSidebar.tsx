'use client';

import { Send, User } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { EcomAgentLogo } from '@/components/ui/EcomAgentLogo';
import SessionStatusCard from '@/components/chat/SessionStatusCard';
import ResearchFlowSteps from '@/components/ui/ResearchFlowSteps';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSidebarProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  sendMessage?: (content: string) => Promise<void>; // Nuevo prop robusto
  append?: (message: Omit<Message, 'id'>) => Promise<string | null | undefined>; // Deprecado a favor de sendMessage, pero mantenido por compatibilidad
  isLoading: boolean;
  sessionRefreshKey?: number;
}

export function ChatSidebar({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  sendMessage,
  append,
  isLoading,
  sessionRefreshKey = 0,
}: ChatSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleInputChange) {
      handleInputChange(e);
    }
  };

  // Manejador de envío ULTRA ROBUSTO
  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const content = input;
    try {
      // Priorizar handleSubmit (usa el estado interno del hook)
      if (typeof handleSubmit === 'function') {
        await (async () => handleSubmit(e))();
        return;
      }

      // Fallback con append (envia con contenido directo)
      if (append) {
        await append({ role: 'user', content });
        return;
      }

      // Fallback final con sendMessage
      if (sendMessage) {
        await sendMessage(content);
        return;
      }

      console.error('No hay método de envío disponible');
      alert('Error: El sistema de chat no está listo. Recarga la página.');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200 shadow-xl dark:bg-gray-950 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 bg-gray-100 flex items-center justify-between dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <EcomAgentLogo size="sm" showText={false} />
          <h3 className="font-bold text-gray-800 dark:text-white">EcomAgent</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100 dark:text-green-200 dark:bg-green-900/30 dark:border-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Online
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <SessionStatusCard refreshKey={sessionRefreshKey} />
        <ResearchFlowSteps />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto p-4 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80">
            <EcomAgentLogo size="lg" showText={false} className="mb-4 opacity-80" />
            <h4 className="text-lg font-medium text-gray-800 mb-2 dark:text-white">¡Hola! Soy EcomAgent</h4>
            <p className="text-sm text-gray-700 max-w-[200px] dark:text-gray-300">
              Estoy aquí para ayudarte a crear y gestionar tu tienda online.
            </p>
          </div>
        )}
        
        {messages.map((m) => (
          m.role !== 'system' && (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role !== 'user' && (
                <div className="flex-shrink-0 mt-1">
                  <div className="bg-white p-1 rounded-full border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                    <EcomAgentLogo size="sm" showText={false} />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm break-words whitespace-pre-wrap overflow-x-auto ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100'
                }`}
              >
                {(() => {
                  if (m.role === 'user') return m.content;

                  const tablePattern = /\n?\|.+\|\n\|[-:|\s]+\|(?:\n\|.*\|)*/m;
                  const copyKeywords = /(Secci[oó]n|Instagram|TikTok|Facebook|Hashtags)/i;
                  const raw = String(m.content || '');
                  let output = raw.replace(tablePattern, '').trim();

                  output = output
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line && !/\|/.test(line) && !/tabla/i.test(line))
                    .join('\n')
                    .replace(/^\*\*[^*]+\*\*:?\s*/gm, '')
                    .trim();

                  if (copyKeywords.test(output)) {
                    return 'Los copys estan en el panel central. ¿Quieres ajustes de tono o longitud?';
                  }

                  if (!output) {
                    return 'Los datos clave estan en el panel central. ¿Quieres que te recomiende la mejor opcion?';
                  }
                  return output;
                })()}
              </div>

              {m.role === 'user' && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300 dark:bg-gray-800 dark:border-gray-700">
                    <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </div>
                </div>
              )}
            </div>
          )
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 mt-1">
              <div className="bg-white p-1 rounded-full border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                <EcomAgentLogo size="sm" showText={false} />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 rounded-bl-none shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleLocalSubmit} className="p-4 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <input
            value={input}
            onChange={handleLocalChange}
            placeholder="Escribe tu idea..."
            autoComplete="off"
            disabled={false} // Forzamos habilitado siempre
            style={{ cursor: 'text' }} // Forzamos cursor de texto
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none text-gray-900 placeholder:text-gray-500 cursor-text dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input || input.trim().length === 0}
            title={isLoading ? "Enviando..." : "Enviar mensaje"}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
