'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Instagram,
  RefreshCw,
  Send,
  MessageCircle,
  MessageSquare,
  Plus,
  Trash2,
  Video,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { initFacebookSdk, launchInstagramUnifiedLogin } from '@/lib/facebookSdk';

const MOCK_IG_ACCOUNTS: PublicInstagramAccount[] = [
  {
    igUserId: '17841480418262513',
    username: 'acheicompreiofertas2026',
    name: 'Achei Comprei Ofertas',
    authType: 'unified_login',
    webhookSubscribed: true,
    status: 'active',
    connectedAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    igUserId: '17841400991234567',
    username: 'automatas.tech',
    name: 'Automatas Tech Oficial',
    authType: 'unified_login',
    webhookSubscribed: true,
    status: 'active',
    connectedAt: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_IG_EVENTS: InstagramEventItem[] = [
  {
    id: 'demo_cmt_1',
    igUserId: '17841480418262513',
    eventType: 'comment',
    direction: 'inbound',
    senderId: '98234100231',
    senderUsername: 'juliana.santos',
    mediaId: '1802291182301',
    commentId: 'demo_cmt_1',
    text: 'QUERO! Me manda o link do produto 42 😍🔥',
    status: 'received',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'demo_rep_1',
    igUserId: '17841480418262513',
    eventType: 'reply',
    direction: 'outbound',
    commentId: 'demo_cmt_1',
    text: 'Oi @juliana.santos! Acabei de te enviar o link direto da oferta #42 no seu Direct 💌',
    status: 'sent',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'demo_dm_1',
    igUserId: '17841480418262513',
    eventType: 'dm',
    direction: 'outbound',
    senderId: '98234100231',
    commentId: 'demo_cmt_1',
    text: 'Olá Juliana! Aqui está o link promocional da oferta #42 (Fone Bluetooth ANC): https://acheicompreilinks.shop/?c=42 🔥',
    status: 'sent',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'demo_cmt_2',
    igUserId: '17841480418262513',
    eventType: 'comment',
    direction: 'inbound',
    senderId: '88341299104',
    senderUsername: 'carlos_edu.tech',
    mediaId: '1802291182301',
    commentId: 'demo_cmt_2',
    text: 'LINK por favor!! Esse preço ainda tá valendo hoje?',
    status: 'received',
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
  },
  {
    id: 'demo_dm_2',
    igUserId: '17841480418262513',
    eventType: 'dm',
    direction: 'inbound',
    senderId: '77192038411',
    senderUsername: 'mariana.ofertas',
    text: 'Oi! Vi o Reel da cafeteira portátil, vocês têm cupom pra Shopee também?',
    status: 'received',
    timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
  },
  {
    id: 'demo_cmt_3',
    igUserId: '17841400991234567',
    eventType: 'comment',
    direction: 'inbound',
    senderId: '66291044312',
    senderUsername: 'agencia.impulso',
    mediaId: '1809981234512',
    commentId: 'demo_cmt_3',
    text: 'Quero testar a API Omnichannel pros meus clientes de WhatsApp + Insta!',
    status: 'received',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

export interface PublicInstagramAccount {
  igUserId: string;
  username?: string;
  name?: string;
  profilePictureUrl?: string;
  pageId?: string;
  authType: string;
  webhookSubscribed: boolean;
  status: string;
  projectId?: string;
  connectedAt: string;
  updatedAt: string;
}

export interface InstagramEventItem {
  id: string;
  igUserId: string;
  eventType: 'comment' | 'dm' | 'reply';
  direction: 'inbound' | 'outbound';
  senderId?: string;
  senderUsername?: string;
  mediaId?: string;
  commentId?: string;
  text: string;
  status: string;
  timestamp: string;
}

interface InstagramWorkspacePanelProps {
  mode: 'admin' | 'agency' | 'client';
  projectJwt?: string;
  accountJwt?: string;
  metaAppId?: string;
  onRefreshParent?: () => void;
}

export default function InstagramWorkspacePanel({
  mode,
  projectJwt,
  accountJwt,
  metaAppId,
  onRefreshParent,
}: InstagramWorkspacePanelProps) {
  const [accounts, setAccounts] = useState<PublicInstagramAccount[]>([]);
  const [events, setEvents] = useState<InstagramEventItem[]>([]);
  const [selectedIgId, setSelectedIgId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'comment' | 'dm'>('all');
  const [appId, setAppId] = useState(metaAppId || process.env.NEXT_PUBLIC_META_APP_ID || '');
  const [igConfigId, setIgConfigId] = useState(
    process.env.NEXT_PUBLIC_META_IG_CONFIG_ID || '2221685615392715'
  );

  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [demoEvents, setDemoEvents] = useState<InstagramEventItem[]>(MOCK_IG_EVENTS);

  // Form: conexão manual via token da Meta
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualIgId, setManualIgId] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [manualToken, setManualToken] = useState('');

  // Form: resposta inline em comentário ou DM
  const [activeReplyTarget, setActiveReplyTarget] = useState<{
    kind: 'public_comment' | 'private_reply' | 'dm';
    event: InstagramEventItem;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Form: publicar Reel
  const [showReelForm, setShowReelForm] = useState(false);
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [publishingReel, setPublishingReel] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'agency') {
        if (!accountJwt) return;
        const resp = await fetch('/api/billing?scope=workspace', {
          headers: { 'x-account-jwt': accountJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Erro ao carregar dados do Instagram da sua conta.');
          return;
        }
        setAccounts(data.instagram?.accounts || []);
        setEvents(data.instagram?.events || []);
        if (data.appId) setAppId(data.appId);
        if (data.instagramConfigId) setIgConfigId(data.instagramConfigId);
        return;
      }

      if (mode === 'client') {
        if (!projectJwt) return;
        const qs = selectedIgId !== 'all' ? `?igUserId=${encodeURIComponent(selectedIgId)}` : '';
        const resp = await fetch(`/api/hub/dashboard${qs}`, {
          headers: { 'x-project-jwt': projectJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Erro ao carregar dados do Instagram do projeto.');
          return;
        }
        setAccounts(data.instagram?.accounts || []);
        setEvents(data.instagram?.events || []);
        if (data.appId) setAppId(data.appId);
        if (data.instagramConfigId) setIgConfigId(data.instagramConfigId);
      } else {
        const qs = selectedIgId !== 'all' ? `?igUserId=${encodeURIComponent(selectedIgId)}` : '';
        const resp = await fetch(`/api/instagram${qs}`, { cache: 'no-store' });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Erro ao carregar visão geral do Instagram.');
          return;
        }
        setAccounts(data.accounts || []);
        setEvents(data.events || []);
        if ((data.accounts || []).length > 0 || (data.events || []).length > 0) {
          setDemoMode(false);
        }
        if (data.appId) setAppId(data.appId);
        if (data.instagramConfigId) setIgConfigId(data.instagramConfigId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha de rede ao consultar Instagram.');
    } finally {
      setLoading(false);
    }
  }, [mode, projectJwt, accountJwt, selectedIgId]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleUnifiedLogin = async () => {
    if (!appId.trim()) {
      setError('META_APP_ID não configurado.');
      return;
    }
    setConnecting(true);
    setError('');
    setNotice('');
    try {
      await initFacebookSdk(appId);
      const res = await launchInstagramUnifiedLogin({ configId: igConfigId });
      if (res.status !== 'connected' || !res.authResponse) {
        setError(res.error || 'Login Unificado do Instagram cancelado.');
        return;
      }

      const payload = {
        code: res.authResponse.code,
        accessToken: res.authResponse.accessToken,
        authType: 'unified_login',
      };

      const resp =
        mode === 'client'
          ? await fetch('/api/hub/dashboard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-project-jwt': projectJwt || '',
              },
              body: JSON.stringify({ action: 'instagram-onboard', ...payload }),
            })
          : await fetch('/api/instagram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'onboard', ...payload }),
            });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Falha ao vincular conta do Instagram.');
        return;
      }
      setNotice('Conta do Instagram conectada com sucesso via Login Unificado!');
      await loadData();
      onRefreshParent?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar Instagram.');
    } finally {
      setConnecting(false);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIgId.trim() || !manualToken.trim()) {
      setError('Informe o ID da conta Instagram (ex: 17841480418262513) e o Access Token.');
      return;
    }
    setConnecting(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        igUserId: manualIgId.trim(),
        username: manualUsername.trim() || undefined,
        accessToken: manualToken.trim(),
        authType: 'manual_token',
      };
      const resp =
        mode === 'client'
          ? await fetch('/api/hub/dashboard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-project-jwt': projectJwt || '',
              },
              body: JSON.stringify({ action: 'instagram-onboard', ...payload }),
            })
          : await fetch('/api/instagram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'onboard', ...payload }),
            });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao salvar conta manual do Instagram.');
        return;
      }
      setNotice('Conta Instagram registrada e pronta para receber webhooks e responder!');
      setManualIgId('');
      setManualUsername('');
      setManualToken('');
      setShowManualForm(false);
      await loadData();
      onRefreshParent?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar conta manual.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (igUserId: string) => {
    if (isShowingDemo) {
      setNotice('Esta é uma conta simulada de Preview Demo. Clique em "Desativar Demo" para ocultar.');
      return;
    }
    if (!confirm(`Desconectar conta Instagram ${igUserId}?`)) return;
    try {
      if (mode === 'client') {
        await fetch('/api/hub/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-jwt': projectJwt || '',
          },
          body: JSON.stringify({ action: 'instagram-disconnect', igUserId }),
        });
      } else {
        await fetch(`/api/instagram?igUserId=${encodeURIComponent(igUserId)}`, {
          method: 'DELETE',
        });
      }
      await loadData();
      onRefreshParent?.();
    } catch {}
  };

  const isShowingDemo = demoMode && accounts.length === 0 && events.length === 0;
  const displayedAccounts = isShowingDemo ? MOCK_IG_ACCOUNTS : accounts;
  const rawDisplayedEvents = isShowingDemo ? demoEvents : events;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyTarget || !replyText.trim()) return;
    setSendingReply(true);
    setError('');
    setNotice('');
    try {
      const { kind, event } = activeReplyTarget;
      const isPublic = kind === 'public_comment';

      if (isShowingDemo) {
        const mockOut: InstagramEventItem = {
          id: `demo_out_${Date.now()}`,
          igUserId: event.igUserId,
          eventType: isPublic ? 'reply' : 'dm',
          direction: 'outbound',
          senderId: event.senderId,
          commentId: event.commentId,
          text: replyText.trim(),
          status: 'sent',
          timestamp: new Date().toISOString(),
        };
        setDemoEvents((prev) => [mockOut, ...prev]);
        setNotice(
          isPublic
            ? '[Preview Demo] Resposta pública simulada no comentário!'
            : '[Preview Demo] Direct (DM / Private Reply) simulado com sucesso!'
        );
        setReplyText('');
        setActiveReplyTarget(null);
        return;
      }

      const bodyPayload = isPublic
        ? { igUserId: event.igUserId, commentId: event.commentId || event.id, message: replyText.trim() }
        : kind === 'private_reply'
          ? { igUserId: event.igUserId, commentId: event.commentId || event.id, text: replyText.trim() }
          : { igUserId: event.igUserId, recipientId: event.senderId, text: replyText.trim() };

      const resp =
        mode === 'client'
          ? await fetch('/api/hub/dashboard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-project-jwt': projectJwt || '',
              },
              body: JSON.stringify({
                action: isPublic ? 'instagram-reply' : 'instagram-dm',
                ...bodyPayload,
              }),
            })
          : await fetch('/api/instagram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: isPublic ? 'reply' : 'dm',
                ...bodyPayload,
              }),
            });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao enviar resposta no Instagram.');
        return;
      }
      setNotice(
        isPublic
          ? 'Resposta pública publicada no comentário!'
          : 'Mensagem direta (DM) enviada no Instagram!'
      );
      setReplyText('');
      setActiveReplyTarget(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar resposta.');
    } finally {
      setSendingReply(false);
    }
  };

  const handlePublishReel = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetIgId = selectedIgId !== 'all' ? selectedIgId : accounts[0]?.igUserId;
    if (!targetIgId) {
      setError('Conecte uma conta Instagram antes de publicar um Reel.');
      return;
    }
    if (!reelVideoUrl.trim()) return;
    setPublishingReel(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        igUserId: targetIgId,
        videoUrl: reelVideoUrl.trim(),
        caption: reelCaption.trim(),
      };
      const resp =
        mode === 'client'
          ? await fetch('/api/hub/dashboard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-project-jwt': projectJwt || '',
              },
              body: JSON.stringify({ action: 'instagram-reel', ...payload }),
            })
          : await fetch('/api/instagram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'reel', ...payload }),
            });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Falha ao publicar Reel.');
        return;
      }
      setNotice(`Reel publicado com sucesso! Media ID: ${data.mediaId || data.creationId}`);
      setReelVideoUrl('');
      setReelCaption('');
      setShowReelForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar Reel.');
    } finally {
      setPublishingReel(false);
    }
  };

  const visibleEvents = rawDisplayedEvents.filter((ev) => {
    if (selectedIgId !== 'all' && ev.igUserId !== selectedIgId) return false;
    if (filterType === 'comment') return ev.eventType === 'comment' || ev.eventType === 'reply';
    if (filterType === 'dm') return ev.eventType === 'dm';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
      {/* Cabeçalho do Workspace Instagram */}
      <div className="p-5 rounded-3xl border border-fuchsia-500/20 bg-slate-900/70 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-amber-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 shrink-0">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Workspace Instagram API</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                Config ID: {igConfigId}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Webhook dedicado:{' '}
              <code className="text-fuchsia-300 font-mono">
                https://api.automatas.tech/webhook/instagram
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleUnifiedLogin}
            disabled={connecting}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Conectar Instagram (Login Unificado)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualForm((v) => !v)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Token Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReelForm((v) => !v)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Publicar Reel</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoMode((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-1.5 cursor-pointer ${
              isShowingDemo
                ? 'bg-fuchsia-600/20 border-fuchsia-500/40 text-fuchsia-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Alternar dados simulados de demonstração do Instagram"
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>{isShowingDemo ? 'Demo: ON' : 'Ver Demo'}</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Atualizar feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isShowingDemo && (
        <div className="p-3.5 rounded-2xl bg-fuchsia-950/30 border border-fuchsia-500/35 text-xs text-fuchsia-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span>
              <strong>Modo Preview (Dados Simulados):</strong> Exibindo contas e interações de
              exemplo (<code className="font-mono">@acheicompreiofertas2026</code> e{' '}
              <code className="font-mono">@automatas.tech</code>). Assim que conectar uma conta real
              ou desativar o demo, entram os eventos ao vivo.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDemoMode(false)}
            className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/40 text-[11px] font-semibold cursor-pointer"
          >
            Desativar Demo
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Form Manual (Ideal para cadastrar o token gerado direto no Meta Developer Dashboard) */}
      {showManualForm && (
        <form
          onSubmit={handleManualConnect}
          className="p-5 rounded-3xl border border-amber-500/30 bg-slate-900/80 space-y-3"
        >
          <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Conectar Conta Instagram via Token Gerado na Meta (SUAT / Teste)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={manualIgId}
              onChange={(e) => setManualIgId(e.target.value)}
              placeholder="IG User ID (ex: 17841480418262513)"
              required
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
            <input
              type="text"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              placeholder="Username opcional (ex: acheicompreiofertas2026)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
            <input
              type="password"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Access Token do Instagram (EAA... ou IGAA...)"
              required
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white cursor-pointer"
            >
              {connecting ? 'Salvando...' : 'Salvar Conta Instagram'}
            </button>
          </div>
        </form>
      )}

      {/* Form Publicar Reel */}
      {showReelForm && (
        <form
          onSubmit={handlePublishReel}
          className="p-5 rounded-3xl border border-fuchsia-500/30 bg-slate-900/80 space-y-3"
        >
          <div className="text-xs font-bold text-fuchsia-300 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Publicar Reel via Graph API (instagram_content_publish)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="url"
              value={reelVideoUrl}
              onChange={(e) => setReelVideoUrl(e.target.value)}
              placeholder="URL pública direta do vídeo .mp4"
              required
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
            <input
              type="text"
              value={reelCaption}
              onChange={(e) => setReelCaption(e.target.value)}
              placeholder="Legenda do Reel (com CTA de comentário)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReelForm(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={publishingReel}
              className="px-4 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold text-white cursor-pointer"
            >
              {publishingReel ? 'Processando e publicando...' : 'Publicar Reel Agora'}
            </button>
          </div>
        </form>
      )}

      {/* Contas Conectadas + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Sidebar: Contas Instagram */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Contas Conectadas ({displayedAccounts.length})
            </span>
            <button
              type="button"
              onClick={() => setSelectedIgId('all')}
              className={`text-[11px] px-2 py-0.5 rounded-lg cursor-pointer ${
                selectedIgId === 'all'
                  ? 'bg-fuchsia-600/25 text-fuchsia-300 border border-fuchsia-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
          </div>

          {displayedAccounts.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-2">
              <Instagram className="w-6 h-6 mx-auto text-slate-600" />
              <p>Nenhuma conta Instagram conectada ainda.</p>
              <p className="text-[11px]">
                Use <strong>Conectar Instagram</strong> ou <strong>Token Manual</strong> acima.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedAccounts.map((acc) => {
                const isSelected = selectedIgId === acc.igUserId;
                return (
                  <div
                    key={acc.igUserId}
                    onClick={() => setSelectedIgId(acc.igUserId)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-fuchsia-950/30 border-fuchsia-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        @{acc.username || acc.name || acc.igUserId}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        ID: {acc.igUserId}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                          {acc.authType === 'manual_token' ? 'Token Manual' : 'Unified Login'}
                        </span>
                        {acc.webhookSubscribed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300">
                            Webhook ON
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(acc.igUserId);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 shrink-0 cursor-pointer"
                      title="Desconectar conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feed de Eventos: Comentários & DMs */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200">
              Feed de Comentários &amp; DMs ({visibleEvents.length})
            </span>
            <div className="flex items-center gap-1.5">
              {(['all', 'comment', 'dm'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                    filterType === t
                      ? 'bg-fuchsia-600/25 text-fuchsia-300 border border-fuchsia-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'Todos' : t === 'comment' ? 'Comentários' : 'DMs'}
                </button>
              ))}
            </div>
          </div>

          {activeReplyTarget && (
            <form
              onSubmit={handleSendReply}
              className="p-3.5 rounded-2xl bg-fuchsia-950/25 border border-fuchsia-500/35 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-fuchsia-300">
                  {activeReplyTarget.kind === 'public_comment'
                    ? `Responder publicamente @${activeReplyTarget.event.senderUsername || activeReplyTarget.event.senderId}`
                    : activeReplyTarget.kind === 'private_reply'
                      ? `Enviar Private Reply (DM) no comentário de @${activeReplyTarget.event.senderUsername || activeReplyTarget.event.senderId}`
                      : `Responder DM para ${activeReplyTarget.event.senderId}`}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveReplyTarget(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Digite sua resposta..."
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fuchsia-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </form>
          )}

          {visibleEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-xs text-slate-500 space-y-1.5">
              <MessageCircle className="w-7 h-7 text-slate-700" />
              <p>Nenhum comentário ou DM recebido ainda neste filtro.</p>
              <p className="text-[11px] text-slate-600">
                Assim que a Meta enviar eventos para{' '}
                <code className="text-slate-400">/webhook/instagram</code>, eles aparecerão aqui em
                tempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {visibleEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    ev.direction === 'outbound'
                      ? 'bg-fuchsia-950/15 border-fuchsia-500/25 ml-6'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.eventType === 'dm'
                            ? 'bg-blue-500/15 text-blue-300'
                            : ev.eventType === 'reply'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-fuchsia-500/15 text-fuchsia-300'
                        }`}
                      >
                        {ev.eventType === 'dm'
                          ? 'DM'
                          : ev.eventType === 'reply'
                            ? 'Resposta'
                            : 'Comentário'}
                      </span>
                      <span className="font-semibold text-slate-200">
                        {ev.direction === 'outbound'
                          ? 'Você (Automatas)'
                          : `@${ev.senderUsername || ev.senderId || 'usuário'}`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        IG {ev.igUserId}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ev.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-slate-200 whitespace-pre-wrap">{ev.text}</p>

                  {ev.direction === 'inbound' && (
                    <div className="flex items-center gap-2 pt-1">
                      {ev.eventType === 'comment' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReplyTarget({ kind: 'public_comment', event: ev })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 text-fuchsia-400" />
                            <span>Responder Comentário</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReplyTarget({ kind: 'private_reply', event: ev })
                            }
                            className="px-2.5 py-1 rounded-lg bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-[11px] text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Private Reply (DM)</span>
                          </button>
                        </>
                      )}
                      {ev.eventType === 'dm' && ev.senderId && (
                        <button
                          type="button"
                          onClick={() => setActiveReplyTarget({ kind: 'dm', event: ev })}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-[11px] text-blue-300 border border-blue-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Responder DM</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
