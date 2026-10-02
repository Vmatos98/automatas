// Facebook JavaScript SDK & Meta WhatsApp Embedded Signup Helper

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

export interface FacebookLoginResult {
  status: 'connected' | 'not_authorized' | 'unknown' | 'error';
  authResponse?: FacebookAuthResponse;
  error?: string;
}

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  pictureUrl?: string;
}

export interface WhatsAppEmbeddedSignupData {
  phone_number_id?: string;
  waba_id?: string;
  current_step?: string;
  error_message?: string;
}

let isSdkLoading = false;
let isSdkLoaded = false;

/**
 * Carrega e inicializa o Facebook JavaScript SDK
 */
export function initFacebookSdk(appId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    // Se já foi inicializado
    if (window.FB && isSdkLoaded) {
      return resolve(true);
    }

    window.fbAsyncInit = function () {
      if (!window.FB) return resolve(false);

      window.FB.init({
        appId: appId || process.env.NEXT_PUBLIC_META_APP_ID || '',
        cookie: true,
        xfbml: true,
        version: 'v20.0',
      });

      isSdkLoaded = true;
      console.log('[Facebook SDK] Inicializado com sucesso para App ID:', appId || '(env)');
      resolve(true);
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
        resolve(false);
      };
      document.body.appendChild(js);
    } else if (window.FB) {
      window.fbAsyncInit?.();
    }
  });
}

/**
 * Executa o Login com Facebook solicitando permissões de WhatsApp e Perfil
 */
export function loginWithFacebook(
  scope: string = 'whatsapp_business_management,whatsapp_business_messaging,public_profile,email'
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

/**
 * Inicia o fluxo oficial de Onboarding Embutido (Meta WhatsApp Embedded Signup)
 */
export function launchWhatsAppEmbeddedSignup(options: {
  configId?: string;
  onEmbeddedEvent?: (data: WhatsAppEmbeddedSignupData) => void;
}): Promise<FacebookLoginResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.FB) {
      return resolve({
        status: 'error',
        error: 'Facebook SDK não está carregado.',
      });
    }

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
          if (options.onEmbeddedEvent) {
            options.onEmbeddedEvent(payload.data || payload);
          }
        }
      } catch {
        // Ignora mensagens que não sejam JSON da Meta
      }
    };

    window.addEventListener('message', messageListener);

    const loginOptions: Record<string, unknown> = {
      scope: 'whatsapp_business_management,whatsapp_business_messaging',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        feature: 'whatsapp_embedded_signup',
        version: 2,
        sessionInfoVersion: 2,
      },
    };

    if (options.configId && options.configId.trim()) {
      loginOptions.config_id = options.configId.trim();
    }

    try {
      window.FB.login((response: FacebookLoginResult) => {
        // Remover listener após término do login
        setTimeout(() => {
          window.removeEventListener('message', messageListener);
        }, 15000);

        if (response && response.authResponse) {
          resolve({
            status: 'connected',
            authResponse: response.authResponse,
          });
        } else {
          resolve({
            status: response?.status || 'unknown',
            error: 'Fluxo de Onboarding de WhatsApp cancelado pelo usuário.',
          });
        }
      }, loginOptions);
    } catch (err: unknown) {
      window.removeEventListener('message', messageListener);
      const msg = err instanceof Error ? err.message : String(err);
      resolve({ status: 'error', error: msg });
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
