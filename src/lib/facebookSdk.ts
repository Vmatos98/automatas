// Facebook JavaScript SDK & Meta WhatsApp Embedded Signup Helper

export const META_GRAPH_API_VERSION =
  process.env.NEXT_PUBLIC_META_API_VERSION || 'v24.0';

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FB?: any;
  }
}

export interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
  code?: string;
}

export type EmbeddedSignupEventType =
  | 'FINISH'
  | 'FINISH_ONLY_WABA'
  | 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
  | 'CANCEL'
  | 'ERROR';

export interface WhatsAppEmbeddedSignupData {
  event?: EmbeddedSignupEventType | string;
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  is_on_biz_app?: boolean;
  is_coexistence?: boolean;
  messaging_account_ids?: string[];
  primary_waac_ids?: string[];
  current_step?: string;
  error_message?: string;
  error_id?: string;
  session_id?: string;
  timestamp?: string;
}

export interface FacebookLoginResult {
  status: 'connected' | 'not_authorized' | 'unknown' | 'error';
  authResponse?: FacebookAuthResponse;
  embeddedData?: WhatsAppEmbeddedSignupData;
  error?: string;
}

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  pictureUrl?: string;
}

let isSdkLoading = false;
let isSdkLoaded = false;
let loadedAppId: string | null = null;
const pendingInitResolvers: Array<(ready: boolean) => void> = [];

function flushPendingResolvers(ready: boolean) {
  while (pendingInitResolvers.length > 0) {
    const resolveFn = pendingInitResolvers.shift();
    resolveFn?.(ready);
  }
}

/**
 * Carrega e inicializa o Facebook JavaScript SDK
 */
export function initFacebookSdk(appId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    const effectiveAppId = (appId || process.env.NEXT_PUBLIC_META_APP_ID || '').trim();

    // Se já foi inicializado para o mesmo App ID
    if (window.FB && isSdkLoaded && (!effectiveAppId || loadedAppId === effectiveAppId)) {
      return resolve(true);
    }

    // Se o SDK já está no window (ex: troca de App ID em runtime), reinicializa diretamente
    if (window.FB) {
      window.FB.init({
        appId: effectiveAppId,
        cookie: true,
        xfbml: true,
        version: META_GRAPH_API_VERSION,
      });
      isSdkLoaded = true;
      isSdkLoading = false;
      loadedAppId = effectiveAppId || null;
      console.log(
        `[Facebook SDK] Inicializado (${META_GRAPH_API_VERSION}) para App ID:`,
        effectiveAppId || '(env)'
      );
      return resolve(true);
    }

    pendingInitResolvers.push(resolve);

    window.fbAsyncInit = function () {
      if (!window.FB) {
        isSdkLoading = false;
        flushPendingResolvers(false);
        return;
      }

      window.FB.init({
        appId: effectiveAppId,
        cookie: true,
        xfbml: true,
        version: META_GRAPH_API_VERSION,
      });

      isSdkLoaded = true;
      isSdkLoading = false;
      loadedAppId = effectiveAppId || null;
      console.log(
        `[Facebook SDK] Inicializado (${META_GRAPH_API_VERSION}) para App ID:`,
        effectiveAppId || '(env)'
      );
      flushPendingResolvers(true);
    };

    if (isSdkLoading) {
      return;
    }

    isSdkLoading = true;

    // Injeta o script se ainda não estiver presente no DOM
    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const js = document.createElement('script');
      js.id = scriptId;
      js.src = 'https://connect.facebook.net/pt_BR/sdk.js';
      js.async = true;
      js.defer = true;
      js.crossOrigin = 'anonymous';
      js.onload = () => {
        if (window.FB && !isSdkLoaded) {
          window.fbAsyncInit?.();
        }
      };
      js.onerror = (e) => {
        console.error('[Facebook SDK] Falha ao carregar script do SDK:', e);
        isSdkLoading = false;
        flushPendingResolvers(false);
      };
      document.body.appendChild(js);
    }
  });
}

/**
 * Executa o Login com Facebook solicitando permissões de WhatsApp e Perfil
 */
