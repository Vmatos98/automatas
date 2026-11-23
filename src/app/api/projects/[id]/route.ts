import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
const INTERNAL_API_KEY =
  process.env.INTERNAL_API_KEY || 'automatas_internal_secret_key_2026';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const resp = await fetch(`${BACKEND_URL}/api/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === 'assign-phone' ? 'assign-phone' : 'rotate-key';

    const resp = await fetch(
      `${BACKEND_URL}/api/projects/${encodeURIComponent(id)}/${action}`,
      {
        method: 'POST',
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
    const msg = err instanceof Error ? err.message : 'Erro ao executar ação do projeto';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const resp = await fetch(`${BACKEND_URL}/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-api-key': INTERNAL_API_KEY },
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao excluir projeto';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
