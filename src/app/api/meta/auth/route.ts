import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMetaConfig } from '@/lib/whatsapp';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const INTERNAL_API_KEY =
  process.env.INTERNAL_API_KEY || 'gcYQtZJb6nADOf5ob5QK9S0WgYUmSAq3HynjfWTlg8gQ0W9jqn';

export interface CoexistenceSyncState {
  contactsSynced: boolean;
  historySynced: boolean;
  syncedAt?: string;
  warnings?: string[];
}

export interface PublicWhatsAppAccount {
  phoneNumberId: string;
  wabaId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPicture?: string;
  isCoexistence: boolean;
  onboardingMode: 'coexistence' | 'standard' | 'system_user';
  authType: 'embedded_signup' | 'facebook_login' | 'system_user';
  isDefaultEnv: boolean;
  tokenExchanged: boolean;
  webhookSubscribed: boolean;
  contactsSynced: boolean;
  historySynced: boolean;
  lastSyncAt?: string;
  syncWarnings?: string[];
  status: string;
  connectedAt: string;
  updatedAt: string;
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
  verifiedName?: string;
  isCoexistence?: boolean;
  onboardingMode?: 'coexistence' | 'standard' | 'system_user';
  embeddedEvent?: string;
  tokenExchanged?: boolean;
  webhookSubscribed?: boolean;
  coexistenceSync?: CoexistenceSyncState;
  connectedAt?: string;
  authType?: 'facebook_login' | 'embedded_signup' | 'system_user';
  accessToken?: string;
}

declare global {
  var __meta_session_state: MetaSessionState | undefined;
}

