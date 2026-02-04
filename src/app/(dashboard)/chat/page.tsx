'use client';

import { useChat } from '@ai-sdk/react';
import dynamic from 'next/dynamic';
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

export default function ChatPage() {
  const chat = useChat({
    api: '/api/chat',
    maxSteps: 5, // Enable multi-step tool calls on the client
    onError: (error) => {
      console.error("Chat error:", error);
    }
  });

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = chat;

  // Wrapper para garantizar envío
  const handleSendMessage = async (content: string) => {
    if (append) {
      return append({ role: 'user', content });
    }
    // Fallback loco si append no existe (no debería pasar si el hook inicializa)
    console.warn("Append no disponible, intentando handleSubmit manual no soportado en este wrapper");
    return undefined;
  };

  // Extract all tool invocations from assistant messages
  const toolInvocations = messages
    .filter((m) => m.role === 'assistant' && m.toolInvocations)
    .flatMap((m) => m.toolInvocations || []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-200">
      {/* Main Content Area (Research Results) */}
      <div className="flex-1 h-full overflow-hidden relative">
        <ResearchDisplay 
          toolInvocations={toolInvocations} 
          isLoading={isLoading} 
        />
      </div>

      {/* Right Sidebar (Chat) */}
      <div className="w-96 h-full flex-shrink-0 z-10">
        <ChatSidebar
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          sendMessage={handleSendMessage} // Pasamos nuestro wrapper robusto
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
