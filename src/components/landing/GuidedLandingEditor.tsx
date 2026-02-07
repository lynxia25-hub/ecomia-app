'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { GuidedLandingFormState } from '@/app/actions/landing-pages';
import { updateLandingGuidedFromForm } from '@/app/actions/landing-pages';
import { useToast } from '@/components/ui/ToastProvider';

type GuidedLandingEditorProps = {
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
      className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar cambios'}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default function GuidedLandingEditor({ landingId, content }: GuidedLandingEditorProps) {
  const [state, formAction] = useActionState(updateLandingGuidedFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  const defaults = useMemo(() => {
    const hero = (content?.hero ?? {}) as Record<string, unknown>;
    const theme = (content?.theme ?? {}) as Record<string, unknown>;
    const media = (content?.media ?? {}) as Record<string, unknown>;
    return {
      heroTitle: getString(hero.title),
      heroSubtitle: getString(hero.subtitle),
      heroCta: getString(hero.cta),
      accentColor: getString(theme.accent),
      heroImage: getString(media.hero_image_url),
    };
  }, [content]);

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Landing actualizada', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-900/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Editor guiado</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Personaliza la landing en 2 minutos</h3>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          Paso 1 de 3
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={landingId} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Titulo principal</span>
            <input
              name="hero_title"
              defaultValue={defaults.heroTitle}
              placeholder="Transforma tu rutina con la Botella Termica"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtitulo</span>
            <input
              name="hero_subtitle"
              defaultValue={defaults.heroSubtitle}
              placeholder="Mantiene tu bebida fria por 24 horas."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">CTA principal</span>
            <input
              name="hero_cta"
              defaultValue={defaults.heroCta}
              placeholder="Comprar ahora"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Color principal</span>
            <input
              name="accent_color"
              defaultValue={defaults.accentColor}
              placeholder="#10b981"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Imagen principal (URL)</span>
          <input
            name="hero_image_url"
            defaultValue={defaults.heroImage}
            placeholder="https://tusitio.com/hero.jpg"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-300 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        {state?.error && (
          <p className="text-xs text-rose-500">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Consejo: menos es mas. Usa un titulo claro, un beneficio y un CTA directo.
          </div>
          <SaveButton />
        </div>
      </form>
    </div>
  );
}
