import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Payload = {
  to?: string;
  storeId?: string;
  amount?: number;
  currency?: string;
  productName?: string;
  orderId?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Admin EcomIA <admin@ecom-ia.online>';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const to = typeof payload.to === 'string' ? payload.to.trim() : '';
  if (!to || !isEmail(to)) {
    return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
  }

  const amount = typeof payload.amount === 'number' ? payload.amount : null;
  const currency = typeof payload.currency === 'string' ? payload.currency : 'COP';
  const productName = typeof payload.productName === 'string' ? payload.productName : 'Producto';
  const orderId = typeof payload.orderId === 'string' ? payload.orderId : '';

  const subject = 'Pago recibido (pendiente de confirmacion)';
  const amountText = amount ? `${amount.toLocaleString('es-CO')} ${currency}` : 'monto pendiente';
  const orderLine = orderId ? `Pedido: ${orderId}` : 'Pedido en proceso';

  const html = `
  <div style="font-family: Arial, sans-serif; color: #111827;">
    <h2>Gracias por tu compra</h2>
    <p>Hemos recibido tu pago y esta pendiente de confirmacion.</p>
    <p><strong>Producto:</strong> ${productName}</p>
    <p><strong>Importe:</strong> ${amountText}</p>
    <p><strong>${orderLine}</strong></p>
    <p>Te avisaremos cuando el pago quede aprobado.</p>
  </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json({ error: 'Resend failed', details: errorBody }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ ok: true, id: data?.id || null });
}
