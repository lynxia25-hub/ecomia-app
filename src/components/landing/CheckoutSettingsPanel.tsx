'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedLandingFormState } from '@/app/actions/landing-pages';
import { updateLandingCheckoutFromForm } from '@/app/actions/landing-pages';
import { useToast } from '@/components/ui/ToastProvider';

type CheckoutSettingsPanelProps = {
  landingId: string;
  content: Record<string, unknown>;
};

const initialState: GuidedLandingFormState = { ok: false, error: undefined };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
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

export default function CheckoutSettingsPanel({ landingId, content }: CheckoutSettingsPanelProps) {
  const [state, formAction] = useActionState(updateLandingCheckoutFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    const product = (content.product ?? {}) as Record<string, unknown>;
    const checkout = (content.checkout ?? {}) as Record<string, unknown>;
    return {
      enabled: Boolean(checkout.enabled),
      price: getNumber(checkout.price_cop) ?? null,
      productName: getString(checkout.product_name) || getString(product.name),
      source: getString(checkout.source) || getString(product.source) || 'research',
    };
  }, [content]);

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
    <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 shadow-sm dark:border-emerald-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-900/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checkout</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Activa el pago en esta landing</h3>
        </div>
        <div className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          Paso opcional
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={landingId} />

        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="checkout_enabled"
            defaultChecked={defaults.enabled}
            className="h-4 w-4 rounded border-slate-300 text-emerald-500"
          />
          Activar checkout MercadoPago en esta landing
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</span>
            <input
              name="checkout_product"
              defaultValue={defaults.productName}
              placeholder="Nombre del producto"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Precio (COP)</span>
            <input
              name="checkout_price"
              defaultValue={defaults.price ?? ''}
              placeholder="99000"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origen del producto</span>
          <select
            name="checkout_source"
            defaultValue={defaults.source}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="research">Investigacion (producto recomendado)</option>
            <option value="manual">Manual</option>
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
