import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Estado global em memória para sincronização instantânea
declare global {
  // eslint-disable-next-line no-var
  var __meta_session_state: {
    isConnected: boolean;
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPicture?: string;
    phoneNumberId?: string;
    wabaId?: string;
    connectedAt?: string;
    authType?: 'facebook_login' | 'embedded_signup' | 'system_user';
  } | undefined;
}

if (!globalThis.__meta_session_state) {
  globalThis.__meta_session_state = {
    isConnected: !!process.env.META_PHONE_NUMBER_ID,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '1319012711295096',
    userName: 'Administrador automatas.tech',
    userEmail: 'contato@automatas.tech',
    authType: 'system_user',
    connectedAt: new Date().toISOString(),
  };
}

/**
 * GET /api/meta/auth
 * Retorna o status atual da autenticação e conta Meta conectada
 */
export async function GET() {
  return NextResponse.json({
    session: globalThis.__meta_session_state,
    appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
    configId: process.env.NEXT_PUBLIC_META_CONFIG_ID || '',
    phoneNumberId: globalThis.__meta_session_state?.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '',
  });
}

/**
 * POST /api/meta/auth
 * Recebe o resultado do Facebook Login ou Embedded Signup e registra na plataforma
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      authType,
      userId,
      userName,
      userEmail,
      userPicture,
      phoneNumberId,
      wabaId,
      accessToken,
      code,
    } = body;

    console.log('[API /api/meta/auth] Conexão recebida da Meta:', {
      authType,
      userId,
      userName,
      userEmail,
      phoneNumberId,
      wabaId,
      hasToken: !!accessToken,
      hasCode: !!code,
    });

    // Atualiza estado global em memória
    globalThis.__meta_session_state = {
      isConnected: true,
      userId: userId || globalThis.__meta_session_state?.userId,
      userName: userName || 'Usuário Meta Autorizado',
      userEmail: userEmail || undefined,
      userPicture: userPicture || undefined,
      phoneNumberId: phoneNumberId || globalThis.__meta_session_state?.phoneNumberId || process.env.META_PHONE_NUMBER_ID,
      wabaId: wabaId || globalThis.__meta_session_state?.wabaId,
      authType: authType || 'facebook_login',
      connectedAt: new Date().toISOString(),
    };

    // Registra ou atualiza no banco SQLite se houver email ou userId
    try {
      const recordId = userId ? `meta_${userId}` : `meta_user_${Date.now()}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = coalesce(excluded.email, registered_users.email),
          phone = coalesce(excluded.phone, registered_users.phone),
          updated_at = excluded.updated_at
      `).run(
        recordId,
        userName || 'Usuário Facebook Login',
        phoneNumberId || null,
        userEmail || null,
        authType === 'embedded_signup' ? 'whatsapp_embedded_signup' : 'facebook_login',
        now,
        now
      );
    } catch (dbErr) {
      console.warn('[API /api/meta/auth] Aviso ao salvar usuário no SQLite:', dbErr);
    }

    return NextResponse.json({
      success: true,
      session: globalThis.__meta_session_state,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno ao processar autenticação';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
