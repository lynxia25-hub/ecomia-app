import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { decryptString } from '@/lib/crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type CheckoutPayload = {
  landingId?: string;
  storeId?: string;
};

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: Request) {
  let payload: CheckoutPayload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 });
  }

  const { landingId, storeId } = payload || {};
  if (!landingId && !storeId) {
    return NextResponse.json({ error: 'Falta landingId o storeId' }, { status: 400 });
  }

  const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
  const supabase = createServiceClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (landingId) {
    const { data: landing, error } = await supabase
      .from('landing_pages')
      .select('id, user_id, title, slug, status, content, store_id')
      .eq('id', landingId)
      .maybeSingle();

    if (error || !landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 });
    }

    const isOwner = Boolean(user && user.id === landing.user_id);
    const isPublished = landing.status === 'published';

    if (!isPublished && !isOwner) {
      return NextResponse.json({ error: 'Landing no publicada' }, { status: 403 });
    }

    if (!landing.store_id) {
      return NextResponse.json({ error: 'Landing sin tienda para pagos' }, { status: 400 });
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, meta')
      .eq('id', landing.store_id)
      .maybeSingle();

    if (storeError || !store) {
      return NextResponse.json({ error: 'No se pudo cargar la tienda' }, { status: 500 });
    }

    const storeMeta = (store.meta || {}) as Record<string, unknown>;
    const storePayments = (storeMeta.payments || {}) as Record<string, unknown>;
    const mp = (storePayments.mercadopago || {}) as Record<string, unknown>;
    const accessTokenEnc = getString(mp.access_token_enc);

    if (!accessTokenEnc) {
      return NextResponse.json({ error: 'La tienda no tiene token de MercadoPago' }, { status: 400 });
    }

    let token = '';
    try {
      token = decryptString(accessTokenEnc);
    } catch (error) {
      return NextResponse.json({ error: 'No se pudo descifrar el token' }, { status: 500 });
    }

    const content = (landing.content || {}) as Record<string, unknown>;
    const checkout = (content.checkout || {}) as Record<string, unknown>;
    const product = (content.product || {}) as Record<string, unknown>;

    if (!checkout.enabled) {
      return NextResponse.json({ error: 'Checkout no activo' }, { status: 400 });
    }

    const price = toNumber(checkout.price_cop) || 0;
    if (price <= 0) {
      return NextResponse.json({ error: 'Precio no configurado' }, { status: 400 });
    }

    const productName = getString(checkout.product_name) || getString(product.name) || landing.title;
    const slug = landing.slug || '';
    const backUrl = slug ? `${origin}/l/${slug}` : origin;

    const preference = {
      items: [
        {
          title: productName,
          quantity: 1,
          currency_id: 'COP',
          unit_price: price,
        },
      ],
      back_urls: {
        success: backUrl,
        pending: backUrl,
        failure: backUrl,
      },
      auto_return: 'approved',
      external_reference: `landing:${landing.id}`,
      metadata: {
        landing_id: landing.id,
        source: 'landing',
      },
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const mpPayload = await mpResponse.json();
    if (!mpResponse.ok) {
      return NextResponse.json({ error: 'No se pudo crear el checkout' }, { status: 500 });
    }

    return NextResponse.json({ init_point: mpPayload?.init_point });
  }

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, user_id, name, slug, status, meta')
    .eq('id', storeId)
    .maybeSingle();

  if (storeError || !store) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  }

  const isOwner = Boolean(user && user.id === store.user_id);
  const isActive = store.status === 'active';

  if (!isActive && !isOwner) {
    return NextResponse.json({ error: 'Tienda no activa' }, { status: 403 });
  }

  const meta = (store.meta || {}) as Record<string, unknown>;
  const payments = (meta.payments || {}) as Record<string, unknown>;
  const mp = (payments.mercadopago || {}) as Record<string, unknown>;
  const accessTokenEnc = getString(mp.access_token_enc);

  if (!accessTokenEnc) {
    return NextResponse.json({ error: 'La tienda no tiene token de MercadoPago' }, { status: 400 });
  }

  let token = '';
  try {
    token = decryptString(accessTokenEnc);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo descifrar el token' }, { status: 500 });
  }
  const checkout = (meta.checkout || {}) as Record<string, unknown>;

  if (!checkout.enabled) {
    return NextResponse.json({ error: 'Checkout no activo' }, { status: 400 });
  }

  const price = toNumber(checkout.price_cop) || 0;
  if (price <= 0) {
    return NextResponse.json({ error: 'Precio no configurado' }, { status: 400 });
  }

  const productName = getString(checkout.product_name) || store.name;
  const slug = store.slug || '';
  const backUrl = slug ? `${origin}/s/${slug}` : origin;

  const preference = {
    items: [
      {
        title: productName,
        quantity: 1,
        currency_id: 'COP',
        unit_price: price,
      },
    ],
    back_urls: {
      success: backUrl,
      pending: backUrl,
      failure: backUrl,
    },
    auto_return: 'approved',
    external_reference: `store:${store.id}`,
    metadata: {
      store_id: store.id,
      source: 'store',
    },
  };

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const mpPayload = await mpResponse.json();
  if (!mpResponse.ok) {
    return NextResponse.json({ error: 'No se pudo crear el checkout' }, { status: 500 });
  }

  return NextResponse.json({ init_point: mpPayload?.init_point });
}
