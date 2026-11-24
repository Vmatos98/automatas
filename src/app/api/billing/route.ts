import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
const INTERNAL_API_KEY =
  process.env.INTERNAL_API_KEY || 'automatas_internal_secret_key_2026';

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get('scope') || 'plans';
  const accountJwt = request.headers.get('x-account-jwt') || '';

  try {
    let url = `${BACKEND_URL}/api/billing/plans`;
    const headers: Record<string, string> = {};

    if (scope === 'admin') {
      url = `${BACKEND_URL}/api/billing/admin/overview`;
      headers['x-api-key'] = INTERNAL_API_KEY;
    } else if (scope === 'me') {
      url = `${BACKEND_URL}/api/billing/me`;
      headers['x-account-jwt'] = accountJwt;
    } else if (scope === 'workspace') {
      url = `${BACKEND_URL}/api/billing/workspace`;
      headers['x-account-jwt'] = accountJwt;
    }

    const resp = await fetch(url, { headers, cache: 'no-store' });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao consultar financeiro no backend';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || '');
    const accountJwt = request.headers.get('x-account-jwt') || '';

    let url = '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (action === 'register') {
      url = `${BACKEND_URL}/api/billing/auth/register`;
    } else if (action === 'subscribe') {
      url = `${BACKEND_URL}/api/billing/subscribe`;
      headers['x-account-jwt'] = accountJwt;
    } else if (action === 'redeem-code') {
      url = `${BACKEND_URL}/api/billing/redeem-code`;
      headers['x-account-jwt'] = accountJwt;
    } else if (action === 'admin-create-account') {
      url = `${BACKEND_URL}/api/billing/admin/accounts`;
      headers['x-api-key'] = INTERNAL_API_KEY;
    } else if (action === 'admin-generate-codes') {
      url = `${BACKEND_URL}/api/billing/admin/courtesy-codes`;
      headers['x-api-key'] = INTERNAL_API_KEY;
    } else if (action === 'admin-mark-paid') {
      url = `${BACKEND_URL}/api/billing/admin/invoices/${encodeURIComponent(String(body.invoiceId || ''))}/mark-paid`;
      headers['x-api-key'] = INTERNAL_API_KEY;
    } else {
      return NextResponse.json({ success: false, error: 'Ação financeira inválida.' }, { status: 400 });
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro na operação financeira';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const accountJwt = request.headers.get('x-account-jwt') || '';

    if (body.scope === 'me') {
      const resp = await fetch(`${BACKEND_URL}/api/billing/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-account-jwt': accountJwt,
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    }

    const accountId = String(body.id || '').trim();
    if (!accountId) {
      return NextResponse.json({ success: false, error: 'id da conta obrigatório.' }, { status: 400 });
    }
    const resp = await fetch(
      `${BACKEND_URL}/api/billing/admin/accounts/${encodeURIComponent(accountId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': INTERNAL_API_KEY,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar conta';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code') || '';
    if (!code) {
      return NextResponse.json({ success: false, error: 'code obrigatório.' }, { status: 400 });
    }
    const resp = await fetch(
      `${BACKEND_URL}/api/billing/admin/courtesy-codes/${encodeURIComponent(code)}`,
      {
        method: 'DELETE',
        headers: { 'x-api-key': INTERNAL_API_KEY },
      }
    );
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao remover código';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
