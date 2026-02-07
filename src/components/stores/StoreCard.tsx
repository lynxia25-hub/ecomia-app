'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { StoreFormState } from '@/app/actions/stores';
import { deleteStoreFromForm, updateStoreFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';
import PillLink from '@/components/ui/PillLink';

type StoreCardProps = {
  store: {
    id: string;
    name: string;
    slug: string | null;
    status: string;
    created_at: string;
  };
};

const initialState: StoreFormState = { ok: false, error: undefined };

function UpdateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar'}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
    >
      {pending ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}

export default function StoreCard({ store }: StoreCardProps) {
  const [updateState, updateAction] = useActionState(updateStoreFromForm, initialState);
  const [deleteState, deleteAction] = useActionState(deleteStoreFromForm, initialState);
  const { toast } = useToast();
  const lastUpdateRef = useRef<{ ok?: boolean; error?: string }>({});
  const lastDeleteRef = useRef<{ ok?: boolean; error?: string }>({});

  useEffect(() => {
    if (updateState?.error && updateState.error !== lastUpdateRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: updateState.error, tone: 'error' });
      lastUpdateRef.current.error = updateState.error;
    }
    if (updateState?.ok && !lastUpdateRef.current.ok) {
      toast({ title: 'Tienda actualizada', tone: 'success' });
      lastUpdateRef.current.ok = true;
    }
  }, [toast, updateState]);

  useEffect(() => {
    if (deleteState?.error && deleteState.error !== lastDeleteRef.current.error) {
      toast({ title: 'No se pudo eliminar', description: deleteState.error, tone: 'error' });
      lastDeleteRef.current.error = deleteState.error;
    }
    if (deleteState?.ok && !lastDeleteRef.current.ok) {
      toast({ title: 'Tienda eliminada', tone: 'success' });
      lastDeleteRef.current.ok = true;
    }
  }, [toast, deleteState]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{store.name}</h3>
        <p className="text-xs text-gray-500">{store.slug || 'Sin slug'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1">{store.status}</span>
        <span>Creada: {new Date(store.created_at).toLocaleDateString()}</span>
        <PillLink href={`/stores/${store.id}`} variant="indigo" size="xs">
          Ver detalle
        </PillLink>
        {store.slug && (
          <PillLink href={`/s/${store.slug}`} variant="neutral" size="xs">
            Vista publica
          </PillLink>
        )}
      </div>
      <form action={updateAction} className="grid gap-3 md:grid-cols-3">
        <input type="hidden" name="id" value={store.id} />
        <input
          name="name"
          defaultValue={store.name}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
        />
        <input
          name="slug"
          defaultValue={store.slug || ''}
          placeholder="slug"
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={store.status}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <UpdateButton />
        </div>
        {updateState?.error && (
          <p className="md:col-span-3 text-xs text-red-600">{updateState.error}</p>
        )}
      </form>
      <form action={deleteAction} className="flex items-center justify-between">
        <input type="hidden" name="id" value={store.id} />
        {deleteState?.error && <p className="text-xs text-red-600">{deleteState.error}</p>}
        <DeleteButton />
      </form>
    </div>
  );
}
