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
} from 'lucide-react';
import {
  getFacebookUserProfile,
  initFacebookSdk,
  launchWhatsAppEmbeddedSignup,
  loginWithFacebook,
} from '@/lib/facebookSdk';

interface HubProjectInfo {
  id: string;
  slug: string;
  name: string;
  webhookUrl?: string;
}

function ConectarHubContent() {
  const searchParams = useSearchParams();
  const initialKey = searchParams.get('apiKey') || '';
  const returnOrigin = searchParams.get('returnOrigin') || '*';
  const defaultCoex = searchParams.get('coexistence') !== '0';

  const [apiKey, setApiKey] = useState(initialKey);
  const [project, setProject] = useState<HubProjectInfo | null>(null);
  const [appId, setAppId] = useState(process.env.NEXT_PUBLIC_META_APP_ID || '');
  const [configId, setConfigId] = useState(process.env.NEXT_PUBLIC_META_CONFIG_ID || '');
  const [coexistence, setCoexistence] = useState(defaultCoex);
  const [loadingProject, setLoadingProject] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validarProjeto = async (keyToValidate: string) => {
    const clean = keyToValidate.trim();
    if (!clean) {
      setProject(null);
      return;
    }
    setLoadingProject(true);
    setError('');
    try {
      const resp = await fetch(`/api/hub/connect?apiKey=${encodeURIComponent(clean)}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setProject(null);
        setError(data.error || 'API Key inválida ou projeto pausado.');
        return;
      }
      setProject(data.project);
      if (data.appId) setAppId(data.appId);
      if (data.configId) setConfigId(data.configId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao validar projeto no Hub.');
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    if (initialKey) {
      validarProjeto(initialKey);
    }
  }, [initialKey]);

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

  const handleConectarEmbedded = async () => {
    if (!project || !apiKey.trim()) {
      setError('Valide uma API Key de projeto antes de conectar.');
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
            apiKey: apiKey.trim(),
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
        notifyOpener({ type: 'AUTOMATAS_HUB_CONNECTED', ...saveData });
        setTimeout(() => {
          if (window.opener) window.close();
        }, 1600);
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
        setError(res.error || 'Onboarding não concluído na Meta.');
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
          apiKey: apiKey.trim(),
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
      notifyOpener({ type: 'AUTOMATAS_HUB_CONNECTED', ...saveData });
      setTimeout(() => {
        if (window.opener) window.close();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao conectar com a Meta.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Automatas Tech • Hub WhatsApp</h1>
              <p className="text-xs text-slate-400">
                Conexão oficial Meta Cloud API para projetos externos
              </p>
            </div>
          </div>
          <Link
            href="/app"
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/70"
          >
            Painel
          </Link>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            API Key do Projeto (aut_live_...)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="aut_live_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => validarProjeto(apiKey)}
              disabled={loadingProject}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 border border-slate-700"
            >
              {loadingProject ? 'Validando...' : 'Validar'}
            </button>
          </div>
        </div>

        {project && (
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Projeto identificado: {project.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                {project.slug}
              </span>
            </div>
            {project.webhookUrl && (
              <div className="text-[11px] text-slate-400 truncate">
                Webhook destino: <span className="font-mono text-slate-300">{project.webhookUrl}</span>
              </div>
            )}
          </div>
        )}

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

        <button
          type="button"
          onClick={handleConectarEmbedded}
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

        <p className="text-[11px] text-center text-slate-500">
          O login ocorre diretamente no domínio autorizado da <strong>automatas.tech</strong> e encaminha o canal conectado para o seu projeto.
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
