import type { Puter } from "@/types/puter";

export function getPuter(): Puter | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { puter?: Puter }).puter || null;
}

export async function ensureAuth(): Promise<boolean> {
  const p = getPuter();
  if (!p) return false;
  try {
    if (p.auth?.isSignedIn?.()) return true;
    await p.auth?.signIn?.();
    return true;
  } catch {
    return false;
  }
}

export async function kvSet(key: string, value: unknown): Promise<boolean> {
  const p = getPuter();
  if (!p) return false;
  try {
    await p.kv?.set?.(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const p = getPuter();
  if (!p) return null;
  try {
    return (await p.kv?.get?.(key)) as T;
  } catch {
    return null;
  }
}

export async function fsWrite(path: string, content: string | Blob): Promise<boolean> {
  const p = getPuter();
  if (!p) return false;
  try {
    await p.fs?.write?.(path, content);
    return true;
  } catch {
    return false;
  }
}

export async function fsRead(path: string): Promise<string | null> {
  const p = getPuter();
  if (!p) return null;
  try {
    const file = await p.fs?.read?.(path);
    const t = await file?.text?.();
    return t ?? null;
  } catch {
    return null;
  }
}

export async function aiChat(prompt: string, options?: Record<string, unknown>): Promise<string | null> {
  const p = getPuter();
  if (!p) return null;
  try {
    const res = await p.ai?.chat?.(prompt, options);
    return typeof res === "string" ? res : JSON.stringify(res);
  } catch {
    return null;
  }
}
