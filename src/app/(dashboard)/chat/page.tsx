
'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';

// Lazy load ResearchDisplay to optimize memory usage
const ResearchDisplay = dynamic(
  () => import('@/components/chat/ResearchDisplay').then((mod) => mod.ResearchDisplay),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string };
type ToolInvocation = { toolName?: string; state?: string; args?: { query?: string }; result?: unknown };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toolInvocations = useMemo<ToolInvocation[]>(() => [], []);

  const latestAssistantMessage = useMemo(() => {
    const latest = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && typeof m.content === 'string');
    return latest?.content || '';
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');

    try {
      const res = await fetch('/api/chat?sync=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error en el chat');
      }

      const data = await res.json();
      const rawAssistantText = data?.content ? String(data.content) : '';
      const assistantText = rawAssistantText
        .replace(/<function=\w+>[^]*?<\/function>/g, '')
        .replace(/<function=\w+>[^]*$/g, '')
        .trim();
      if (!assistantText.trim()) {
        throw new Error('No hubo respuesta del asistente.');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-gray-200 dark:bg-black">
      {/* Main Content Area (Research Results) */}
      <div className="flex-1 min-w-0 h-full min-h-0 overflow-hidden relative">
        <ResearchDisplay 
          toolInvocations={toolInvocations} 
          isLoading={isLoading} 
          assistantMessage={latestAssistantMessage}
          refreshKey={messages.length}
          onQuickPrompt={sendMessage}
        />
      </div>

      {/* Right Sidebar (Chat) */}
      <div className="w-full lg:w-64 xl:w-72 h-[40vh] lg:h-full flex-shrink-0 z-10">
        <ChatSidebar
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          sendMessage={sendMessage}
          isLoading={isLoading}
          sessionRefreshKey={messages.length}
        />
        {error && (
          <div className="px-4 pb-4 text-sm text-red-600">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
