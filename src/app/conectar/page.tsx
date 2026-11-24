'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Smartphone,
  ShieldCheck,
  Loader2,
  Instagram,
} from 'lucide-react';
import {
  getFacebookUserProfile,
  initFacebookSdk,
  launchInstagramUnifiedLogin,
  launchWhatsAppEmbeddedSignup,
  loginWithFacebook,
} from '@/lib/facebookSdk';

interface HubProjectInfo {
  id: string;
  slug: string;
  name: string;
  webhookUrl?: string;
  instagramWebhookUrl?: string;
}

type ConnectChannel = 'whatsapp' | 'instagram' | 'both';

function ConectarHubContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || searchParams.get('apiKey') || '';
  const returnOrigin = searchParams.get('returnOrigin') || '*';
  const defaultCoex = searchParams.get('coexistence') !== '0';
  const rawChannel = (searchParams.get('channel') || 'both').toLowerCase();
  const initialChannel: ConnectChannel =
    rawChannel === 'whatsapp' || rawChannel === 'instagram' ? rawChannel : 'both';

  const [credential, setCredential] = useState(initialToken);
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'instagram'>(
    initialChannel === 'instagram' ? 'instagram' : 'whatsapp'
  );
  const [project, setProject] = useState<HubProjectInfo | null>(null);
  const [authKind, setAuthKind] = useState<'project_jwt' | 'api_key' | null>(null);
  const [appId, setAppId] = useState(process.env.NEXT_PUBLIC_META_APP_ID || '');
  const [configId, setConfigId] = useState(process.env.NEXT_PUBLIC_META_CONFIG_ID || '');
  const [instagramConfigId, setInstagramConfigId] = useState(
    process.env.NEXT_PUBLIC_META_IG_CONFIG_ID || '2221685615392715'
  );
  const [coexistence, setCoexistence] = useState(defaultCoex);
  const [loadingProject, setLoadingProject] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isPreAuthenticated = Boolean(initialToken && project);

  const validarProjeto = async (credToValidate: string) => {
    const clean = credToValidate.trim();
    if (!clean) {
      setProject(null);
      return;
    }
    setLoadingProject(true);
    setError('');
    try {
      const paramName = clean.split('.').length === 3 ? 'token' : 'apiKey';
      const resp = await fetch(`/api/hub/connect?${paramName}=${encodeURIComponent(clean)}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setProject(null);
        setError(data.error || 'Chave JWT ou API Key inválida ou projeto pausado.');
        return;
      }
      setProject(data.project);
      setAuthKind(data.authKind || (paramName === 'token' ? 'project_jwt' : 'api_key'));
      if (data.appId) setAppId(data.appId);
      if (data.configId) setConfigId(data.configId);
      if (data.instagramConfigId) setInstagramConfigId(data.instagramConfigId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao validar projeto no Hub.');
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      validarProjeto(initialToken);
    }
  }, [initialToken]);

  const notifyOpener = (payload: Record<string, unknown>) => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, returnOrigin || '*');
      }
    } catch {
      try {
        window.opener?.postMessage(payload, '*');
      } catch {}
    }
  };

  const handleConectarWhatsApp = async () => {
    if (!project || !credential.trim()) {
      setError('Valide a chave JWT ou API Key do projeto antes de conectar.');
      return;
    }
    if (!appId.trim()) {
      setError('META_APP_ID não configurado no Hub automatas.tech.');
      return;
    }

    setConnecting(true);
    setError('');
    setSuccessMsg('');

    try {
      await initFacebookSdk(appId);

      if (!configId.trim()) {
        const fbRes = await loginWithFacebook(
          'whatsapp_business_management,whatsapp_business_messaging,business_management'
        );
        if (fbRes.status !== 'connected' || !fbRes.authResponse?.accessToken) {
          setError(fbRes.error || 'Login com Facebook cancelado.');
          return;
        }
        const profile = await getFacebookUserProfile();
        const saveRes = await fetch('/api/hub/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: credential.trim(),
            channel: 'whatsapp',
            authType: 'facebook_login',
            userId: profile?.id || fbRes.authResponse.userID,
            userName: profile?.name || 'Usuário Facebook',
            userEmail: profile?.email || null,
            accessToken: fbRes.authResponse.accessToken,
            isCoexistence: coexistence,
            onboardingMode: coexistence ? 'coexistence' : 'standard',
          }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok || !saveData.success) {
          setError(saveData.error || 'Falha ao vincular número no Hub.');
          return;
        }
        setSuccessMsg('Número(s) WhatsApp conectado(s) ao projeto com sucesso!');
        notifyOpener({ type: 'AUTOMATAS_HUB_CONNECTED', channel: 'whatsapp', ...saveData });
        setTimeout(() => {
          if (window.opener) window.close();
        }, 1500);
        return;
      }

      const res = await launchWhatsAppEmbeddedSignup({
        configId,
        coexistence,
      });

      const emb = res.embeddedData;
      const hasAssets = Boolean(
        emb?.event?.startsWith('FINISH') || emb?.waba_id || emb?.phone_number_id
      );

      if (res.status !== 'connected' || !res.authResponse || !hasAssets) {
        setError(res.error || 'Onboarding WhatsApp não concluído na Meta.');
        return;
      }

      const profile = await getFacebookUserProfile();
      const isCoex = Boolean(
        emb?.is_coexistence ||
          emb?.is_on_biz_app ||
          emb?.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' ||
          (coexistence && emb?.event !== 'FINISH' && emb?.event !== 'FINISH_ONLY_WABA')
      );

      const saveRes = await fetch('/api/hub/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credential.trim(),
          channel: 'whatsapp',
          authType: 'embedded_signup',
          userId: profile?.id || res.authResponse.userID,
          userName: profile?.name || 'WhatsApp Business Integrado',
          userEmail: profile?.email || null,
          code: res.authResponse.code,
          accessToken: res.authResponse.accessToken,
          phoneNumberId: emb?.phone_number_id,
          wabaId: emb?.waba_id,
          businessId: emb?.business_id,
          isCoexistence: isCoex,
          onboardingMode: isCoex ? 'coexistence' : 'standard',
          embeddedEvent: emb?.event,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        setError(saveData.error || 'Falha ao vincular conta no Hub.');
        return;
      }

      setSuccessMsg(
        `WhatsApp conectado ao projeto "${project.name}"! Você já pode fechar esta janela.`
      );
      notifyOpener({ type: 'AUTOMATAS_HUB_CONNECTED', channel: 'whatsapp', ...saveData });
      setTimeout(() => {
        if (window.opener) window.close();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao conectar WhatsApp.');
    } finally {
      setConnecting(false);
    }
  };

  const handleConectarInstagram = async () => {
    if (!project || !credential.trim()) {
      setError('Valide a chave JWT ou API Key do projeto antes de conectar.');
      return;
    }
    if (!appId.trim()) {
      setError('META_APP_ID não configurado no Hub automatas.tech.');
      return;
    }

    setConnecting(true);
    setError('');
    setSuccessMsg('');

    try {
      await initFacebookSdk(appId);
      const res = await launchInstagramUnifiedLogin({ configId: instagramConfigId });
      if (res.status !== 'connected' || !res.authResponse) {
        setError(res.error || 'Login Unificado do Instagram cancelado.');
        return;
      }

      const saveRes = await fetch('/api/hub/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credential.trim(),
          channel: 'instagram',
          authType: 'unified_login',
          code: res.authResponse.code,
          accessToken: res.authResponse.accessToken,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        setError(saveData.error || 'Falha ao vincular conta Instagram no Hub.');
        return;
      }

      setSuccessMsg(
        `Instagram conectado ao projeto "${project.name}"! Você já pode fechar esta janela.`
      );
      notifyOpener({ type: 'AUTOMATAS_HUB_CONNECTED', channel: 'instagram', ...saveData });
      setTimeout(() => {
        if (window.opener) window.close();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao conectar Instagram.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Automatas Tech • Conectar Canal</h1>
              <p className="text-xs text-slate-400">
                Onboarding oficial Meta (WhatsApp &amp; Instagram)
              </p>
            </div>
          </div>
          {!isPreAuthenticated && (
            <Link
              href="/app"
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/70"
            >
              Painel
            </Link>
          )}
        </div>

        {/* Se o popup já abriu com ?token=JWT válido, oculta o campo manual para UX limpa */}
        {!isPreAuthenticated && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Chave JWT do Projeto (recomendado) ou API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="eyJ... (JWT) ou aut_live_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => validarProjeto(credential)}
                disabled={loadingProject}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 border border-slate-700 cursor-pointer"
              >
                {loadingProject ? 'Validando...' : 'Validar'}
              </button>
            </div>
          </div>
        )}

        {loadingProject && !project && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Validando credencial do projeto...</span>
          </div>
        )}

        {project && (
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Projeto autenticado: {project.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                {authKind === 'project_jwt' ? 'JWT Verificado' : project.slug}
              </span>
            </div>
            {(project.webhookUrl || project.instagramWebhookUrl) && (
              <div className="text-[11px] text-slate-400 truncate">
                Webhook ativo:{' '}
                <span className="font-mono text-slate-300">
                  {activeChannel === 'instagram'
                    ? project.instagramWebhookUrl || project.webhookUrl
                    : project.webhookUrl}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Seletor de canal quando aberto em modo ?channel=both */}
        {initialChannel === 'both' && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveChannel('whatsapp');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp Business</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveChannel('instagram');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeChannel === 'instagram'
                  ? 'bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram Profissional</span>
            </button>
          </div>
        )}

        {activeChannel === 'whatsapp' ? (
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={coexistence}
              onChange={(e) => setCoexistence(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 text-blue-600"
            />
            <div>
              <div className="text-xs font-semibold text-slate-100">
                Modo Coexistência (WhatsApp Business App + Cloud API)
              </div>
              <div className="text-[11px] text-slate-400">
                Permite continuar usando o WhatsApp Business no celular simultaneamente ao sistema.
              </div>
            </div>
          </label>
        ) : (
          <div className="p-3.5 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/25 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-fuchsia-300">
              Login Unificado da API do Instagram (SUAT)
            </div>
            <p className="text-slate-400">
              Autorize sua conta Comercial ou de Criador do Instagram para receber webhooks de
              comentários/DMs, responder automaticamente e publicar Reels via Automatas Hub.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeChannel === 'whatsapp' ? (
          <button
            type="button"
            onClick={handleConectarWhatsApp}
            disabled={connecting || !project}
            className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
            <span>
              {connecting ? 'Abrindo Meta / Facebook...' : 'Conectar WhatsApp com Facebook'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConectarInstagram}
            disabled={connecting || !project}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity cursor-pointer"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Instagram className="w-4 h-4" />
            )}
            <span>
              {connecting ? 'Abrindo Login Unificado Meta...' : 'Conectar Instagram Profissional'}
            </span>
          </button>
        )}

        <p className="text-[11px] text-center text-slate-500">
          O login ocorre com segurança no domínio autorizado <strong>automatas.tech</strong> e
          notifica automaticamente o sistema de origem via{' '}
          <code className="text-slate-400">postMessage</code>.
        </p>
      </div>
    </div>
  );
}

export default function ConectarHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-xs">
          Carregando portal de conexão Automatas Hub...
        </div>
      }
    >
      <ConectarHubContent />
    </Suspense>
  );
}
