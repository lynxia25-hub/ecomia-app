import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DomainWizard from '@/components/stores/DomainWizard';
import CheckoutSettingsPanel from '@/components/stores/CheckoutSettingsPanel';
import GuidedStoreEditor from '@/components/stores/GuidedStoreEditor';
import PaymentsWizard from '@/components/stores/PaymentsWizard';
import ReadyChecklist from '@/components/stores/ReadyChecklist';
import PillLink from '@/components/ui/PillLink';

export default async function StoreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: store, error } = await supabase
    .from('stores')
    .select('id, name, slug, status, meta, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !store) {
    notFound();
  }

  const { data: landingPages, error: landingError } = await supabase
    .from('landing_pages')
    .select('id, title, slug, status, created_at')
    .eq('store_id', store.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const meta = (store.meta || {}) as Record<string, unknown>;
  const domain = (meta.domain || {}) as Record<string, unknown>;
  const payments = (meta.payments || {}) as Record<string, unknown>;
  const domainStatus = typeof domain.status === 'string' ? domain.status : '';
  const paymentsStatus = typeof payments.status === 'string' ? payments.status : '';

  const hasStoreSlug = Boolean(store.slug);
  const hasActiveStore = store.status === 'active';
  const hasLanding = Boolean(landingPages && landingPages.length > 0);
  const hasPublishedLanding = Boolean(landingPages?.some((landing) => landing.status === 'published'));
  const hasDomain = Boolean(domain.name) && (domainStatus === 'verified' || domainStatus === 'needs_purchase');
  const hasPayments = paymentsStatus === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
          <p className="text-sm text-gray-500">Slug: {store.slug || 'Sin slug'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {store.slug && (
            <PillLink href={`/s/${store.slug}`} variant="indigo" size="sm">
              Vista publica
            </PillLink>
          )}
          <PillLink href="/stores" variant="neutral" size="sm">
            Volver a tiendas
          </PillLink>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{store.status}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Creada</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {new Date(store.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Actualizada</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {new Date(store.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meta</h2>
        <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
{JSON.stringify(store.meta || {}, null, 2)}
        </pre>
      </div>

      <ReadyChecklist
        hasStoreSlug={hasStoreSlug}
        hasActiveStore={hasActiveStore}
        hasLanding={hasLanding}
        hasPublishedLanding={hasPublishedLanding}
        hasDomain={hasDomain}
        hasPayments={hasPayments}
      />

      <GuidedStoreEditor storeId={store.id} meta={meta} />

      <CheckoutSettingsPanel storeId={store.id} meta={meta} />

      <DomainWizard storeId={store.id} meta={meta} />

      <PaymentsWizard storeId={store.id} meta={meta} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Landing pages</h2>
        {landingError || !landingPages || landingPages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-500">
            No hay landing pages asociadas.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {landingPages.map((landing) => (
              <Link
                key={landing.id}
                href={`/landing/${landing.id}`}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-indigo-300"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{landing.title}</p>
                <p className="text-xs text-gray-500">{landing.slug || 'Sin slug'}</p>
                <p className="text-xs text-gray-500">Status: {landing.status}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