export function loginWithFacebook(
  scope: string = 'whatsapp_business_management,whatsapp_business_messaging'
): Promise<FacebookLoginResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.FB) {
      return resolve({
        status: 'error',
        error: 'Facebook SDK não está pronto. Verifique o Meta App ID.',
      });
    }

    try {
      window.FB.login(
        (response: FacebookLoginResult) => {
          if (response && response.authResponse) {
            resolve({
              status: 'connected',
              authResponse: response.authResponse,
            });
          } else {
            resolve({
              status: response?.status || 'unknown',
              error: 'O usuário cancelou o login ou não concedeu as permissões necessárias.',
            });
          }
        },
        {
          scope,
          return_scopes: true,
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      resolve({ status: 'error', error: msg });
    }
  });
}

function normalizeEmbeddedSignupPayload(payload: Record<string, unknown>): WhatsAppEmbeddedSignupData {
  const rawData =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : payload;

  const eventType =
    typeof payload.event === 'string'
      ? payload.event
      : typeof rawData.event === 'string'
        ? rawData.event
        : undefined;

  const messagingAccountIds = Array.isArray(rawData.messaging_account_ids)
    ? rawData.messaging_account_ids.map(String)
    : undefined;

  const primaryWaacIds = Array.isArray(rawData.primary_waac_ids)
    ? rawData.primary_waac_ids.map(String)
    : undefined;

  const resolvedWabaId =
    (typeof rawData.waba_id === 'string' && rawData.waba_id) ||
    messagingAccountIds?.[0] ||
    undefined;

  const isOnBizApp =
    typeof rawData.is_on_biz_app === 'boolean' ? rawData.is_on_biz_app : undefined;

  const isCoexistence =
    eventType === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' || isOnBizApp === true;

  return {
    event: eventType,
    phone_number_id:
      typeof rawData.phone_number_id === 'string' ? rawData.phone_number_id : undefined,
    waba_id: resolvedWabaId,
    business_id: typeof rawData.business_id === 'string' ? rawData.business_id : undefined,
    is_on_biz_app: isOnBizApp,
    is_coexistence: isCoexistence,
    messaging_account_ids: messagingAccountIds,
    primary_waac_ids: primaryWaacIds,
    current_step: typeof rawData.current_step === 'string' ? rawData.current_step : undefined,
    error_message: typeof rawData.error_message === 'string' ? rawData.error_message : undefined,
    error_id: typeof rawData.error_id === 'string' ? rawData.error_id : undefined,
    session_id: typeof rawData.session_id === 'string' ? rawData.session_id : undefined,
    timestamp: typeof rawData.timestamp === 'string' ? rawData.timestamp : undefined,
  };
}

function isFinishEmbeddedEvent(data?: WhatsAppEmbeddedSignupData): boolean {
  return Boolean(data?.event && data.event.startsWith('FINISH'));
}

/**
 * Inicia o fluxo oficial de Onboarding Embutido (Meta WhatsApp Embedded Signup v4)
 * Com suporte a Coexistência (whatsapp_business_app_onboarding) habilitada por padrão.
 */
