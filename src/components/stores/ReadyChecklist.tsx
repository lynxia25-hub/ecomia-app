type ReadyChecklistProps = {
  hasStoreSlug: boolean;
  hasActiveStore: boolean;
  hasLanding: boolean;
  hasPublishedLanding: boolean;
  hasDomain: boolean;
  hasPayments: boolean;
};

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <span>{label}</span>
      <span className={`text-xs font-semibold ${done ? 'text-emerald-600' : 'text-slate-400'}`}>
        {done ? 'Listo' : 'Pendiente'}
      </span>
    </div>
  );
}

export default function ReadyChecklist({
  hasStoreSlug,
  hasActiveStore,
  hasLanding,
  hasPublishedLanding,
  hasDomain,
  hasPayments,
}: ReadyChecklistProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checklist</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Listo para vender</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          6 pasos max
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <ChecklistItem label="Definir slug publico" done={hasStoreSlug} />
        <ChecklistItem label="Activar tienda" done={hasActiveStore} />
        <ChecklistItem label="Crear landing" done={hasLanding} />
        <ChecklistItem label="Publicar landing" done={hasPublishedLanding} />
        <ChecklistItem label="Conectar dominio" done={hasDomain} />
        <ChecklistItem label="Conectar pagos" done={hasPayments} />
      </div>
    </div>
  );
}
