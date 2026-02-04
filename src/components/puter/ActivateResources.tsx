'use client';

import { useState } from "react";
import { ensureAuth, getPuter } from "@/lib/puter/client";

export default function ActivateResources() {
  const [status, setStatus] = useState<"idle" | "activating" | "active" | "error">("idle");

  const onActivate = async () => {
    setStatus("activating");
    const ok = await ensureAuth();
    setStatus(ok ? "active" : "error");
  };

  const available = !!getPuter();

  return (
    <div className="p-4 border rounded-xl mb-4">
      <div className="mb-2">
        <span className="font-medium">Recursos del usuario (Puter)</span>
      </div>
      {!available && <p className="text-sm text-zinc-600">Cargando SDK…</p>}
      {available && status !== "active" && (
        <button
          onClick={onActivate}
          disabled={status === "activating"}
          className="rounded-full bg-blue-600 text-white px-6 py-2"
        >
          {status === "activating" ? "Activando…" : "Activar"}
        </button>
      )}
      {status === "active" && <p className="text-sm text-green-600">Activado</p>}
      {status === "error" && <p className="text-sm text-red-600">Error al activar</p>}
    </div>
  );
}
