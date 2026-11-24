import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

export async function GET(request: NextRequest) {
  const credential =
    request.nextUrl.searchParams.get('token') ||
    request.nextUrl.searchParams.get('apiKey') ||
    request.headers.get('x-project-jwt') ||
    request.headers.get('x-api-key') ||
    '';

  if (!credential.trim()) {
    return NextResponse.json(
      { success: false, error: 'Informe a Chave JWT de Login ou API Key do projeto.' },
      { status: 400 }
    );
  }

  try {
    const clean = credential.trim();
    const isJwt = clean.split('.').length === 3;
    const resp = await fetch(`${BACKEND_URL}/api/hub/v1/me`, {
      headers: isJwt ? { 'x-project-jwt': clean } : { 'x-api-key': clean },
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
        apiVersion: data.apiVersion || process.env.NEXT_PUBLIC_META_API_VERSION || 'v24.0',
      },
      { status: resp.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao validar credencial no Hub';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential = String(
      body.token ||
        body.apiKey ||
        request.headers.get('x-project-jwt') ||
        request.headers.get('x-api-key') ||
        ''
    ).trim();
    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credencial (JWT ou API Key) do projeto é obrigatória.' },
        { status: 400 }
      );
    }

    const { apiKey: _ignoreKey, token: _ignoreToken, channel, ...forwardPayload } = body;
    const isJwt = credential.split('.').length === 3;
    const targetPath =
      channel === 'instagram' ? '/api/hub/v1/instagram/onboard' : '/api/hub/v1/meta/onboard';

    const resp = await fetch(`${BACKEND_URL}${targetPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isJwt ? { 'x-project-jwt': credential } : { 'x-api-key': credential }),
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
