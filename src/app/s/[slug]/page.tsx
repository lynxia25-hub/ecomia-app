import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import MercadoPagoCheckoutButton from '@/components/payments/MercadoPagoCheckoutButton';

type StoreRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type LandingRow = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  created_at: string;
};

function extractStoreTagline(meta: Record<string, unknown>) {
  const tagline = (meta as { tagline?: unknown }).tagline;
  const description = (meta as { description?: unknown }).description;
  if (typeof tagline === 'string' && tagline.trim()) {
    return tagline.trim();
  }
  if (typeof description === 'string' && description.trim()) {
    return description.trim();
  }
  return 'Una tienda lista para convertir visitas en ventas.';
}

export default async function PublicStorePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServiceClient();
  const { data: store, error } = await supabase
    .from('stores')
    .select('id, user_id, name, slug, status, meta, created_at, updated_at')
    .eq('slug', params.slug)
    .maybeSingle();

  if (error || !store) {
    notFound();
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const isOwner = Boolean(user && user.id === store.user_id);
  const isPublished = store.status === 'active';

  if (!isPublished && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Tienda privada</p>
          <h1 className="text-2xl font-semibold">Esta tienda aun no esta activa.</h1>
          <p className="text-sm text-slate-400">
            Si eres el propietario, inicia sesion para verla en modo preview.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Iniciar sesion
          </Link>
        </div>
      </div>
    );
  }

  const { data: landingsData } = await supabase
    .from('landing_pages')
    .select('id, title, slug, status, created_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false });

  const landings = (landingsData || []).filter((landing: LandingRow) => {
    if (isOwner) return true;
    return landing.status === 'published';
  });

  const supportWhatsapp = typeof store.meta?.support_whatsapp === 'string'
    ? store.meta.support_whatsapp
    : '';
  const shippingNote = typeof store.meta?.shipping_note === 'string'
    ? store.meta.shipping_note
    : '';
  const checkout = (store.meta?.checkout || {}) as Record<string, unknown>;
  const checkoutEnabled = Boolean(checkout.enabled);
  const checkoutPrice = typeof checkout.price_cop === 'number' ? checkout.price_cop : 0;
  const hasCheckout = checkoutEnabled && checkoutPrice > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
      <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Storefront</div>
        <div className="flex items-center gap-3">
          {isOwner && (
            <Link
              href="/stores"
              className="text-xs font-semibold text-slate-200 hover:text-white"
            >
              Editar tienda
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        {!isPublished && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Vista previa (solo tu la ves)
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tienda</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              {store.name}
            </h1>
            <p className="text-base text-slate-300 max-w-xl">
              {extractStoreTagline(store.meta || {})}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {hasCheckout ? (
                <MercadoPagoCheckoutButton
                  storeId={store.id}
                  label="Comprar ahora"
                  className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-900"
                />
              ) : (
                <button className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-900">
                  Ver catalogo
                </button>
              )}
              {isOwner && (
                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
                >
                  Ajustar configuracion
                </Link>
              )}
            </div>
            {(supportWhatsapp || shippingNote) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {supportWhatsapp && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
                    Soporte WhatsApp: {supportWhatsapp}
                  </div>
                )}
                {shippingNote && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
                    {shippingNote}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Landings publicas</p>
              <span className="text-xs text-slate-500">{store.status}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {landings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-400">
                  Aun no hay landings publicadas.
                </div>
              ) : (
                landings.map((landing) => (
                  <Link
                    key={landing.id}
                    href={landing.slug ? `/l/${landing.slug}` : '#'}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 hover:border-emerald-400/60"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{landing.title}</p>
                      <span className="text-xs text-slate-500">{landing.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">{landing.slug || 'Sin slug'}</p>
                  </Link>
                ))
              )}
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <span>Actualizada: {new Date(store.updated_at).toLocaleDateString()}</span>
              {store.slug && <span>/{store.slug}</span>}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
