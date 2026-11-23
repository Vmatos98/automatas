import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
const INTERNAL_API_KEY =
  process.env.INTERNAL_API_KEY || 'automatas_internal_secret_key_2026';

export async function GET() {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/projects`, {
      headers: { 'x-api-key': INTERNAL_API_KEY },
      cache: 'no-store',
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao consultar projetos no backend';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resp = await fetch(`${BACKEND_URL}/api/projects`, {
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
    const msg = err instanceof Error ? err.message : 'Falha ao criar projeto no backend';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
