'use client';

import { useState } from 'react';

type MercadoPagoCheckoutButtonProps = {
  landingId?: string;
  storeId?: string;
  label?: string;
  className?: string;
};

export default function MercadoPagoCheckoutButton({ landingId, storeId, label, className }: MercadoPagoCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingId, storeId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo iniciar el pago.');
      }

      if (payload?.init_point) {
        window.location.href = payload.init_point as string;
        return;
      }

      throw new Error('No se recibio el link de pago.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={className || 'rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-900'}
      >
        {loading ? 'Redirigiendo...' : (label || 'Comprar ahora')}
      </button>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
