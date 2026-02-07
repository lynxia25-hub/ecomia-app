'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedStoreFormState } from '@/app/actions/stores';
import { updateStoreCheckoutFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';

type CheckoutSettingsPanelProps = {
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
      {pending ? 'Guardando...' : 'Guardar checkout'}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export default function CheckoutSettingsPanel({ storeId, meta }: CheckoutSettingsPanelProps) {
  const [state, formAction] = useActionState(updateStoreCheckoutFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    const checkout = (meta.checkout ?? {}) as Record<string, unknown>;
    return {
      enabled: Boolean(checkout.enabled),
      price: getNumber(checkout.price_cop) ?? null,
      productName: getString(checkout.product_name),
      source: getString(checkout.source) || 'manual',
    };
  }, [meta]);

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Checkout actualizado', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-100/60 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checkout</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Activa el pago en tu tienda</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Paso opcional
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={storeId} />

        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="checkout_enabled"
            defaultChecked={defaults.enabled}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
          />
          Activar checkout MercadoPago en esta tienda
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</span>
            <input
              name="checkout_product"
              defaultValue={defaults.productName}
              placeholder="Nombre del producto"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Precio (COP)</span>
            <input
              name="checkout_price"
              defaultValue={defaults.price ?? ''}
              placeholder="99000"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origen del producto</span>
          <select
            name="checkout_source"
            defaultValue={defaults.source}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="manual">Manual</option>
            <option value="research">Investigacion (producto recomendado)</option>
          </select>
        </label>

        {state?.error && (
          <p className="text-xs text-rose-500">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            El checkout usara MercadoPago Checkout Pro y redireccionara al pago.
          </div>
          <SaveButton />
        </div>
      </form>
    </div>
  );
}
