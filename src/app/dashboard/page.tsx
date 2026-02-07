import PillLink from "@/components/ui/PillLink";
import { MessageSquare, Store, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-72 w-full">
          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mb-3">
                <MessageSquare size={16} />
              </div>
              <h3 className="font-semibold text-base mb-1">Investigación de Mercado</h3>
              <p className="text-gray-500 text-xs mb-3">Analiza tendencias y encuentra productos ganadores con IA.</p>
              <PillLink
                href="/chat"
                variant="indigo"
                size="xs"
                endIcon={
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-200">
                    <ArrowRight size={12} />
                  </span>
                }
              >
                Ir al Chat
              </PillLink>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-3">
                <Store size={16} />
              </div>
              <h3 className="font-semibold text-base mb-1">Mis Tiendas</h3>
              <p className="text-gray-500 text-xs mb-3">Gestiona tus tiendas online y revisa su rendimiento.</p>
              <PillLink
                href="/stores"
                variant="purple"
                size="xs"
                endIcon={
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-purple-600 shadow-sm dark:bg-purple-900/40 dark:text-purple-200">
                    <ArrowRight size={12} />
                  </span>
                }
              >
                Ver Tiendas
              </PillLink>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center mb-3">
                <ArrowRight size={16} />
              </div>
              <h3 className="font-semibold text-base mb-1">Tutoriales</h3>
              <p className="text-gray-500 text-xs mb-3">Aprende a sacar el máximo provecho de EcomIA.</p>
              <span className="text-gray-400 text-xs font-medium cursor-not-allowed">Próximamente</span>
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenido de nuevo a EcomIA</p>
            </div>
            <PillLink
              href="/chat"
              variant="indigo"
              size="sm"
              startIcon={
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white shadow-sm">
                  <MessageSquare size={14} />
                </span>
              }
              endIcon={
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white shadow-sm">
                  <ArrowRight size={14} />
                </span>
              }
              className="px-4 py-2 border-transparent text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 shadow-[0_12px_28px_-18px_rgba(99,102,241,0.9)] hover:from-indigo-500 hover:via-blue-500 hover:to-purple-500"
            >
              Nuevo Chat
            </PillLink>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tu resumen</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Desde aqui puedes iniciar un nuevo chat o entrar directo a investigacion, tiendas y tutoriales.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
