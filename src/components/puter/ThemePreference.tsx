'use client';

import { useEffect, useState } from "react";
import { ensureAuth, kvGet, kvSet } from "@/lib/puter/client";

type Theme = "light" | "dark";

export default function ThemePreference() {
  const [theme, setTheme] = useState<Theme>("light");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apply = (t: Theme) => {
      const el = document.documentElement;
      if (t === "dark") el.classList.add("dark");
      else el.classList.remove("dark");
    };
    (async () => {
      setError(null);
      setLoading(true);
      const ok = await ensureAuth();
      if (!ok) {
        setLoading(false);
        return;
      }
      const saved = await kvGet<Theme>("ecomia_theme");
      const t = saved === "dark" ? "dark" : "light";
      setTheme(t);
      apply(t);
      setLoading(false);
    })();
  }, []);

  const setThemePref = async (t: Theme) => {
    setError(null);
    setLoading(true);
    const ok = await ensureAuth();
    if (!ok) {
      setLoading(false);
      setError("Activa recursos del usuario");
      return;
    }
    const success = await kvSet("ecomia_theme", t);
    if (!success) setError("No se pudo guardar la preferencia");
    setTheme(t);
    const el = document.documentElement;
    if (t === "dark") el.classList.add("dark");
    else el.classList.remove("dark");
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-xl mt-6">
      <div className="mb-2 font-medium">Preferencia de tema</div>
      <div className="flex gap-2">
        <button
          onClick={() => setThemePref("light")}
          disabled={loading}
          className={`rounded-full px-4 py-2 border ${theme === "light" ? "bg-zinc-100" : ""}`}
        >
          Claro
        </button>
        <button
          onClick={() => setThemePref("dark")}
          disabled={loading}
          className={`rounded-full px-4 py-2 border ${theme === "dark" ? "bg-zinc-800 text-white" : ""}`}
        >
          Oscuro
        </button>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </div>
  );
}
