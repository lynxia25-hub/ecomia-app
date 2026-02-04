'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAuth, fsRead, fsWrite, aiChat, kvGet, kvSet } from "@/lib/puter/client";

type GenType = "titulos" | "cta" | "hashtags";
type Tone = "amistoso" | "profesional";

export default function CopyDraft() {
  const [productId, setProductId] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("amistoso");
  const [copied, setCopied] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const path = productId ? `ecomia-drafts/${productId}/copy.txt` : `ecomia-drafts/general/copy.txt`;

  const saveTone = async (t: Tone) => {
    setTone(t);
    const ok = await ensureAuth();
    if (!ok) return;
    await kvSet("ecomia_tone", t);
  };

  const save = useCallback(async () => {
    setError(null);
    setBusy(true);
    const ok = await ensureAuth();
    if (!ok) {
      setBusy(false);
      setError("Activa recursos del usuario");
      return;
    }
    const s = await fsWrite(path, text);
    if (!s) setError("No se pudo guardar");
    setBusy(false);
  }, [path, text]);

  const saveVersion = async () => {
    setError(null);
    setBusy(true);
    const ok = await ensureAuth();
    if (!ok) {
      setBusy(false);
      setError("Activa recursos del usuario");
      return;
    }
    const baseDir = productId ? `ecomia-drafts/${productId}` : `ecomia-drafts/general`;
    const p = `${baseDir}/copy-${Date.now()}.txt`;
    const s = await fsWrite(p, text);
    if (!s) setError("No se pudo guardar versión");
    setBusy(false);
  };

  const load = async () => {
    setError(null);
    setBusy(true);
    const ok = await ensureAuth();
    if (!ok) {
      setBusy(false);
      setError("Activa recursos del usuario");
      return;
    }
    const t = await fsRead(path);
    if (t) setText(t);
    else setError("No se encontró borrador");
    setBusy(false);
  };

  const clear = () => {
    setText("");
  };

  const copyToClipboard = async () => {
    setCopied(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("No se pudo copiar");
    }
  };

  const generate = async (type: GenType) => {
    setError(null);
    setBusy(true);
    const ok = await ensureAuth();
    if (!ok) {
      setBusy(false);
      setError("Activa recursos del usuario");
      return;
    }
    const context = productId ? `para el producto ${productId}` : "para un producto";
    const tono = tone === "profesional" ? "tono profesional" : "tono amistoso y cercano";
    let prompt = "";
    if (type === "titulos") {
      prompt = `Genera 5 títulos atractivos ${context}, ${tono}, español, 60-80 caracteres, lista simple.`;
    } else if (type === "cta") {
      prompt = `Genera 5 CTA claras ${context}, ${tono}, enfoque en compra ahora y envío rápido, lista simple.`;
    } else {
      prompt = `Genera 10 hashtags relevantes ${context}, ${tono}, en español, separados por espacios.`;
    }
    const res = await aiChat(prompt, { model: "gpt-4o-mini" });
    if (!res) setError("No se pudo generar contenido");
    else setText((prev) => (prev ? `${prev}\n\n${res}` : res));
    setBusy(false);
  };

  useEffect(() => {
    (async () => {
      const ok = await ensureAuth();
      if (!ok) return;
      const saved = await kvGet<Tone>("ecomia_tone");
      if (saved === "profesional" || saved === "amistoso") {
        setTimeout(() => setTone(saved), 0);
      }
    })();
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!text) return;
    timer.current = setTimeout(() => {
      save();
    }, 2000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, productId, save]);

  return (
    <div className="p-4 border rounded-xl mb-4 max-w-2xl mx-auto">
      <div className="mb-2 font-medium">Borrador de copy</div>
      <div className="flex gap-2 mb-2">
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="ID o slug de producto (opcional)"
          className="flex-1 rounded-full px-4 py-2 border"
        />
      </div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => saveTone("amistoso")}
          className={`rounded-full px-4 py-2 border ${tone === "amistoso" ? "bg-zinc-100" : ""}`}
        >
          Tono amistoso
        </button>
        <button
          onClick={() => saveTone("profesional")}
          className={`rounded-full px-4 py-2 border ${tone === "profesional" ? "bg-zinc-800 text-white" : ""}`}
        >
          Tono profesional
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe o pega tu copy aquí"
        className="w-full h-40 rounded-xl p-3 border"
      />
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={save} disabled={busy} className="rounded-full bg-blue-600 text-white px-4 py-2">
          Guardar
        </button>
        <button onClick={saveVersion} disabled={busy} className="rounded-full bg-blue-800 text-white px-4 py-2">
          Guardar versión
        </button>
        <button onClick={load} disabled={busy} className="rounded-full border px-4 py-2">
          Cargar
        </button>
        <button onClick={clear} disabled={busy} className="rounded-full border px-4 py-2">
          Limpiar
        </button>
        <button onClick={copyToClipboard} disabled={busy} className="rounded-full border px-4 py-2">
          Copiar
        </button>
        <button onClick={() => generate("titulos")} disabled={busy} className="rounded-full bg-zinc-800 text-white px-4 py-2">
          Generar títulos
        </button>
        <button onClick={() => generate("cta")} disabled={busy} className="rounded-full bg-zinc-800 text-white px-4 py-2">
          Generar CTA
        </button>
        <button onClick={() => generate("hashtags")} disabled={busy} className="rounded-full bg-zinc-800 text-white px-4 py-2">
          Generar hashtags
        </button>
      </div>
      {copied && <div className="text-sm text-green-600 mt-2">Copiado</div>}
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </div>
  );
}
