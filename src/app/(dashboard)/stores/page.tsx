import { listStores } from '@/app/actions/stores';
import StoreCreateForm from '@/components/stores/StoreCreateForm';
import StoreCard from '@/components/stores/StoreCard';

export default async function StoresPage() {
  const result = await listStores();
  const stores = 'stores' in result ? result.stores : [];

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mis Tiendas</h1>
        <p className="text-sm text-gray-500">Crea y administra tus tiendas.</p>
      </div>

      <StoreCreateForm />

      <div className="space-y-4">
        {stores.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">No tienes tiendas creadas aun.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
