import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type LandingRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  title: string;
  slug: string | null;
  status: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type StoreRow = {
  id: string;
  name: string;
  slug: string | null;
};

function extractLandingText(content: Record<string, unknown>) {
  const raw = (content as { raw?: unknown }).raw;
  const text = (content as { text?: unknown }).text;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (typeof text === 'string' && text.trim()) {
    return text.trim();
  }
  return JSON.stringify(content || {}, null, 2);
}

function extractHighlights(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const highlights = lines
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, ''))
    .filter(Boolean);

  if (highlights.length > 0) return highlights.slice(0, 4);
  return lines.slice(0, 4);
}

export default async function PublicLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServiceClient();
  const { data: landing, error } = await supabase
    .from('landing_pages')
    .select('id, user_id, store_id, title, slug, status, content, created_at, updated_at')
    .eq('slug', params.slug)
    .maybeSingle();

  if (error || !landing) {
    notFound();
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const isOwner = Boolean(user && user.id === landing.user_id);
  const isPublished = landing.status === 'published';

  if (!isPublished && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Landing privada</p>
          <h1 className="text-2xl font-semibold">Esta landing aun no esta publicada.</h1>
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

  const content = (landing.content || {}) as Record<string, unknown>;
  const hero = (content.hero || {}) as Record<string, unknown>;
  const theme = (content.theme || {}) as Record<string, unknown>;
  const media = (content.media || {}) as Record<string, unknown>;

  const heroTitle = typeof hero.title === 'string' && hero.title.trim()
    ? hero.title.trim()
    : landing.title;
  const heroSubtitle = typeof hero.subtitle === 'string' ? hero.subtitle.trim() : '';
  const heroCta = typeof hero.cta === 'string' && hero.cta.trim()
    ? hero.cta.trim()
    : 'Comprar ahora';
  const accent = typeof theme.accent === 'string' ? theme.accent : '';
  const heroImage = typeof media.hero_image_url === 'string' ? media.hero_image_url : '';

  const landingText = extractLandingText(content);
  const highlights = extractHighlights(landingText);

  const store = landing.store_id
    ? await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('id', landing.store_id)
        .maybeSingle()
        .then(({ data }) => data as StoreRow | null)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />
      <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Preview</div>
        {store?.slug && (
          <Link
            href={`/s/${store.slug}`}
            className="text-xs font-semibold text-slate-200 hover:text-white"
          >
            Ver tienda
          </Link>
        )}
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Landing page</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="text-base text-slate-300 max-w-xl">
              {heroSubtitle || landingText.split('\n').filter(Boolean)[0] || 'Contenido listo para convertir visitas en ventas.'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-900"
                style={accent ? { backgroundColor: accent } : undefined}
              >
                {heroCta}
              </button>
              {isOwner && (
                <Link
                  href="/landing"
                  className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
                >
                  Editar landing
                </Link>
              )}
            </div>

            {heroImage && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-2">
                <div
                  className="h-56 w-full rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroImage})` }}
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(59,130,246,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contenido base</p>
              <span className="text-xs text-slate-500">{landing.status}</span>
            </div>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <p className="whitespace-pre-line leading-relaxed">{landingText}</p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <span>Actualizada: {new Date(landing.updated_at).toLocaleDateString()}</span>
              {landing.slug && <span>/{landing.slug}</span>}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
