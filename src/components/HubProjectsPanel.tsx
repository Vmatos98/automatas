'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Crown,
  ExternalLink,
  Instagram,
  KeyRound,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Webhook,
} from 'lucide-react';
import type { PublicWhatsAppAccount } from '@/app/api/meta/auth/route';
import type { PublicInstagramAccount } from './InstagramWorkspacePanel';
import type { PublicSaasAccount } from './FinancialDashboardPanel';

export interface HubProjectItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  apiKeyPrefix: string;
  loginJwt: string;
  loginJwtVersion: number;
  ownerAccountId?: string;
  webhookUrl?: string;
  instagramWebhookUrl?: string;
  webhookSecret: string;
  allowedOrigins: string[];
  defaultPhoneNumberId?: string;
  defaultIgUserId?: string;
  status: 'active' | 'paused';
  accounts: PublicWhatsAppAccount[];
  instagramAccounts: PublicInstagramAccount[];
  createdAt: string;
  updatedAt: string;
}

interface HubProjectsPanelProps {
  mode?: 'admin' | 'agency' | 'client';
  projectJwt?: string;
  accountJwt?: string;
  onAccountUpdated?: (acc: PublicSaasAccount) => void;
}

export default function HubProjectsPanel({
  mode = 'admin',
  projectJwt,
  accountJwt,
  onAccountUpdated,
}: HubProjectsPanelProps) {
  const [projects, setProjects] = useState<HubProjectItem[]>([]);
  const [accounts, setAccounts] = useState<PublicWhatsAppAccount[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<PublicInstagramAccount[]>([]);
  const [agencyAccount, setAgencyAccount] = useState<PublicSaasAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createdSecret, setCreatedSecret] = useState<{
    projectName: string;
    apiKey?: string;
    loginJwt: string;
    webhookSecret: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [instagramWebhookUrl, setInstagramWebhookUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingWebhooks, setEditingWebhooks] = useState<
    Record<string, { whatsapp: string; instagram: string }>
  >({});
  const [guideTab, setGuideTab] = useState<'setup' | 'send' | 'webhook'>('setup');

  const canManageProjects = mode === 'admin' || mode === 'agency';
  const allowedChannels =
    mode === 'agency' && agencyAccount
      ? agencyAccount.billing.allowedChannels
      : (['whatsapp', 'instagram'] as Array<'whatsapp' | 'instagram'>);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'client') {
        if (!projectJwt) return;
        const resp = await fetch('/api/hub/dashboard', {
          headers: { 'x-project-jwt': projectJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success || !data.project) {
          setError(data.error || 'Falha ao carregar dados do projeto');
          return;
        }
        const single: HubProjectItem = {
          ...data.project,
          allowedOrigins: [],
          accounts: data.whatsapp?.accounts || [],
          instagramAccounts: data.instagram?.accounts || [],
          createdAt: '',
          updatedAt: '',
        };
        setProjects([single]);
        setAccounts(single.accounts);
        setInstagramAccounts(single.instagramAccounts);
        setEditingWebhooks({
          [single.id]: {
            whatsapp: single.webhookUrl || '',
            instagram: single.instagramWebhookUrl || '',
          },
        });
        return;
      }

      if (mode === 'agency') {
        if (!accountJwt) return;
        const resp = await fetch('/api/billing/projects', {
          headers: { 'x-account-jwt': accountJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Falha ao carregar seus projetos');
          return;
        }
        const list = Array.isArray(data.projects) ? (data.projects as HubProjectItem[]) : [];
        setProjects(list);
        if (data.account) {
          setAgencyAccount(data.account);
          onAccountUpdated?.(data.account);
        }
        const whMap: Record<string, { whatsapp: string; instagram: string }> = {};
        list.forEach((p) => {
          whMap[p.id] = {
            whatsapp: p.webhookUrl || '',
            instagram: p.instagramWebhookUrl || '',
          };
        });
        setEditingWebhooks(whMap);
        return;
      }

      const resp = await fetch('/api/projects', { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Falha ao carregar projetos');
        return;
      }
      const list = Array.isArray(data.projects) ? (data.projects as HubProjectItem[]) : [];
      setProjects(list);
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setInstagramAccounts(Array.isArray(data.instagramAccounts) ? data.instagramAccounts : []);
      const whMap: Record<string, { whatsapp: string; instagram: string }> = {};
      list.forEach((p) => {
        whMap[p.id] = {
          whatsapp: p.webhookUrl || '',
          instagram: p.instagramWebhookUrl || '',
        };
      });
      setEditingWebhooks(whMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao listar projetos');
    } finally {
      setLoading(false);
    }
  }, [mode, projectJwt, accountJwt, onAccountUpdated]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Aviso transparente para agência se ultrapassar o limite incluso
    if (
      mode === 'agency' &&
      agencyAccount &&
      !agencyAccount.isExempt &&
      agencyAccount.billing.currentProjects >= agencyAccount.billing.includedProjects
    ) {
      const unitLabel =
        agencyAccount.billingCycle === 'YEARLY' ? 'R$ 8,00/mês (R$ 96/ano)' : 'R$ 10,00/mês';
      if (
        !confirm(
          `Você já atingiu o limite de ${agencyAccount.billing.includedProjects} projetos inclusos no plano ${agencyAccount.billing.plan.name}.\n\nCriar este projeto adicionará +${unitLabel} na sua assinatura Asaas. Deseja continuar?`
        )
      ) {
        return;
      }
    }

    setCreating(true);
    setError('');
    setNotice('');
    try {
      const resp =
        mode === 'agency'
          ? await fetch('/api/billing/projects', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-account-jwt': accountJwt || '',
              },
              body: JSON.stringify({
                action: 'create',
                name: name.trim(),
                slug: slug.trim() || undefined,
                webhookUrl: webhookUrl.trim() || undefined,
                instagramWebhookUrl: instagramWebhookUrl.trim() || undefined,
              }),
            })
          : await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: name.trim(),
                slug: slug.trim() || undefined,
                webhookUrl: webhookUrl.trim() || undefined,
                instagramWebhookUrl: instagramWebhookUrl.trim() || undefined,
              }),
            });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao criar projeto');
        return;
      }
      setCreatedSecret({
        projectName: data.project.name,
        apiKey: data.apiKey,
        loginJwt: data.loginJwt || data.project.loginJwt,
        webhookSecret: data.project.webhookSecret,
      });
      if (data.overageApplied) {
        setNotice(
          'Projeto criado! Como ultrapassou a franquia inclusa, o valor adicional de projeto extra foi atualizado no Financeiro / Asaas.'
        );
      }
      setName('');
      setSlug('');
      setWebhookUrl('');
      setInstagramWebhookUrl('');
      await loadProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveWebhooks = async (projectId: string) => {
    setError('');
    setNotice('');
    const current = editingWebhooks[projectId] || { whatsapp: '', instagram: '' };
    const resp =
      mode === 'client'
        ? await fetch('/api/hub/dashboard', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-project-jwt': projectJwt || '',
            },
            body: JSON.stringify({
              webhookUrl: current.whatsapp,
              instagramWebhookUrl: current.instagram,
            }),
          })
        : mode === 'agency'
          ? await fetch('/api/billing/projects', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-account-jwt': accountJwt || '',
              },
              body: JSON.stringify({
                projectId,
                webhookUrl: current.whatsapp,
                instagramWebhookUrl: current.instagram,
              }),
            })
          : await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                webhookUrl: current.whatsapp,
                instagramWebhookUrl: current.instagram,
              }),
            });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setError(data.error || 'Erro ao salvar webhooks');
      return;
    }
    setNotice('Webhooks salvos com sucesso!');
    await loadProjects();
  };

  const handleRotateKey = async (project: HubProjectItem) => {
    if (!confirm(`Gerar nova API Key secreta para "${project.name}"? A chave anterior deixará de funcionar.`)) {
      return;
    }
    const resp =
      mode === 'agency'
        ? await fetch('/api/billing/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-account-jwt': accountJwt || '',
            },
            body: JSON.stringify({ action: 'rotate-key', projectId: project.id }),
          })
        : await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rotate-key' }),
          });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setError(data.error || 'Erro ao rotacionar API Key');
      return;
    }
    setCreatedSecret({
      projectName: project.name,
      apiKey: data.apiKey,
      loginJwt: project.loginJwt,
      webhookSecret: project.webhookSecret,
    });
    await loadProjects();
  };

  const handleRotateJwt = async (project: HubProjectItem) => {
    if (
      !confirm(
        `Revogar e gerar novo JWT de Login/Popup para "${project.name}"? Links com o JWT antigo pararão de funcionar.`
      )
    ) {
      return;
    }
    const resp =
      mode === 'agency'
        ? await fetch('/api/billing/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-account-jwt': accountJwt || '',
            },
            body: JSON.stringify({ action: 'rotate-jwt', projectId: project.id }),
          })
        : await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rotate-jwt' }),
          });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setError(data.error || 'Erro ao rotacionar JWT');
      return;
    }
    setNotice(`Novo JWT v${data.project?.loginJwtVersion || ''} gerado para ${project.name}!`);
    await loadProjects();
  };

  const handleAssignPhone = async (projectId: string, phoneNumberId: string, unassign = false) => {
    if (!phoneNumberId) return;
    const resp = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign-phone', phoneNumberId, unassign }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setError(data.error || 'Erro ao vincular número WhatsApp');
      return;
    }
    await loadProjects();
  };

  const handleAssignInstagram = async (projectId: string, igUserId: string, unassign = false) => {
    if (!igUserId) return;
    const resp = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign-instagram', igUserId, unassign }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setError(data.error || 'Erro ao vincular conta Instagram');
      return;
    }
    await loadProjects();
  };

  const handleDelete = async (project: HubProjectItem) => {
    if (!confirm(`Remover o projeto "${project.name}"?`)) return;
    const resp =
      mode === 'agency'
        ? await fetch(`/api/billing/projects?projectId=${encodeURIComponent(project.id)}`, {
            method: 'DELETE',
            headers: { 'x-account-jwt': accountJwt || '' },
          })
        : await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
            method: 'DELETE',
          });
    if (resp.ok) {
      setNotice(`Projeto "${project.name}" removido com sucesso.`);
      await loadProjects();
    }
  };

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://automatas.tech';

  const openRemotePopupTest = (jwt: string, channel: 'whatsapp' | 'instagram' | 'both') => {
    const popupUrl = `${siteOrigin}/conectar?token=${encodeURIComponent(jwt)}&channel=${channel}&returnOrigin=${encodeURIComponent(siteOrigin)}`;
    const popup = window.open(
      popupUrl,
      'AutomatasRemoteConnect',
      'width=520,height=740,menubar=no,toolbar=no,location=yes,status=no'
    );
    if (!popup) {
      setError('O navegador bloqueou o popup. Permita popups para testar a mini-tela remota.');
      return;
    }
    const handler = (ev: MessageEvent) => {
      if (ev.origin === siteOrigin && ev.data?.type === 'AUTOMATAS_HUB_CONNECTED') {
        setNotice(
          `✅ Retorno postMessage recebido do Popup Remoto! Canal "${ev.data.channel || channel}" conectado com sucesso.`
        );
        window.removeEventListener('message', handler);
        loadProjects();
      }
    };
    window.addEventListener('message', handler);
  };

  const buildPopupSnippet = (jwt: string, channel: 'whatsapp' | 'instagram') =>
    `// Abrir mini-tela segura de conexão (${channel.toUpperCase()}) sem expor sua API Key:\n` +
    `window.open('${siteOrigin}/conectar?token=${jwt}&channel=${channel}', 'AutomatasConnect', 'width=520,height=720');\n` +
    `window.addEventListener('message', (e) => {\n` +
    `  if (e.origin === '${siteOrigin}' && e.data?.type === 'AUTOMATAS_HUB_CONNECTED') {\n` +
    `    console.log('Canal conectado:', e.data);\n` +
    `  }\n` +
    `});`;

  const isOverLimit =
    mode === 'agency' &&
    agencyAccount &&
    !agencyAccount.isExempt &&
    agencyAccount.billing.currentProjects >= agencyAccount.billing.includedProjects;

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
      <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              {mode === 'client'
                ? 'Configurações & Webhooks do Projeto'
                : mode === 'agency'
                  ? 'Gerenciamento dos Meus Projetos'
                  : 'Hub de Projetos, Chaves JWT & API Keys'}
            </h2>
            {mode === 'admin' && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Admin Isento (R$ 0,00 / Ilimitado)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'client'
              ? 'Gerencie os webhooks de WhatsApp e Instagram do seu projeto e integre a mini-tela popup Embedded Signup na sua aplicação.'
              : mode === 'agency'
                ? 'Adicione projetos para seus clientes, remova projetos antigos e gere as chaves JWT + API Key de cada cliente.'
                : 'Crie projetos ilimitados sem custo para seus clientes ou gerencie projetos das agências pagantes.'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadProjects}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Medidor de Franquia de Projetos (Modo Agência / Cliente Pagante) */}
      {mode === 'agency' && agencyAccount && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isOverLimit
              ? 'bg-amber-950/25 border-amber-500/35 text-amber-100'
              : 'bg-slate-900/70 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isOverLimit ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <strong>
                Franquia do Plano {agencyAccount.billing.plan.name}:{' '}
                {agencyAccount.billing.currentProjects} /{' '}
                {agencyAccount.isExempt ? '∞' : agencyAccount.billing.includedProjects} projetos inclusos
              </strong>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {agencyAccount.isExempt
                  ? 'Conta isenta — projetos ilimitados sem custo adicional.'
                  : isOverLimit
                    ? `Limite incluso atingido. Cada novo projeto adiciona +${
                        agencyAccount.billingCycle === 'YEARLY' ? 'R$ 8/mês (R$ 96/ano)' : 'R$ 10/mês'
                      } automaticamente na assinatura Asaas.`
                    : `Você ainda pode criar ${
                        agencyAccount.billing.includedProjects - agencyAccount.billing.currentProjects
                      } projeto(s) sem custo adicional.`}
              </div>
            </div>
          </div>
          {agencyAccount.billing.extraProjects > 0 && (
            <span className="px-3 py-1 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 font-semibold whitespace-nowrap">
              +{agencyAccount.billing.extraProjects} projeto(s) extra(s) ativo(s)
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
          {error}
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
          {notice}
        </div>
      )}

      {createdSecret && (
        <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Credenciais geradas para {createdSecret.projectName} — copie e entregue ao cliente!
            </div>
            <button
              type="button"
              onClick={() => setCreatedSecret(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {createdSecret.apiKey && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">
                  1. API Key Secreta (Backend • header <code className="text-slate-300">x-api-key</code>)
                </div>
                <div className="flex items-center justify-between gap-2 font-mono text-emerald-300 break-all">
                  <span>{createdSecret.apiKey}</span>
                  <button
                    type="button"
                    onClick={() => copyText(createdSecret.apiKey!, 'created_api_key')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 cursor-pointer"
                  >
                    {copiedId === 'created_api_key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">
                2. Chave JWT de Login &amp; Popup Embedded Signup (Painel + /conectar)
              </div>
              <div className="flex items-center justify-between gap-2 font-mono text-blue-300 break-all text-[11px]">
                <span className="truncate">{createdSecret.loginJwt}</span>
                <button
                  type="button"
                  onClick={() => copyText(createdSecret.loginJwt, 'created_jwt')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 cursor-pointer"
                >
                  {copiedId === 'created_jwt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
            <span>Webhook Secret (HMAC):</span>
            <code className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-mono">
              {createdSecret.webhookSecret}
            </code>
          </div>
        </div>
      )}

      {/* Formulário: Novo Projeto (Admin ou Agência) */}
      {canManageProjects && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3"
        >
          <div className="text-xs font-bold text-slate-200 flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Adicionar Novo Projeto / Cliente
            </span>
            {isOverLimit && (
              <span className="text-[11px] text-amber-300 font-normal">
                +Projeto adicional (+R$ 10/mês ou +R$ 8/mês anual)
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome (ex: AcheiComprei, Cliente X)"
              required
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Slug opcional (ex: cliente-x)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
            {allowedChannels.includes('whatsapp') && (
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="Webhook WhatsApp (opcional)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            )}
            {allowedChannels.includes('instagram') && (
              <input
                type="url"
                value={instagramWebhookUrl}
                onChange={(e) => setInstagramWebhookUrl(e.target.value)}
                placeholder="Webhook Instagram (opcional)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500"
              />
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{creating ? 'Gerando Chaves...' : 'Criar Projeto (JWT + API Key)'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Projetos */}
      <div className="grid grid-cols-1 gap-4">
        {projects.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Nenhum projeto cadastrado ainda. Crie o primeiro projeto acima para gerar as chaves JWT e API Key.
          </div>
        ) : (
          projects.map((p) => {
            const popupWaUrl = `${siteOrigin}/conectar?token=${encodeURIComponent(p.loginJwt)}&channel=whatsapp`;
            const popupIgUrl = `${siteOrigin}/conectar?token=${encodeURIComponent(p.loginJwt)}&channel=instagram`;

            return (
              <div
                key={p.id}
                className="p-5 rounded-3xl border border-slate-800 bg-slate-900/70 space-y-4"
              >
                {/* Header do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{p.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.slug}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          p.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {p.status === 'active' ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex flex-wrap items-center gap-3">
                      <span>
                        API Key: <code className="text-emerald-300 font-mono">{p.apiKeyPrefix}</code>
                      </span>
                      <span>
                        JWT v{p.loginJwtVersion}:{' '}
                        <code className="text-blue-300 font-mono">{p.loginJwt.slice(0, 22)}...</code>
                      </span>
                      <span>
                        Webhook Secret:{' '}
                        <code className="text-amber-300 font-mono">{p.webhookSecret}</code>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => copyText(p.loginJwt, `jwt_${p.id}`)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-[11px] text-blue-300 border border-blue-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `jwt_${p.id}` ? <Check className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      <span>{copiedId === `jwt_${p.id}` ? 'JWT Copiado!' : 'Copiar Login JWT'}</span>
                    </button>

                    {canManageProjects && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRotateJwt(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 cursor-pointer"
                          title="Revogar JWT atual e gerar novo"
                        >
                          Rotacionar JWT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotateKey(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Nova API Key</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 cursor-pointer"
                          title="Remover projeto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Mini-Tela Popup Embeds (respeita canais liberados no plano) */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    Mini-Tela Popup de Conexão (embutir em apps de terceiros com o JWT):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openRemotePopupTest(p.loginJwt, 'both')}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-[11px] text-blue-200 border border-blue-500/40 font-semibold flex items-center gap-1.5 cursor-pointer"
                      title="Abre a mini-tela exatamente como um sistema terceiro faz via window.open"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Testar Mini-Tela Popup (Remoto)</span>
                    </button>
                    {allowedChannels.includes('whatsapp') && (
                      <>
                        <button
                          type="button"
                          onClick={() => openRemotePopupTest(p.loginJwt, 'whatsapp')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-[11px] text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>Popup WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(buildPopupSnippet(p.loginJwt, 'whatsapp'), `snip_wa_${p.id}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `snip_wa_${p.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Code2 className="w-3 h-3" />}
                          <span>{copiedId === `snip_wa_${p.id}` ? 'Código Copiado!' : 'Snippet JS WhatsApp'}</span>
                        </button>
                      </>
                    )}

                    {allowedChannels.includes('instagram') && (
                      <>
                        <button
                          type="button"
                          onClick={() => openRemotePopupTest(p.loginJwt, 'instagram')}
                          className="px-2.5 py-1.5 rounded-xl bg-fuchsia-600/15 hover:bg-fuchsia-600/25 text-[11px] text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>Popup Instagram</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(buildPopupSnippet(p.loginJwt, 'instagram'), `snip_ig_${p.id}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `snip_ig_${p.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Code2 className="w-3 h-3" />}
                          <span>{copiedId === `snip_ig_${p.id}` ? 'Código Copiado!' : 'Snippet JS Instagram'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Webhooks Separados: WhatsApp e Instagram */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {allowedChannels.includes('whatsapp') && (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Webhook className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Webhook WhatsApp Destino</span>
                      </label>
                      <input
                        type="url"
                        value={editingWebhooks[p.id]?.whatsapp ?? ''}
                        onChange={(e) =>
                          setEditingWebhooks((prev) => ({
                            ...prev,
                            [p.id]: {
                              whatsapp: e.target.value,
                              instagram: prev[p.id]?.instagram ?? '',
                            },
                          }))
                        }
                        placeholder="https://seu-sistema.com/api/webhook/whatsapp"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                  {allowedChannels.includes('instagram') && (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Webhook className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span>Webhook Instagram Destino</span>
                      </label>
                      <input
                        type="url"
                        value={editingWebhooks[p.id]?.instagram ?? ''}
                        onChange={(e) =>
                          setEditingWebhooks((prev) => ({
                            ...prev,
                            [p.id]: {
                              whatsapp: prev[p.id]?.whatsapp ?? '',
                              instagram: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://autocortes.automatas.tech/webhook/instagram-acheicomprei"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveWebhooks(p.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 border border-slate-700 cursor-pointer"
                  >
                    Salvar Webhooks do Projeto
                  </button>
                </div>

                {/* Canais Vinculados: WhatsApp + Instagram lado a lado */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {allowedChannels.includes('whatsapp') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          Números WhatsApp ({p.accounts.length})
                        </span>
                        {mode === 'admin' && accounts.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignPhone(p.id, e.target.value, false);
                                e.target.value = '';
                              }
                            }}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-200"
                          >
                            <option value="">+ Vincular WhatsApp...</option>
                            {accounts.map((acc) => (
                              <option key={acc.phoneNumberId} value={acc.phoneNumberId}>
                                {acc.displayPhoneNumber || acc.phoneNumberId} ({acc.verifiedName || 'WA'})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {p.accounts.length === 0 ? (
                        <div className="text-[11px] text-slate-500">
                          Nenhum número WhatsApp vinculado.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.accounts.map((acc) => (
                            <div
                              key={acc.phoneNumberId}
                              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center gap-1.5"
                            >
                              <span className="text-emerald-400 font-semibold">
                                {acc.displayPhoneNumber || acc.phoneNumberId}
                              </span>
                              {mode === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleAssignPhone(p.id, acc.phoneNumberId, true)}
                                  className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                                  title="Desvincular"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {allowedChannels.includes('instagram') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Instagram className="w-3.5 h-3.5 text-fuchsia-400" />
                          Contas Instagram ({p.instagramAccounts?.length || 0})
                        </span>
                        {mode === 'admin' && instagramAccounts.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignInstagram(p.id, e.target.value, false);
                                e.target.value = '';
                              }
                            }}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-200"
                          >
                            <option value="">+ Vincular Instagram...</option>
                            {instagramAccounts.map((ig) => (
                              <option key={ig.igUserId} value={ig.igUserId}>
                                @{ig.username || ig.igUserId}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {!p.instagramAccounts || p.instagramAccounts.length === 0 ? (
                        <div className="text-[11px] text-slate-500">
                          Nenhuma conta Instagram vinculada.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.instagramAccounts.map((ig) => (
                            <div
                              key={ig.igUserId}
                              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-fuchsia-500/25 text-[11px] flex items-center gap-1.5"
                            >
                              <span className="text-fuchsia-300 font-semibold">
                                @{ig.username || ig.igUserId}
                              </span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                ({ig.igUserId})
                              </span>
                              {mode === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleAssignInstagram(p.id, ig.igUserId, true)}
                                  className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                                  title="Desvincular"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Guia de Implementação Bridge API (Configuração, Payloads Texto/Mídia e Webhook) */}
      <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/65 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              Guia de Implementação da Ponte (Token, API Key, Mídias &amp; Webhook)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Padrão oficial de comunicação entre o sistema do cliente, a Automatas e a Meta.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {[
              { id: 'setup' as const, label: '1. Configurar & Token' },
              { id: 'send' as const, label: '2. Enviar (Texto & Mídia)' },
              { id: 'webhook' as const, label: '3. Receber Webhook' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGuideTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  guideTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {guideTab === 'setup' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="font-bold text-blue-300">1. Token JWT (Embedded Signup)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                O <strong>Login JWT</strong> valida o projeto e abre a tela de onboarding da Meta para o cliente conectar seu número WhatsApp ou conta Instagram:
              </p>
              <code className="block p-2 rounded-lg bg-slate-900 text-[10px] text-blue-200 break-all font-mono">
                https://automatas.tech/conectar?token=SEU_LOGIN_JWT&amp;channel=whatsapp
              </code>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="font-bold text-emerald-300">2. API Key (Enviar Mensagens)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Guarde sua <strong>API Key</strong> (<code className="text-emerald-300">aut_live_...</code>) no backend do seu sistema e envie no header de toda requisição:
              </p>
              <code className="block p-2 rounded-lg bg-slate-900 text-[10px] text-emerald-200 break-all font-mono">
                x-api-key: aut_live_SUA_CHAVE
              </code>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="font-bold text-amber-300">3. Webhook (Receber Eventos)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cadastre sua URL de destino no projeto acima e valide o header{' '}
                <code className="text-amber-300">X-Automatas-Signature</code> usando o{' '}
                <strong>Webhook Secret</strong> do projeto.
              </p>
            </div>
          </div>
        )}

        {guideTab === 'send' && (
          <div className="space-y-3 text-xs">
            <div className="text-[11px] text-slate-300">
              Endpoint Base: <code className="text-blue-300 font-mono">https://api.automatas.tech/api/hub</code>{' '}
              • Header obrigatório: <code className="text-emerald-300 font-mono">x-api-key: aut_live_...</code>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-[11px]">
                    Enviar Texto — POST /api/hub/messages/send
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `curl -X POST https://api.automatas.tech/api/hub/messages/send \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: aut_live_SUA_API_KEY" \\\n  -d '{"to":"5511999999999","text":"Olá! Mensagem via Automatas Hub."}'`,
                        'guide_send_text'
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'guide_send_text' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'guide_send_text' ? 'Copiado' : 'Copiar cURL'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-[10px] text-slate-200 overflow-x-auto font-mono leading-relaxed">
{`{
  "to": "5511999999999",
  "text": "Olá! Tudo bem?",
  "replyToMessageId": "wamid.opcional",
  "phoneNumberId": "opcional_se_tiver_1_numero"
}`}
                </pre>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 text-[11px]">
                    Enviar Mídia — POST /api/hub/messages/media
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `curl -X POST https://api.automatas.tech/api/hub/messages/media \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: aut_live_SUA_API_KEY" \\\n  -d '{"to":"5511999999999","type":"image","mediaUrl":"https://exemplo.com/foto.jpg","caption":"Legenda opcional"}'`,
                        'guide_send_media'
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'guide_send_media' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'guide_send_media' ? 'Copiado' : 'Copiar cURL'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-[10px] text-slate-200 overflow-x-auto font-mono leading-relaxed">
{`{
  "to": "5511999999999",
  "type": "image | video | audio | document | sticker",
  "mediaUrl": "https://seu-dominio.com/arquivo.pdf",
  "caption": "Legenda (image/video/document)",
  "filename": "contrato.pdf"
}`}
                </pre>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-200">Outros endpoints suportados:</strong>{' '}
              <code className="text-purple-300">POST /api/hub/messages/template</code> (templates aprovados),{' '}
              <code className="text-emerald-300">POST /api/hub/messages/read</code> (marcar lida),{' '}
              <code className="text-blue-300">GET /api/hub/media/:mediaId</code> (baixar mídia recebida) e{' '}
              <code className="text-fuchsia-300">POST /api/hub/instagram/dm</code> (Direct Instagram).
            </div>
          </div>
        )}

        {guideTab === 'webhook' && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
              <div className="font-bold text-amber-300">Headers enviados pela Automatas no POST para o seu Webhook:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-300 pt-1">
                <div>• X-Automatas-Hub: 1</div>
                <div>• X-Automatas-Channel: whatsapp | instagram</div>
                <div>• X-Automatas-Project-Id: id_do_projeto</div>
                <div>• X-Automatas-Signature: sha256=HMAC_HEX</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-[11px]">
                  Exemplo de Receptor Webhook (Node.js / Express + Validação HMAC)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      `import crypto from 'crypto';\n\napp.post('/api/webhook/whatsapp', express.raw({ type: 'application/json' }), (req, res) => {\n  const sig = req.headers['x-automatas-signature'];\n  const expected = 'sha256=' + crypto\n    .createHmac('sha256', process.env.AUTOMATAS_WEBHOOK_SECRET)\n    .update(req.body)\n    .digest('hex');\n\n  if (sig !== expected) return res.status(401).send('Assinatura inválida');\n\n  const payload = JSON.parse(req.body.toString('utf8'));\n  const value = payload?.entry?.[0]?.changes?.[0]?.value;\n  const msg = value?.messages?.[0];\n  if (msg) {\n    console.log('Recebido de:', msg.from, 'Tipo:', msg.type, 'Texto:', msg.text?.body);\n  }\n  res.sendStatus(200);\n});`,
                      'guide_webhook_node'
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'guide_webhook_node' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'guide_webhook_node' ? 'Copiado' : 'Copiar Código'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-slate-900 text-[10px] text-slate-200 overflow-x-auto font-mono leading-relaxed">
{`// Payload encaminhado = formato oficial Meta Cloud API:
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "metadata": { "phone_number_id": "123456789" },
        "contacts": [{ "wa_id": "5511999999999", "profile": { "name": "Cliente" } }],
        "messages": [{ "from": "5511999999999", "id": "wamid...", "type": "text", "text": { "body": "Oi!" } }]
      }
    }]
  }]
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
