'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, TrendingUp, Users, ShoppingBag } from 'lucide-react';

interface ResearchDisplayProps {
  toolInvocations: any[]; // Using any[] to prevent type friction with different SDK versions
  isLoading: boolean;
}

export function ResearchDisplay({ toolInvocations, isLoading }: ResearchDisplayProps) {
  // Find the most recent searchMarket tool invocation
  const latestSearch = toolInvocations
    .filter((t) => t.toolName === 'searchMarket')
    .slice(-1)[0];

  if (!latestSearch && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
        <Search className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-medium mb-2">Investigación de Mercado</h3>
        <p className="max-w-md">
          Cuéntame tu idea de negocio en el chat y realizaré una investigación en tiempo real sobre tendencias, competidores y proveedores.
        </p>
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
          className="mt-6 text-xl font-medium text-gray-700"
        >
          Analizando el mercado...
        </motion.h3>
        <p className="text-gray-500 mt-2">Buscando "{latestSearch.args.query}"</p>
      </div>
    );
  }

  // Result State
  if (latestSearch && latestSearch.state === 'result') {
    const data = typeof latestSearch.result === 'string' 
      ? JSON.parse(latestSearch.result) 
      : latestSearch.result;

    return (
      <div className="h-full overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resultados de Investigación</h2>
              <p className="text-gray-500">Consulta: {latestSearch.args.query}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Results Mapping - Adapting to Tavily's response structure */}
            {data.results && data.results.map((result: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    {result.title}
                  </a>
                </h4>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {result.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    Fuente Externa
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-500">
                    {new URL(result.url).hostname}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {(!data.results || data.results.length === 0) && (
            <div className="text-center text-gray-500 py-10">
              No se encontraron resultados específicos, pero he analizado el contexto general.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return null;
}
