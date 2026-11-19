import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMetaConfig } from '@/lib/whatsapp';

export interface CoexistenceSyncState {
  contactsSynced: boolean;
  historySynced: boolean;
  syncedAt?: string;
  warnings?: string[];
}

export interface MetaSessionState {
  isConnected: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPicture?: string;
  phoneNumberId?: string;
  wabaId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  isCoexistence?: boolean;
  onboardingMode?: 'coexistence' | 'standard';
  embeddedEvent?: string;
  tokenExchanged?: boolean;
  webhookSubscribed?: boolean;
  coexistenceSync?: CoexistenceSyncState;
  connectedAt?: string;
  authType?: 'facebook_login' | 'embedded_signup' | 'system_user';
  accessToken?: string;
}

// Estado global em memória para sincronização instantânea
declare global {
  // eslint-disable-next-line no-var
  var __meta_session_state: MetaSessionState | undefined;
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

function sanitizeSession(session?: MetaSessionState): Omit<MetaSessionState, 'accessToken'> | undefined {
  if (!session) return undefined;
  const { accessToken: _omitToken, ...safeSession } = session;
  void _omitToken;
  return safeSession;
}

async function postSmbAppSync(
  apiVersion: string,
  phoneNumberId: string,
  token: string,
  syncType: 'smb_app_state_sync' | 'history'
): Promise<{ ok: boolean; warning?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/smb_app_data`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          sync_type: syncType,
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      return { ok: false, warning: `Sync "${syncType}": ${errMsg}` };
    }
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, warning: `Sync "${syncType}": ${msg}` };
  }
}

/**
 * Dispara a sincronização de contatos e histórico (até 6 meses) da coexistência
 * IMPORTANTE: nunca chamar /{phoneNumberId}/register em contas de coexistência.
 */
async function triggerCoexistenceSync(
  apiVersion: string,
  phoneNumberId: string,
  token: string
): Promise<CoexistenceSyncState> {
  const warnings: string[] = [];

  const contactsRes = await postSmbAppSync(apiVersion, phoneNumberId, token, 'smb_app_state_sync');
  if (!contactsRes.ok && contactsRes.warning) warnings.push(contactsRes.warning);

  const historyRes = await postSmbAppSync(apiVersion, phoneNumberId, token, 'history');
  if (!historyRes.ok && historyRes.warning) warnings.push(historyRes.warning);

  return {
    contactsSynced: contactsRes.ok,
    historySynced: historyRes.ok,
    syncedAt: new Date().toISOString(),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * GET /api/meta/auth
 * Retorna o status atual da autenticação e conta Meta conectada
 */
export async function GET() {
  return NextResponse.json({
    session: sanitizeSession(globalThis.__meta_session_state),
    appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
    configId: process.env.NEXT_PUBLIC_META_CONFIG_ID || '',
    phoneNumberId:
      globalThis.__meta_session_state?.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '',
  });
}

/**
 * POST /api/meta/auth
 * Recebe o resultado do Facebook Login ou Embedded Signup (incluindo Coexistência) e registra na plataforma
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
      businessId,
      accessToken,
      code,
      isCoexistence,
      onboardingMode,
      embeddedEvent,
    } = body;

    const coexistenceFlag = Boolean(
      isCoexistence ||
        onboardingMode === 'coexistence' ||
        embeddedEvent === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
    );

    const { apiVersion } = getMetaConfig();
    const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || '';
    const appSecret = process.env.META_APP_SECRET || '';

    const onboardingDetails = {
      tokenExchanged: false,
      phoneResolvedFromWaba: false,
      webhookSubscribed: false,
      contactsSynced: false,
      historySynced: false,
      warnings: [] as string[],
    };

    console.log('[API /api/meta/auth] Conexão recebida da Meta:', {
      authType,
      userId,
      userName,
      userEmail,
      phoneNumberId,
      wabaId,
      businessId,
      coexistenceFlag,
      embeddedEvent,
      hasToken: !!accessToken,
      hasCode: !!code,
    });

    // 1. Trocar authorization code pelo token de acesso de negócio (OAuth server-side)
    let exchangedToken = '';
    if (code) {
      if (appId && appSecret) {
        try {
          const tokenUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`);
          tokenUrl.searchParams.set('client_id', appId);
          tokenUrl.searchParams.set('client_secret', appSecret);
          tokenUrl.searchParams.set('code', String(code));

          const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' });
          const tokenData = await tokenRes.json().catch(() => ({}));
          if (tokenRes.ok && tokenData?.access_token) {
            exchangedToken = String(tokenData.access_token);
            onboardingDetails.tokenExchanged = true;
          } else {
            onboardingDetails.warnings.push(
              `Falha na troca do code OAuth: ${tokenData?.error?.message || `HTTP ${tokenRes.status}`}`
            );
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          onboardingDetails.warnings.push(`Erro ao trocar code OAuth: ${msg}`);
        }
      } else {
        onboardingDetails.warnings.push(
          'META_APP_SECRET não configurado no servidor: troca automática do code OAuth e sincronização de coexistência ficaram pendentes.'
        );
      }
    }

    const effectiveToken = exchangedToken || accessToken || process.env.META_ACCESS_TOKEN || '';
    let resolvedWabaId: string | undefined = wabaId || globalThis.__meta_session_state?.wabaId;
    if (wabaId) resolvedWabaId = String(wabaId);

    let resolvedPhoneNumberId: string | undefined = phoneNumberId
      ? String(phoneNumberId)
      : undefined;
    let resolvedDisplayPhoneNumber: string | undefined;

    // 2. Fallback: descobrir phone_number_id via WABA quando FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING omitir
    if (!resolvedPhoneNumberId && resolvedWabaId && effectiveToken) {
      try {
        const phonesRes = await fetch(
          `https://graph.facebook.com/${apiVersion}/${resolvedWabaId}/phone_numbers`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${effectiveToken}` },
          }
        );
        const phonesData = await phonesRes.json().catch(() => ({}));
        if (phonesRes.ok && Array.isArray(phonesData?.data) && phonesData.data.length > 0) {
          const firstPhone = phonesData.data[0];
          if (firstPhone?.id) {
            resolvedPhoneNumberId = String(firstPhone.id);
            onboardingDetails.phoneResolvedFromWaba = true;
          }
          if (firstPhone?.display_phone_number) {
            resolvedDisplayPhoneNumber = String(firstPhone.display_phone_number);
          }
        } else if (!phonesRes.ok) {
          onboardingDetails.warnings.push(
            `Não foi possível consultar números da WABA: ${phonesData?.error?.message || `HTTP ${phonesRes.status}`}`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onboardingDetails.warnings.push(`Erro ao consultar números da WABA: ${msg}`);
      }
    }

    const finalPhoneNumberId =
      resolvedPhoneNumberId ||
      globalThis.__meta_session_state?.phoneNumberId ||
      process.env.META_PHONE_NUMBER_ID;

    // 3. Inscrever o app nos webhooks da WABA do cliente
    if (resolvedWabaId && effectiveToken && authType === 'embedded_signup') {
      try {
        const subRes = await fetch(
          `https://graph.facebook.com/${apiVersion}/${resolvedWabaId}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${effectiveToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const subData = await subRes.json().catch(() => ({}));
        if (subRes.ok && subData?.success !== false) {
          onboardingDetails.webhookSubscribed = true;
        } else {
          onboardingDetails.warnings.push(
            `Falha ao inscrever webhook na WABA: ${subData?.error?.message || `HTTP ${subRes.status}`}`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onboardingDetails.warnings.push(`Erro ao inscrever webhook na WABA: ${msg}`);
      }
    }

    // 4. Em coexistência, disparar sincronização de contatos e histórico (sem chamar /register)
    let coexistenceSync: CoexistenceSyncState | undefined;
    if (coexistenceFlag && finalPhoneNumberId && effectiveToken) {
      coexistenceSync = await triggerCoexistenceSync(apiVersion, finalPhoneNumberId, effectiveToken);
      onboardingDetails.contactsSynced = coexistenceSync.contactsSynced;
      onboardingDetails.historySynced = coexistenceSync.historySynced;
      if (coexistenceSync.warnings?.length) {
        onboardingDetails.warnings.push(...coexistenceSync.warnings);
      }
    }

    const resolvedOnboardingMode: 'coexistence' | 'standard' | undefined =
      authType === 'embedded_signup'
        ? coexistenceFlag
          ? 'coexistence'
          : 'standard'
        : coexistenceFlag
          ? 'coexistence'
          : globalThis.__meta_session_state?.onboardingMode;

    // Atualiza estado global em memória
    globalThis.__meta_session_state = {
      isConnected: true,
      userId: userId || globalThis.__meta_session_state?.userId,
      userName: userName || 'Usuário Meta Autorizado',
      userEmail: userEmail || undefined,
      userPicture: userPicture || undefined,
      phoneNumberId: finalPhoneNumberId,
      wabaId: resolvedWabaId,
      businessId: businessId || globalThis.__meta_session_state?.businessId,
      displayPhoneNumber:
        resolvedDisplayPhoneNumber || globalThis.__meta_session_state?.displayPhoneNumber,
      isCoexistence: coexistenceFlag,
      onboardingMode: resolvedOnboardingMode,
      embeddedEvent: embeddedEvent || undefined,
      tokenExchanged: onboardingDetails.tokenExchanged,
      webhookSubscribed: onboardingDetails.webhookSubscribed,
      coexistenceSync,
      authType: authType || 'facebook_login',
      connectedAt: new Date().toISOString(),
      accessToken: effectiveToken || globalThis.__meta_session_state?.accessToken,
    };

    // Registra ou atualiza no banco SQLite
    try {
      const recordId = userId ? `meta_${userId}` : `meta_user_${Date.now()}`;
      const now = new Date().toISOString();
      const userSource = coexistenceFlag
        ? 'whatsapp_coexistence'
        : authType === 'embedded_signup'
          ? 'whatsapp_embedded_signup'
          : 'facebook_login';

      db.prepare(`
        INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = coalesce(excluded.email, registered_users.email),
          phone = coalesce(excluded.phone, registered_users.phone),
          source = excluded.source,
          updated_at = excluded.updated_at
      `).run(
        recordId,
        userName || 'Usuário Facebook Login',
        finalPhoneNumberId || null,
        userEmail || null,
        userSource,
        now,
        now
      );
    } catch (dbErr) {
      console.warn('[API /api/meta/auth] Aviso ao salvar usuário no SQLite:', dbErr);
    }

    return NextResponse.json({
      success: true,
      session: sanitizeSession(globalThis.__meta_session_state),
      onboardingDetails,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno ao processar autenticação';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/meta/auth
 * Permite disparar manualmente a sincronização de contatos e histórico (janela de 24h da Coexistência)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phoneNumberId } = body;

    if (action !== 'sync_coexistence') {
      return NextResponse.json({ success: false, error: 'Ação não suportada.' }, { status: 400 });
    }

    const targetPhoneId =
      (typeof phoneNumberId === 'string' && phoneNumberId.trim()) ||
      globalThis.__meta_session_state?.phoneNumberId ||
      process.env.META_PHONE_NUMBER_ID ||
      '';

    const token =
      globalThis.__meta_session_state?.accessToken || process.env.META_ACCESS_TOKEN || '';

    if (!targetPhoneId) {
      return NextResponse.json(
        { success: false, error: 'Phone Number ID não disponível para sincronização.' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Token de acesso da Meta indisponível no servidor. Configure META_APP_SECRET ou META_ACCESS_TOKEN.',
        },
        { status: 400 }
      );
    }

    const { apiVersion } = getMetaConfig();
    const syncResult = await triggerCoexistenceSync(apiVersion, targetPhoneId, token);

    globalThis.__meta_session_state = {
      ...(globalThis.__meta_session_state || { isConnected: true }),
      phoneNumberId: targetPhoneId,
      isCoexistence: true,
      onboardingMode: 'coexistence',
      coexistenceSync: syncResult,
    };

    return NextResponse.json({
      success: syncResult.contactsSynced || syncResult.historySynced,
      session: sanitizeSession(globalThis.__meta_session_state),
      syncResult,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erro interno ao sincronizar dados da coexistência';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
