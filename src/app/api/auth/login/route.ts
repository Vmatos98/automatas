import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Preencha o e-mail e a senha para acessar.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // 1. Conta oficial da Meta App Review (Sandbox Isolada)
    const metaReviewEmail = (process.env.META_REVIEW_EMAIL || 'reviewer@automatas.tech').toLowerCase();
    const metaReviewPassword = process.env.META_REVIEW_PASSWORD || 'admin123';

    if (
      (cleanEmail === metaReviewEmail || cleanEmail === 'reviewer@automatas.tech') &&
      cleanPassword === metaReviewPassword
    ) {
      return NextResponse.json({
        success: true,
        user: {
          email: 'reviewer@automatas.tech',
          name: 'Auditor Meta (App Review)',
          role: 'admin',
          isAuditorMode: true,
        },
      });
    }

    // 2. Conta Master de Administrador (Produção Real)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@automatas.tech').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'automatas@admin2026';

    const isMasterAdminEmail =
      cleanEmail === adminEmail ||
      cleanEmail === 'admin@automatas.tech' ||
      cleanEmail === 'contato@automatas.tech';

    if (isMasterAdminEmail && cleanPassword === adminPassword) {
      return NextResponse.json({
        success: true,
        user: {
          email: cleanEmail,
          name: 'Victor Matos (Administrador)',
          role: 'admin',
          isAuditorMode: false,
          isExempt: true,
        },
      });
    }

    // 3. Autenticação de Contas SaaS / Agências cadastradas no Backend
    const backendUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    try {
      const saasResp = await fetch(`${backendUrl}/api/billing/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        cache: 'no-store',
      });
      const saasData = await saasResp.json().catch(() => ({}));
      if (saasResp.ok && saasData.success && saasData.account && saasData.accountJwt) {
        return NextResponse.json({
          success: true,
          user: {
            email: saasData.account.email,
            name: saasData.account.name,
            role: 'agency',
            isAuditorMode: false,
            isExempt: Boolean(saasData.account.isExempt),
          },
          accountJwt: saasData.accountJwt,
          account: saasData.account,
        });
      }
    } catch {
      // fallback para erro padrão abaixo
    }

    // 4. Qualquer outra credencial é estritamente rejeitada
    return NextResponse.json(
      { error: 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Erro na rota POST /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Falha interna ao validar credenciais.' },
      { status: 500 }
    );
  }
}
