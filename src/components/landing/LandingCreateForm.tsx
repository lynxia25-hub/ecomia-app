'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { LandingFormState } from '@/app/actions/landing-pages';
import { createLandingFromForm } from '@/app/actions/landing-pages';
import { useToast } from '@/components/ui/ToastProvider';

type LandingCreateFormProps = {
  stores: Array<{ id: string; name: string }>;
};

const initialState: LandingFormState = { ok: false, error: undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? 'Creando...' : 'Crear landing'}
    </button>
  );
}

export default function LandingCreateForm({ stores }: LandingCreateFormProps) {
  const [state, formAction] = useActionState(createLandingFromForm, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo crear la landing', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Landing creada', tone: 'success' });
      lastRef.current.ok = true;
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form
      action={formAction}
      ref={formRef}
      className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Titulo</span>
          <input
            name="title"
            placeholder="Landing para Botella Termica"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</span>
          <select
            name="status"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2"
            defaultValue="draft"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Slug (opcional)</span>
          <input
            name="slug"
            placeholder="botella-termica"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2"
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Store (opcional)</span>
          <select
            name="store_id"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2"
            defaultValue=""
          >
            <option value="">Sin tienda</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
