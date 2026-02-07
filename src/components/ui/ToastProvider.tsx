'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info';

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = randomId();
    const tone = input.tone || 'info';
    const durationMs = input.durationMs ?? 3500;
    const toastItem: ToastItem = { ...input, id, tone };

    setToasts((current) => [...current, toastItem]);

    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-6 top-6 z-50 flex flex-col gap-3"
        role="status"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`w-80 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              item.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : item.tone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-gray-200 bg-white text-gray-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-gray-600">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => dismiss(item.id)}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
