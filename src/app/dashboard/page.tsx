import Link from "next/link";
import { MessageSquare, Store, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenido de nuevo a EcomIA</p>
        </div>
        <Link 
          href="/chat" 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare size={18} />
          Nuevo Chat
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Action Card 1 */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare size={20} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Investigación de Mercado</h3>
          <p className="text-gray-500 text-sm mb-4">Analiza tendencias y encuentra productos ganadores con IA.</p>
          <Link href="/chat" className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Ir al Chat <ArrowRight size={16} />
          </Link>
        </div>

        {/* Quick Action Card 2 */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-4">
            <Store size={20} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Mis Tiendas</h3>
          <p className="text-gray-500 text-sm mb-4">Gestiona tus tiendas online y revisa su rendimiento.</p>
          <Link href="/stores" className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Ver Tiendas <ArrowRight size={16} />
          </Link>
        </div>

        {/* Quick Action Card 3 */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center mb-4">
            <ArrowRight size={20} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Tutoriales</h3>
          <p className="text-gray-500 text-sm mb-4">Aprende a sacar el máximo provecho de EcomIA.</p>
          <span className="text-gray-400 text-sm font-medium cursor-not-allowed">Próximamente</span>
        </div>
      </div>
    </div>
  );
}
