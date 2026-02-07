'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { StoreFormState } from '@/app/actions/stores';
import { createStoreFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';

const initialState: StoreFormState = { ok: false, error: undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? 'Creando...' : 'Crear tienda'}
    </button>
  );
}

export default function StoreCreateForm() {
  const [state, formAction] = useActionState(createStoreFromForm, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo crear la tienda', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Tienda creada', tone: 'success' });
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nombre</span>
          <input
            name="name"
            placeholder="Tienda Natura"
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
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Slug (opcional)</span>
          <input
            name="slug"
            placeholder="tienda-natura"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2"
          />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
