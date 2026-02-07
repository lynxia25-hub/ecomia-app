import { listLandingPages } from '@/app/actions/landing-pages';
import { listStores } from '@/app/actions/stores';
import LandingCard from '@/components/landing/LandingCard';
import LandingCreateForm from '@/components/landing/LandingCreateForm';
import PuterLandingGenerator from '@/components/landing/PuterLandingGenerator';

export default async function LandingGeneratorPage() {
  const result = await listLandingPages();
  const landingPages = 'landingPages' in result ? result.landingPages : [];
  const storeResult = await listStores();
  const storeRows = 'stores' in storeResult ? (storeResult.stores || []) : [];
  const stores = storeRows.map((store) => ({
    id: store.id,
    name: store.name,
  }));

  return (
    <div className="min-h-screen p-6 space-y-10">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-sm text-gray-500">Crea y administra tus landing pages.</p>
        </div>

        <LandingCreateForm stores={stores} />

        {landingPages.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">No tienes landing pages creadas aun.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {landingPages.map((landing) => (
              <LandingCard key={landing.id} landing={landing} stores={stores} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl">
        <PuterLandingGenerator />
      </div>
    </div>
  );
}