export function launchWhatsAppEmbeddedSignup(options: {
  configId?: string;
  coexistence?: boolean;
  onEmbeddedEvent?: (data: WhatsAppEmbeddedSignupData) => void;
}): Promise<FacebookLoginResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.FB) {
      return resolve({
        status: 'error',
        error: 'Facebook SDK não está carregado.',
      });
    }

    const enableCoexistence = options.coexistence !== false;
    let capturedEmbeddedData: WhatsAppEmbeddedSignupData | undefined;
    let finishWaitResolver: (() => void) | null = null;

    // Ouvinte para mensagens pós-janela do Embedded Signup enviadas pela Meta
    const messageListener = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload && payload.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('[Meta Embedded Signup Event]', payload);
          const normalized = normalizeEmbeddedSignupPayload(payload as Record<string, unknown>);
          const definedEntries = Object.entries(normalized).filter(([, v]) => v !== undefined);
          capturedEmbeddedData = {
            ...capturedEmbeddedData,
            ...Object.fromEntries(definedEntries),
          };
          // Garante consistência caso eventos sucessivos tenham vindo em ordem diferente
          if (
            capturedEmbeddedData.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' ||
            capturedEmbeddedData.is_on_biz_app === true
          ) {
            capturedEmbeddedData.is_coexistence = true;
          }

          if (options.onEmbeddedEvent && capturedEmbeddedData) {
            options.onEmbeddedEvent(capturedEmbeddedData);
          }

          if (isFinishEmbeddedEvent(capturedEmbeddedData) && finishWaitResolver) {
            finishWaitResolver();
            finishWaitResolver = null;
          }
        }
      } catch {
        // Ignora mensagens que não sejam JSON da Meta
      }
    };

    window.addEventListener('message', messageListener);

    const extras: Record<string, unknown> = {
      setup: {},
      version: 'v4',
      sessionInfoVersion: '3',
    };
    if (enableCoexistence) {
      extras.featureType = 'whatsapp_business_app_onboarding';
    }

    const loginOptions: Record<string, unknown> = {
      response_type: 'code',
      override_default_response_type: true,
      extras,
    };

    const trimmedConfigId = options.configId?.trim();
    if (trimmedConfigId) {
      loginOptions.config_id = trimmedConfigId;
    } else {
      loginOptions.scope = 'whatsapp_business_management,whatsapp_business_messaging';
    }

    try {
      window.FB.login(function (response: FacebookLoginResult) {
        let completed = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const finalize = (result: FacebookLoginResult) => {
          if (completed) return;
          completed = true;
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          finishWaitResolver = null;
          window.removeEventListener('message', messageListener);
          resolve(result);
        };

        if (response && response.authResponse) {
          const authResponse = response.authResponse;
          if (isFinishEmbeddedEvent(capturedEmbeddedData)) {
            finalize({
              status: 'connected',
              authResponse,
              embeddedData: capturedEmbeddedData,
            });
            return;
          }

          // Aguarda até 1500ms caso o postMessage FINISH* chegue logo após o callback do FB.login
          finishWaitResolver = () => {
            finalize({
              status: 'connected',
              authResponse,
              embeddedData: capturedEmbeddedData,
            });
          };
          timeoutId = setTimeout(() => {
            finalize({
              status: 'connected',
              authResponse,
              embeddedData: capturedEmbeddedData,
            });
          }, 1500);
        } else {
          let errorText = 'Fluxo de Onboarding de WhatsApp cancelado pelo usuário.';
          if (capturedEmbeddedData?.error_message) {
            errorText = `Erro no Onboarding WhatsApp: ${capturedEmbeddedData.error_message}${
              capturedEmbeddedData.current_step
                ? ` (etapa: ${capturedEmbeddedData.current_step})`
                : ''
            }`;
          } else if (capturedEmbeddedData?.current_step) {
            errorText = `Fluxo de Onboarding de WhatsApp cancelado na etapa "${capturedEmbeddedData.current_step}".`;
          }

          finalize({
            status: response?.status || 'unknown',
            error: errorText,
            embeddedData: capturedEmbeddedData,
          });
        }
      }, loginOptions);
    } catch (err: unknown) {
      finishWaitResolver = null;
      window.removeEventListener('message', messageListener);
      const msg = err instanceof Error ? err.message : String(err);
      resolve({ status: 'error', error: msg, embeddedData: capturedEmbeddedData });
    }
  });
}

/**
 * Busca dados do perfil do usuário logado via Graph API
 */
export function getFacebookUserProfile(): Promise<FacebookUserProfile | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.FB) {
      return resolve(null);
    }

    try {
      window.FB.api(
        '/me',
        { fields: 'id,name,email,picture.width(150).height(150)' },
        (res: any) => {
          if (!res || res.error) {
            console.warn('[Facebook SDK] Erro ao buscar /me:', res?.error);
            return resolve(null);
          }

          resolve({
            id: res.id,
            name: res.name || 'Usuário Meta',
            email: res.email || undefined,
            pictureUrl: res.picture?.data?.url || undefined,
          });
        }
      );
    } catch (e) {
      console.warn('[Facebook SDK] Exceção ao buscar /me:', e);
      resolve(null);
    }
  });
}
