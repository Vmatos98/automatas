import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

export async function GET(request: NextRequest) {
  const accountJwt = request.headers.get('x-account-jwt') || '';
  try {
    const resp = await fetch(`${BACKEND_URL}/api/billing/projects`, {
      headers: { 'x-account-jwt': accountJwt },
      cache: 'no-store',
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar projetos da conta';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const accountJwt = request.headers.get('x-account-jwt') || '';
  try {
    const body = await request.json();
    const action = String(body.action || 'create');
    let url = `${BACKEND_URL}/api/billing/projects`;

    if (action === 'rotate-key' && body.projectId) {
      url = `${BACKEND_URL}/api/billing/projects/${encodeURIComponent(String(body.projectId))}/rotate-key`;
    } else if (action === 'rotate-jwt' && body.projectId) {
      url = `${BACKEND_URL}/api/billing/projects/${encodeURIComponent(String(body.projectId))}/rotate-jwt`;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-jwt': accountJwt,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro na ação de projeto da conta';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const accountJwt = request.headers.get('x-account-jwt') || '';
  try {
    const body = await request.json();
    const projectId = String(body.projectId || '').trim();
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId obrigatório.' }, { status: 400 });
    }
    const resp = await fetch(
      `${BACKEND_URL}/api/billing/projects/${encodeURIComponent(projectId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-account-jwt': accountJwt,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar projeto da conta';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const accountJwt = request.headers.get('x-account-jwt') || '';
  const projectId = request.nextUrl.searchParams.get('projectId') || '';
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId obrigatório.' }, { status: 400 });
  }
  try {
    const resp = await fetch(
      `${BACKEND_URL}/api/billing/projects/${encodeURIComponent(projectId)}`,
      {
        method: 'DELETE',
        headers: { 'x-account-jwt': accountJwt },
      }
    );
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao excluir projeto da conta';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
