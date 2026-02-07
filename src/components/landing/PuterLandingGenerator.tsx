'use client';

import { useState } from 'react';
import { ensureAuth, aiChat, fsWrite, getPuter } from '@/lib/puter/client';

export default function PuterLandingGenerator() {
  const [product, setProduct] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setUrl(null);
    setBusy(true);
    const ok = await ensureAuth();
    if (!ok) {
      setError('Activa recursos del usuario');
      setBusy(false);
      return;
    }
    const prompt =
      `Crea HTML simple de una landing para ${product} con titulo, beneficios y CTA. Usa estilo basico y espanol coloquial.`;
    const html = await aiChat(prompt, { model: 'gpt-4o-mini' });
    if (!html) {
      setError('No se pudo generar contenido');
      setBusy(false);
      return;
    }
    const dir = `ecomia-landing-${Math.random().toString(36).slice(2, 8)}`;
    const okWrite = await fsWrite(`${dir}/index.html`, html);
    if (!okWrite) {
      setError('Error escribiendo archivo');
      setBusy(false);
      return;
    }
    try {
      const p = getPuter();
      if (!p || !p.hosting) {
        setError('SDK no disponible');
      } else {
        const sub = `ecomia-${Math.random().toString(36).slice(2, 8)}`;
        const site = await p.hosting.create(sub, dir);
        setUrl(`https://${site.subdomain}.puter.site`);
      }
    } catch {
      setError('Error publicando sitio');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Generador de Landing (Puter)</h2>
        <p className="text-sm text-zinc-600">Piloto con recursos del usuario en Puter.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="Producto (ej: Botella termica)"
          className="flex-1 rounded-full px-4 py-2 border"
        />
        <button
          onClick={generate}
          disabled={busy || !product}
          className="rounded-full bg-blue-600 text-white px-6 py-2"
        >
          {busy ? 'Generando…' : 'Generar'}
        </button>
      </div>
      {url && (
        <div className="text-green-700">
          Sitio publicado:{' '}
          <a className="underline" href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        </div>
      )}
      {error && <div className="text-red-700">{error}</div>}
    </div>
  );
}
