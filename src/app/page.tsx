import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black z-0" />
      
      <div className="relative z-10 text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          EcomIA
        </h1>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          Tu socio inteligente para el comercio electrónico. 
          Crea, gestiona y escala tu negocio con el poder de la IA Generativa.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-full font-medium transition-all hover:scale-105"
          >
            Comenzar Ahora <ArrowRight size={20} />
          </Link>
          <Link 
            href="/login" 
            className="flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-medium transition-all"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
