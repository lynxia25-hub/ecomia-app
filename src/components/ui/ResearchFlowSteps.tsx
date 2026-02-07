const steps = [
  'Definir objetivo y nicho',
  'Investigar mercado y demanda',
  'Proponer 3 productos ganadores',
  'Buscar proveedores confiables',
  'Elegir producto final',
  'Generar assets y copys',
  'Crear tienda o landing',
];

export default function ResearchFlowSteps() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">Flujo guiado</p>
      <ol className="mt-2 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
