'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedStoreFormState } from '@/app/actions/stores';
import { updateStoreGuidedFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';

type GuidedStoreEditorProps = {
  storeId: string;
  meta: Record<string, unknown>;
};

const initialState: GuidedStoreFormState = { ok: false, error: undefined };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar informacion'}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default function GuidedStoreEditor({ storeId, meta }: GuidedStoreEditorProps) {
  const [state, formAction] = useActionState(updateStoreGuidedFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    return {
      tagline: getString(meta.tagline),
      whatsapp: getString(meta.support_whatsapp),
      shipping: getString(meta.shipping_note),
    };
  }, [meta]);

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Informacion actualizada', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-100/60 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Base de la tienda</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Define la promesa principal</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Paso 2 de 3
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={storeId} />

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Promesa corta</span>
          <input
            name="tagline"
            defaultValue={defaults.tagline}
            placeholder="Envios rapidos y productos premium"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp de soporte</span>
            <input
              name="support_whatsapp"
              defaultValue={defaults.whatsapp}
              placeholder="+57 300 123 4567"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota de envio</span>
            <input
              name="shipping_note"
              defaultValue={defaults.shipping}
              placeholder="Entrega en 24-48 horas en ciudades principales"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        {state?.error && (
          <p className="text-xs text-rose-500">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Esto se vera en la tienda publica y en el checkout.
          </div>
          <SaveButton />
        </div>
      </form>
    </div>
  );
}
