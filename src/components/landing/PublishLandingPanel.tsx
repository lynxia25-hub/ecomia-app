'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedLandingFormState } from '@/app/actions/landing-pages';
import { publishLandingFromForm } from '@/app/actions/landing-pages';
import { useToast } from '@/components/ui/ToastProvider';

type PublishLandingPanelProps = {
  landingId: string;
  title: string;
  status: string;
  content: Record<string, unknown>;
};

const initialState: GuidedLandingFormState = { ok: false, error: undefined };

function PublishButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Publicando...' : label}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default function PublishLandingPanel({ landingId, title, status, content }: PublishLandingPanelProps) {
  const [state, formAction] = useActionState(publishLandingFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    const seo = (content.seo ?? {}) as Record<string, unknown>;
    const legal = (content.legal ?? {}) as Record<string, unknown>;
    return {
      seoTitle: getString(seo.title) || title,
      seoDescription: getString(seo.description),
      legalBusiness: getString(legal.business_name),
      legalEmail: getString(legal.contact_email),
      legalTermsUrl: getString(legal.terms_url),
      legalPrivacyUrl: getString(legal.privacy_url),
      legalRefundUrl: getString(legal.refund_url),
    };
  }, [content, title]);

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo publicar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Landing publicada', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  return (
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/60 p-6 shadow-sm dark:border-indigo-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-900/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Publicacion</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Publica con 1 click</h3>
        </div>
        <div className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
          Estado: {status}
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={landingId} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">SEO titulo</span>
            <input
              name="seo_title"
              defaultValue={defaults.seoTitle}
              placeholder="Titulo SEO"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">SEO descripcion</span>
            <input
              name="seo_description"
              defaultValue={defaults.seoDescription}
              placeholder="Descripcion corta (150-160 caracteres)"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre legal</span>
            <input
              name="legal_business"
              defaultValue={defaults.legalBusiness}
              placeholder="EcomIA Online"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email legal</span>
            <input
              name="legal_email"
              defaultValue={defaults.legalEmail}
              placeholder="legal@tudominio.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">URL terminos</span>
            <input
              name="legal_terms_url"
              defaultValue={defaults.legalTermsUrl}
              placeholder="https://tudominio.com/terminos"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">URL privacidad</span>
            <input
              name="legal_privacy_url"
              defaultValue={defaults.legalPrivacyUrl}
              placeholder="https://tudominio.com/privacidad"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">URL devoluciones</span>
            <input
              name="legal_refund_url"
              defaultValue={defaults.legalRefundUrl}
              placeholder="https://tudominio.com/devoluciones"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        {state?.error && (
          <p className="text-xs text-rose-500">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Publicar activa el estado y guarda un aviso legal basico.
          </div>
          <PublishButton label="Publicar ahora" />
        </div>
      </form>
    </div>
  );
}
