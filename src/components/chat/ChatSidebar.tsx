'use client';

import { Send, Bot, User } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { EcomAgentLogo } from '@/components/ui/EcomAgentLogo';

interface Message {
  id: string;
  role: string;
  content: string;
}

interface ChatSidebarProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  append?: (message: any) => Promise<string | null | undefined>; // Usamos any para flexibilidad con versiones de SDK
  isLoading: boolean;
}

export function ChatSidebar({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  append,
  isLoading 
}: ChatSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // SOLUCIÓN DEFINITIVA: Estado local para control inmediato del input
  // Esto evita bloqueos si el hook useChat tarda en responder
  const [localInput, setLocalInput] = useState(input || '');

  // Sincronizar estado local con el prop input (ej. cuando se limpia tras enviar)
  useEffect(() => {
    // Solo sincronizamos si input está vacío (limpieza externa) o si es diferente
    // Evitamos sobrescribir lo que el usuario escribe si hay lag en el prop input
    if (input === '' && localInput !== '') {
       // Si el input externo se limpió, limpiamos el local
       setLocalInput('');
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Manejador robusto de cambios
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalInput(newValue); // Actualización visual inmediata
    
    // Propagar al hook de AI (opcional pero mantenemos compatibilidad)
    if (handleInputChange) {
      handleInputChange(e);
    }
  };

  // Manejador de envío personalizado usando append para evitar dependencias de estado asíncrono
  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localInput.trim() || isLoading) return;

    const content = localInput;
    setLocalInput(''); // Limpieza inmediata UI

    if (append) {
      try {
        await append({ role: 'user', content });
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        setLocalInput(content); // Restaurar si falla
      }
    } else {
      // Fallback a handleSubmit tradicional si no hay append
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200 shadow-xl">
      <div className="p-4 border-b border-gray-200 bg-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EcomAgentLogo size="sm" showText={false} />
          <h3 className="font-bold text-gray-700">EcomAgent</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Online
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
            <EcomAgentLogo size="lg" showText={false} className="mb-4 opacity-80" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">¡Hola! Soy EcomAgent</h4>
            <p className="text-sm text-gray-500 max-w-[200px]">
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
                  <div className="bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                    <EcomAgentLogo size="sm" showText={false} />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          )
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 mt-1">
              <div className="bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                <EcomAgentLogo size="sm" showText={false} />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 rounded-bl-none shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleLocalSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
          <input
            value={localInput}
            onChange={handleLocalChange}
            placeholder="Escribe tu idea..."
            autoComplete="off"
            disabled={false} // Forzamos habilitado siempre
            style={{ cursor: 'text' }} // Forzamos cursor de texto
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none text-gray-900 placeholder:text-gray-500 cursor-text"
          />
          <button
            type="submit"
            disabled={isLoading || !localInput || localInput.trim().length === 0}
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
