'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedStoreFormState } from '@/app/actions/stores';
import { updateStorePaymentsFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';

type PaymentsWizardProps = {
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
      className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar pagos'}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default function PaymentsWizard({ storeId, meta }: PaymentsWizardProps) {
  const [state, formAction] = useActionState(updateStorePaymentsFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    const payments = (meta.payments ?? {}) as Record<string, unknown>;
    return {
      provider: getString(payments.provider) || 'mercadopago',
      status: getString(payments.status) || 'pending',
      email: getString(payments.account_email),
    };
  }, [meta]);

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Pagos guardados', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  return (
    <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/60 p-6 shadow-sm dark:border-amber-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-amber-900/10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pagos</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Conecta tu pasarela</h3>
        </div>
        <div className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Paso 4 de 4
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={storeId} />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proveedor</span>
            <select
              name="payment_provider"
              defaultValue={defaults.provider}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="mercadopago">MercadoPago</option>
              <option value="stripe">Stripe</option>
              <option value="payu">PayU</option>
              <option value="manual">Manual (transferencia)</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</span>
            <select
              name="payment_status"
              defaultValue={defaults.status}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="pending">Pendiente</option>
              <option value="active">Activo</option>
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email de la cuenta</span>
          <input
            name="payment_email"
            defaultValue={defaults.email}
            placeholder="pagos@mitienda.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 p-4 text-xs text-slate-600 dark:border-amber-500/20 dark:bg-slate-950/60 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-white">Checklist rapido</p>
          <p className="mt-2">1) Crea tu cuenta en la pasarela.</p>
          <p>2) Comparte el email o ID de la cuenta.</p>
          <p>3) Cuando este activo, marca el estado como "Activo".</p>
        </div>

        {state?.error && (
          <p className="text-xs text-rose-500">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Nosotros te guiamos para dejar los cobros listos.
          </div>
          <SaveButton />
        </div>
      </form>
    </div>
  );
}