function ensureLocalDefaultEnvAccount() {
  const defaultPhoneId = process.env.META_PHONE_NUMBER_ID;
  if (!defaultPhoneId) return;
  try {
    const existing = db
      .prepare('SELECT phone_number_id FROM whatsapp_accounts WHERE phone_number_id = ? LIMIT 1')
      .get(defaultPhoneId);
    if (!existing) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO whatsapp_accounts (
          phone_number_id, user_name, user_email, onboarding_mode, auth_type, status, connected_at, updated_at
        ) VALUES (?, ?, ?, 'standard', 'system_user', 'active', ?, ?)
      `).run(defaultPhoneId, 'Número Principal (Cloud API)', 'contato@automatas.tech', now, now);
    }
  } catch {
    // fallback resiliente
  }
}

function mapLocalRowToPublicAccount(row: any): PublicWhatsAppAccount {
  let warnings: string[] | undefined;
  if (typeof row.sync_warnings === 'string' && row.sync_warnings.trim()) {
    try {
      const parsed = JSON.parse(row.sync_warnings);
      if (Array.isArray(parsed) && parsed.length > 0) warnings = parsed.map(String);
    } catch {
      warnings = [row.sync_warnings];
    }
  }

  return {
    phoneNumberId: String(row.phone_number_id),
    wabaId: row.waba_id || undefined,
    businessId: row.business_id || undefined,
    displayPhoneNumber: row.display_phone_number || undefined,
    verifiedName: row.verified_name || undefined,
    userId: row.user_id || undefined,
    userName: row.user_name || undefined,
    userEmail: row.user_email || undefined,
    userPicture: row.user_picture || undefined,
    isCoexistence: Boolean(row.is_coexistence),
    onboardingMode: row.onboarding_mode || 'standard',
    authType: row.auth_type || 'embedded_signup',
    isDefaultEnv: Boolean(
      process.env.META_PHONE_NUMBER_ID &&
        String(row.phone_number_id) === process.env.META_PHONE_NUMBER_ID
    ),
    tokenExchanged: Boolean(row.token_exchanged),
    webhookSubscribed: Boolean(row.webhook_subscribed),
    contactsSynced: Boolean(row.contacts_synced),
    historySynced: Boolean(row.history_synced),
    lastSyncAt: row.last_sync_at || undefined,
    syncWarnings: warnings,
    status: row.status || 'active',
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  };
}

function listLocalAccounts(): PublicWhatsAppAccount[] {
  ensureLocalDefaultEnvAccount();
  try {
    const rows = db
      .prepare("SELECT * FROM whatsapp_accounts WHERE status != 'disconnected' ORDER BY connected_at DESC")
      .all() as any[];
    return rows.map(mapLocalRowToPublicAccount);
  } catch {
    return [];
  }
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

async function triggerCoexistenceSyncLocal(
  apiVersion: string,
  phoneNumberId: string,
  token: string
): Promise<CoexistenceSyncState> {
  const warnings: string[] = [];

  const contactsRes = await postSmbAppSync(apiVersion, phoneNumberId, token, 'smb_app_state_sync');
  if (!contactsRes.ok && contactsRes.warning) warnings.push(contactsRes.warning);

  const historyRes = await postSmbAppSync(apiVersion, phoneNumberId, token, 'history');
  if (!historyRes.ok && historyRes.warning) warnings.push(historyRes.warning);

  const syncedAt = new Date().toISOString();
  try {
    db.prepare(`
      UPDATE whatsapp_accounts
      SET is_coexistence = 1,
          onboarding_mode = 'coexistence',
          contacts_synced = ?,
          history_synced = ?,
          last_sync_at = ?,
          sync_warnings = ?,
          updated_at = ?
      WHERE phone_number_id = ?
    `).run(
      contactsRes.ok ? 1 : 0,
      historyRes.ok ? 1 : 0,
      syncedAt,
      warnings.length > 0 ? JSON.stringify(warnings) : null,
      syncedAt,
      phoneNumberId
    );
  } catch {
    // fallback silencioso
  }

  return {
    contactsSynced: contactsRes.ok,
    historySynced: historyRes.ok,
    syncedAt,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * GET /api/meta/auth
 * Retorna todas as contas/números WhatsApp conectados (da VPS em produção ou SQLite local)
 */
export async function GET() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '';
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || '';

  if (BACKEND_URL) {
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/meta/auth`, {
        headers: { 'x-api-key': INTERNAL_API_KEY },
        cache: 'no-store',
      });
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json({
          ...backendData,
          appId,
          configId,
        });
      }
    } catch (err) {
      console.warn('[API /api/meta/auth GET] Falha ao consultar BACKEND_URL, usando fallback local:', err);
    }
  }

  const accounts = listLocalAccounts();
  const primary = accounts.find((a) => !a.isDefaultEnv) || accounts[0];
  const session: MetaSessionState | undefined = primary
    ? {
        isConnected: true,
        userId: primary.userId,
        userName: primary.userName,
        userEmail: primary.userEmail,
        userPicture: primary.userPicture,
        phoneNumberId: primary.phoneNumberId,
        wabaId: primary.wabaId,
        businessId: primary.businessId,
        displayPhoneNumber: primary.displayPhoneNumber,
        verifiedName: primary.verifiedName,
        isCoexistence: primary.isCoexistence,
        onboardingMode: primary.onboardingMode,
        tokenExchanged: primary.tokenExchanged,
        webhookSubscribed: primary.webhookSubscribed,
        coexistenceSync: {
          contactsSynced: primary.contactsSynced,
          historySynced: primary.historySynced,
          syncedAt: primary.lastSyncAt,
          warnings: primary.syncWarnings,
        },
        connectedAt: primary.connectedAt,
        authType: primary.authType,
      }
    : sanitizeSession(globalThis.__meta_session_state);

  return NextResponse.json({
    accounts,
    session,
    appId,
    configId,
    phoneNumberId: primary?.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '',
  });
}

