import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GuidedLandingEditor from '@/components/landing/GuidedLandingEditor';
import CheckoutSettingsPanel from '@/components/landing/CheckoutSettingsPanel';
import PublishLandingPanel from '@/components/landing/PublishLandingPanel';
import PillLink from '@/components/ui/PillLink';

export default async function LandingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: landing, error } = await supabase
    .from('landing_pages')
    .select('id, title, slug, status, content, store_id, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !landing) {
    notFound();
  }

  const { data: store } = landing.store_id
    ? await supabase
        .from('stores')
        .select('id, name')
        .eq('id', landing.store_id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{landing.title}</h1>
          <p className="text-sm text-gray-500">Slug: {landing.slug || 'Sin slug'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {landing.slug && (
            <PillLink href={`/l/${landing.slug}`} variant="indigo" size="sm">
              Vista publica
            </PillLink>
          )}
          <PillLink href="/landing" variant="neutral" size="sm">
            Volver a landing pages
          </PillLink>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{landing.status}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Creada</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {new Date(landing.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Actualizada</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {new Date(landing.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Store</h2>
        {store ? (
          <PillLink href={`/stores/${store.id}`} variant="neutral" size="sm">
            {store.name}
          </PillLink>
        ) : (
          <p className="text-sm text-gray-500">Sin tienda asociada.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contenido</h2>
        <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
{JSON.stringify(landing.content || {}, null, 2)}
        </pre>
      </div>

      <PublishLandingPanel
        landingId={landing.id}
        title={landing.title}
        status={landing.status}
        content={landing.content || {}}
      />

      <CheckoutSettingsPanel landingId={landing.id} content={landing.content || {}} />

      <GuidedLandingEditor landingId={landing.id} content={landing.content || {}} />
    </div>
  );
}
