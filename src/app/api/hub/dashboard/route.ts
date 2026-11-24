import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

function getAuthHeader(request: NextRequest, bodyToken?: string): Record<string, string> | null {
  const token = String(
    bodyToken ||
      request.headers.get('x-project-jwt') ||
      request.headers.get('x-api-key') ||
      request.nextUrl.searchParams.get('token') ||
      ''
  ).trim();
  if (!token) return null;
  const isJwt = token.split('.').length === 3;
  return isJwt ? { 'x-project-jwt': token } : { 'x-api-key': token };
}

export async function GET(request: NextRequest) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ success: false, error: 'Token JWT do projeto ausente.' }, { status: 401 });
  }

  try {
    const scope = request.nextUrl.searchParams.get('scope') || '';
    if (scope === 'billing') {
      const resp = await fetch(`${BACKEND_URL}/api/hub/v1/billing`, {
        headers: authHeader,
        cache: 'no-store',
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    }

    const phoneNumberId = request.nextUrl.searchParams.get('phoneNumberId') || '';
    const igUserId = request.nextUrl.searchParams.get('igUserId') || '';
    const params = new URLSearchParams();
    if (phoneNumberId) params.set('phoneNumberId', phoneNumberId);
    if (igUserId) params.set('igUserId', igUserId);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const resp = await fetch(`${BACKEND_URL}/api/hub/v1/dashboard${qs}`, {
      headers: authHeader,
      cache: 'no-store',
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(
      {
        ...data,
        appId: data.appId || process.env.NEXT_PUBLIC_META_APP_ID || '',
        configId: data.configId || process.env.NEXT_PUBLIC_META_CONFIG_ID || '',
        instagramConfigId:
          data.instagramConfigId ||
          process.env.NEXT_PUBLIC_META_IG_CONFIG_ID ||
          '2221685615392715',
      },
      { status: resp.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao consultar painel do projeto';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = getAuthHeader(request, body.token);
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token JWT do projeto ausente.' }, { status: 401 });
    }
    const { token: _ignore, scope, ...payload } = body;
    const targetPath = scope === 'profile' ? '/api/hub/v1/profile' : '/api/hub/v1/webhook';
    const resp = await fetch(`${BACKEND_URL}${targetPath}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar webhooks do projeto';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = getAuthHeader(request, body.token);
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token JWT do projeto ausente.' }, { status: 401 });
    }
    const { token: _ignore, action, ...payload } = body;

    const actionMap: Record<string, { method: string; path: string }> = {
      'send-whatsapp': { method: 'POST', path: '/api/hub/v1/messages/send' },
      'instagram-onboard': { method: 'POST', path: '/api/hub/v1/instagram/onboard' },
      'instagram-reply': { method: 'POST', path: '/api/hub/v1/instagram/comments/reply' },
      'instagram-dm': { method: 'POST', path: '/api/hub/v1/instagram/dm' },
      'instagram-reel': { method: 'POST', path: '/api/hub/v1/instagram/reels/publish' },
      'instagram-disconnect': {
        method: 'DELETE',
        path: `/api/hub/v1/instagram/accounts/${encodeURIComponent(String(payload.igUserId || ''))}`,
      },
    };

    const target = actionMap[String(action || '')];
    if (!target) {
      return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });
    }

    const resp = await fetch(`${BACKEND_URL}${target.path}`, {
      method: target.method,
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: target.method === 'DELETE' ? undefined : JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao executar ação do projeto';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
