'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedStoreFormState } from '@/app/actions/stores';
import { updateStoreDomainFromForm, updateStoreDomainStatusFromForm, verifyStoreDomainDnsFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';

type DomainWizardProps = {
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
      className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar dominio'}
    </button>
  );
}

function VerifyButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-indigo-200"
    >
      {pending ? 'Actualizando...' : label}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default function DomainWizard({ storeId, meta }: DomainWizardProps) {
  const [state, formAction] = useActionState(updateStoreDomainFromForm, initialState);
  const [verifyState, verifyAction] = useActionState(updateStoreDomainStatusFromForm, initialState);
  const [dnsState, dnsAction] = useActionState(verifyStoreDomainDnsFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});
  const lastVerifyRef = useRef<{ ok?: boolean; error?: string }>({});
  const lastDnsRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    const domain = (meta.domain ?? {}) as Record<string, unknown>;
    return {
      name: getString(domain.name),
      mode: getString(domain.mode) || 'connect',
      provider: getString(domain.provider) || 'other',
      status: getString(domain.status),
      dnsTarget: getString(domain.dns_target) || 'storefront.ecomia.app',
      lastCheckAt: getString(domain.last_check_at),
      lastCheckOk: Boolean(domain.last_check_ok),
    };
  }, [meta]);

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Dominio guardado', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  useEffect(() => {
    if (verifyState?.error && verifyState.error !== lastVerifyRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: verifyState.error, tone: 'error' });
      lastVerifyRef.current.error = verifyState.error;
    }
    if (verifyState?.ok && !lastVerifyRef.current.ok) {
      toast({ title: 'Estado de dominio actualizado', tone: 'success' });
      lastVerifyRef.current.ok = true;
    }
  }, [verifyState, toast]);

  useEffect(() => {
    if (dnsState?.error && dnsState.error !== lastDnsRef.current.error) {
      toast({ title: 'DNS no validado', description: dnsState.error, tone: 'error' });
      lastDnsRef.current.error = dnsState.error;
    }
    if (dnsState?.ok && !lastDnsRef.current.ok) {
      toast({ title: 'DNS verificado', tone: 'success' });
      lastDnsRef.current.ok = true;
    }
  }, [dnsState, toast]);

  return (
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/60 p-6 shadow-sm dark:border-indigo-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-900/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dominio</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Conecta tu dominio en un paso</h3>
        </div>
        <div className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
          Paso 3 de 3
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={storeId} />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dominio</span>
            <input
              name="domain_name"
              defaultValue={defaults.name}
              placeholder="mitienda.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modo</span>
            <select
              name="domain_mode"
              defaultValue={defaults.mode}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="connect">Conectar dominio existente</option>
              <option value="buy">Comprar con EcomIA</option>
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proveedor DNS</span>
          <select
            name="domain_provider"
            defaultValue={defaults.provider}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="cloudflare">Cloudflare</option>
            <option value="godaddy">GoDaddy</option>
            <option value="namecheap">Namecheap</option>
            <option value="other">Otro</option>
          </select>
        </label>

        <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-xs text-slate-600 dark:border-indigo-500/20 dark:bg-slate-950/60 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-white">Siguiente paso recomendado</p>
          <p className="mt-2">
            Si conectas tu dominio, crea un registro CNAME apuntando a
            <span className="font-semibold"> {defaults.dnsTarget}</span>.
            Luego avisas y lo verificamos contigo.
          </p>
          <p className="mt-2">
            Si prefieres comprarlo con nosotros, te guiamos para elegir el nombre y lo dejamos listo.
          </p>
        </div>

        {defaults.status && (
          <div className="text-[11px] text-slate-500">
            Estado actual: <span className="font-semibold">{defaults.status}</span>
          </div>
        )}

        {state?.error && (
          <p className="text-xs text-rose-500">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Te acompanamos paso a paso, sin pasos tecnicos ocultos.
          </div>
          <SaveButton />
        </div>
      </form>

      <form action={verifyAction} className="mt-6 grid gap-3">
        <input type="hidden" name="id" value={storeId} />
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-xs text-slate-600 dark:border-indigo-500/20 dark:bg-slate-950 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-white">Confirmar conexion</p>
          <p className="mt-2">
            Cuando termines de configurar DNS, confirma aqui para marcar el dominio como
            listo y seguir con el lanzamiento.
          </p>
          {defaults.lastCheckAt && (
            <p className="mt-2 text-[11px] text-slate-500">
              Ultima verificacion: {new Date(defaults.lastCheckAt).toLocaleString()} ({defaults.lastCheckOk ? 'OK' : 'Pendiente'})
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="domain_status" value="verification_requested" />
          <VerifyButton label="Solicitar verificacion" />
        </div>
      </form>

      <form action={dnsAction} className="mt-3 flex items-center gap-3">
        <input type="hidden" name="id" value={storeId} />
        <VerifyButton label="Validar DNS ahora" />
      </form>

      <form action={verifyAction} className="mt-3 flex items-center gap-3">
        <input type="hidden" name="id" value={storeId} />
        <input type="hidden" name="domain_status" value="verified" />
        <VerifyButton label="Marcar como verificado" />
      </form>
    </div>
  );
}
