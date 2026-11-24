import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
const INTERNAL_API_KEY =
  process.env.INTERNAL_API_KEY || 'automatas_internal_secret_key_2026';

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope') || 'overview';
    const igUserId = request.nextUrl.searchParams.get('igUserId') || '';
    const qs = igUserId && igUserId !== 'all' ? `?igUserId=${encodeURIComponent(igUserId)}` : '';
    const endpoint =
      scope === 'insights'
        ? `/api/projects/instagram/insights${qs}`
        : `/api/projects/instagram/overview${qs}`;
    const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: { 'x-api-key': INTERNAL_API_KEY },
      cache: 'no-store',
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(
      {
        ...data,
        appId: data.appId || process.env.NEXT_PUBLIC_META_APP_ID || '',
        instagramConfigId:
          data.instagramConfigId ||
          process.env.NEXT_PUBLIC_META_IG_CONFIG_ID ||
          '2221685615392715',
      },
      { status: resp.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao consultar Instagram no backend';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || 'onboard');
    const map: Record<string, string> = {
      onboard: '/api/projects/instagram/onboard',
      reply: '/api/projects/instagram/reply',
      dm: '/api/projects/instagram/dm',
      reel: '/api/projects/instagram/reels/publish',
    };
    const path = map[action] || map.onboard;

    const resp = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro na operação Instagram';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const igUserId = request.nextUrl.searchParams.get('igUserId') || '';
    if (!igUserId) {
      return NextResponse.json({ success: false, error: 'igUserId é obrigatório.' }, { status: 400 });
    }
    const resp = await fetch(
      `${BACKEND_URL}/api/projects/instagram/accounts/${encodeURIComponent(igUserId)}`,
      {
        method: 'DELETE',
        headers: { 'x-api-key': INTERNAL_API_KEY },
      }
    );
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao desconectar conta do Instagram';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
