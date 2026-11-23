import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

export async function GET(request: NextRequest) {
  const apiKey =
    request.nextUrl.searchParams.get('apiKey') ||
    request.headers.get('x-api-key') ||
    '';

  if (!apiKey.trim()) {
    return NextResponse.json(
      { success: false, error: 'Informe a API Key do projeto (apiKey).' },
      { status: 400 }
    );
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/hub/v1/me`, {
      headers: { 'x-api-key': apiKey.trim() },
      cache: 'no-store',
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(
      {
        ...data,
        appId: data.appId || process.env.NEXT_PUBLIC_META_APP_ID || '',
        configId: data.configId || process.env.NEXT_PUBLIC_META_CONFIG_ID || '',
        apiVersion: data.apiVersion || process.env.NEXT_PUBLIC_META_API_VERSION || 'v24.0',
      },
      { status: resp.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao validar API Key no Hub';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = String(body.apiKey || request.headers.get('x-api-key') || '').trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key do projeto é obrigatória.' },
        { status: 400 }
      );
    }

    const { apiKey: _ignore, ...forwardPayload } = body;
    const resp = await fetch(`${BACKEND_URL}/api/hub/v1/meta/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(forwardPayload),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao conectar conta no Hub';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