/**
 * POST /api/meta/auth
 * Recebe o resultado do Embedded Signup e persiste no backend dedicado (VPS) + fallback local
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

    if (authType === 'embedded_signup') {
      if (embeddedEvent === 'CANCEL' || embeddedEvent === 'ERROR') {
        return NextResponse.json(
          { success: false, error: 'Onboarding cancelado ou encerrado com erro na Meta.' },
          { status: 400 }
        );
      }
      if (!wabaId && !phoneNumberId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Onboarding incompleto: nenhuma WABA ou número foi confirmado na Meta.',
          },
          { status: 400 }
        );
      }
    }

    const { apiVersion } = getMetaConfig();
    const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || '';
    const siteAppSecret = process.env.META_APP_SECRET || '';

    // Se o site possuir META_APP_SECRET, já troca o code aqui para garantir o token mesmo se o backend não tiver
    let preExchangedToken = '';
    let preExchanged = false;
    if (code && !accessToken && appId && siteAppSecret) {
      try {
        const tokenUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`);
        tokenUrl.searchParams.set('client_id', appId);
        tokenUrl.searchParams.set('client_secret', siteAppSecret);
        tokenUrl.searchParams.set('code', String(code));

        const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' });
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (tokenRes.ok && tokenData?.access_token) {
          preExchangedToken = String(tokenData.access_token);
          preExchanged = true;
        }
      } catch {
        // segue para o backend tentar também
      }
    }

    // 1. Repassar ao backend dedicado na VPS (fonte oficial em produção)
    if (BACKEND_URL) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/meta/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify({
            ...body,
            appId,
            accessToken: preExchangedToken || accessToken,
            tokenExchanged: preExchanged,
          }),
        });

        if (backendRes.ok) {
          const backendData = await backendRes.json();
          return NextResponse.json(backendData);
        }
      } catch (err) {
        console.warn('[API /api/meta/auth POST] Falha ao enviar ao BACKEND_URL, executando fallback local:', err);
      }
    }

    // 2. Fallback local caso BACKEND_URL não esteja acessível
    const coexistenceFlag = Boolean(
      isCoexistence ||
        onboardingMode === 'coexistence' ||
        embeddedEvent === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
    );

    const onboardingDetails = {
      tokenExchanged: preExchanged,
      phoneResolvedFromWaba: false,
      webhookSubscribed: false,
      contactsSynced: false,
      historySynced: false,
      warnings: [] as string[],
    };

    if (code && !preExchanged && !siteAppSecret) {
      onboardingDetails.warnings.push(
        'META_APP_SECRET não configurado no servidor: troca automática do code OAuth e sincronização de coexistência ficaram pendentes.'
      );
    }

    const effectiveToken = preExchangedToken || accessToken || process.env.META_ACCESS_TOKEN || '';
    let resolvedWabaId: string | undefined = wabaId ? String(wabaId) : undefined;
    let resolvedPhoneNumberId: string | undefined = phoneNumberId ? String(phoneNumberId) : undefined;
    let resolvedDisplayPhoneNumber: string | undefined;
    let resolvedVerifiedName: string | undefined;

    if (!resolvedPhoneNumberId && resolvedWabaId && effectiveToken) {
      try {
        const phonesRes = await fetch(
          `https://graph.facebook.com/${apiVersion}/${resolvedWabaId}/phone_numbers?fields=id,display_phone_number,verified_name`,
          { headers: { Authorization: `Bearer ${effectiveToken}` } }
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
          if (firstPhone?.verified_name) {
            resolvedVerifiedName = String(firstPhone.verified_name);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onboardingDetails.warnings.push(`Erro ao consultar números da WABA: ${msg}`);
      }
    }

    const finalPhoneNumberId =
      resolvedPhoneNumberId || process.env.META_PHONE_NUMBER_ID;

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
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onboardingDetails.warnings.push(`Erro ao inscrever webhook na WABA: ${msg}`);
      }
    }

    if (finalPhoneNumberId) {
      const now = new Date().toISOString();
      try {
        db.prepare(`
          INSERT INTO whatsapp_accounts (
            phone_number_id, waba_id, business_id, display_phone_number, verified_name,
            access_token, user_id, user_name, user_email, user_picture,
            is_coexistence, onboarding_mode, auth_type,
            token_exchanged, webhook_subscribed, sync_warnings,
            status, connected_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
          ON CONFLICT(phone_number_id) DO UPDATE SET
            waba_id = COALESCE(excluded.waba_id, whatsapp_accounts.waba_id),
            business_id = COALESCE(excluded.business_id, whatsapp_accounts.business_id),
            display_phone_number = COALESCE(excluded.display_phone_number, whatsapp_accounts.display_phone_number),
            verified_name = COALESCE(excluded.verified_name, whatsapp_accounts.verified_name),
            access_token = COALESCE(NULLIF(excluded.access_token, ''), whatsapp_accounts.access_token),
            is_coexistence = excluded.is_coexistence,
            onboarding_mode = excluded.onboarding_mode,
            auth_type = excluded.auth_type,
            updated_at = excluded.updated_at
        `).run(
          finalPhoneNumberId,
          resolvedWabaId || null,
          businessId || null,
          resolvedDisplayPhoneNumber || null,
          resolvedVerifiedName || null,
          preExchangedToken || accessToken || null,
          userId || null,
          userName || 'WhatsApp Business Integrado',
          userEmail || null,
          userPicture || null,
          coexistenceFlag ? 1 : 0,
          coexistenceFlag ? 'coexistence' : 'standard',
          authType || 'embedded_signup',
          onboardingDetails.tokenExchanged ? 1 : 0,
          onboardingDetails.webhookSubscribed ? 1 : 0,
          onboardingDetails.warnings.length > 0 ? JSON.stringify(onboardingDetails.warnings) : null,
          now,
          now
        );
      } catch (dbErr) {
        console.warn('[API /api/meta/auth] Aviso ao salvar whatsapp_accounts local:', dbErr);
      }
    }

    let coexistenceSync: CoexistenceSyncState | undefined;
    if (coexistenceFlag && finalPhoneNumberId && effectiveToken) {
      coexistenceSync = await triggerCoexistenceSyncLocal(apiVersion, finalPhoneNumberId, effectiveToken);
      onboardingDetails.contactsSynced = coexistenceSync.contactsSynced;
      onboardingDetails.historySynced = coexistenceSync.historySynced;
      if (coexistenceSync.warnings?.length) {
        onboardingDetails.warnings.push(...coexistenceSync.warnings);
      }
    }

    const accounts = listLocalAccounts();
    const session: MetaSessionState = {
      isConnected: true,
      userId,
      userName: userName || 'Usuário Meta Autorizado',
      userEmail: userEmail || undefined,
      userPicture: userPicture || undefined,
      phoneNumberId: finalPhoneNumberId,
      wabaId: resolvedWabaId,
      businessId: businessId || undefined,
      displayPhoneNumber: resolvedDisplayPhoneNumber,
      verifiedName: resolvedVerifiedName,
      isCoexistence: coexistenceFlag,
      onboardingMode: coexistenceFlag ? 'coexistence' : 'standard',
      embeddedEvent: embeddedEvent || undefined,
      tokenExchanged: onboardingDetails.tokenExchanged,
      webhookSubscribed: onboardingDetails.webhookSubscribed,
      coexistenceSync,
      authType: authType || 'facebook_login',
      connectedAt: new Date().toISOString(),
    };

    globalThis.__meta_session_state = session;

    return NextResponse.json({
      success: true,
      accounts,
      session: sanitizeSession(session),
      onboardingDetails,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno ao processar autenticação';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/meta/auth
 * Dispara sincronização manual da Coexistência (janela de 24h)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phoneNumberId } = body;

    if (action !== 'sync_coexistence') {
      return NextResponse.json({ success: false, error: 'Ação não suportada.' }, { status: 400 });
    }

    if (BACKEND_URL) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/meta/auth`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify({ action, phoneNumberId }),
        });
        const backendData = await backendRes.json().catch(() => ({}));
        return NextResponse.json(backendData, { status: backendRes.status });
      } catch (err) {
        console.warn('[API /api/meta/auth PATCH] Falha ao chamar BACKEND_URL, tentando local:', err);
      }
    }

    const targetPhoneId =
      (typeof phoneNumberId === 'string' && phoneNumberId.trim()) ||
      globalThis.__meta_session_state?.phoneNumberId ||
      process.env.META_PHONE_NUMBER_ID ||
      '';

    let token = process.env.META_ACCESS_TOKEN || '';
    if (targetPhoneId) {
      try {
        const row = db
          .prepare('SELECT access_token FROM whatsapp_accounts WHERE phone_number_id = ? LIMIT 1')
          .get(targetPhoneId) as { access_token?: string | null } | undefined;
        if (row?.access_token) token = row.access_token;
      } catch {}
    }

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
    const syncResult = await triggerCoexistenceSyncLocal(apiVersion, targetPhoneId, token);
    const accounts = listLocalAccounts();

    return NextResponse.json({
      success: syncResult.contactsSynced || syncResult.historySynced,
      accounts,
      session: sanitizeSession(globalThis.__meta_session_state),
      syncResult,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erro interno ao sincronizar dados da coexistência';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
