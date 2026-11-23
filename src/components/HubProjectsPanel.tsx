'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Layers,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  Webhook,
} from 'lucide-react';
import type { PublicWhatsAppAccount } from '@/app/api/meta/auth/route';

export interface HubProjectItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  apiKeyPrefix: string;
  webhookUrl?: string;
  webhookSecret: string;
  allowedOrigins: string[];
  defaultPhoneNumberId?: string;
  status: 'active' | 'paused';
  accounts: PublicWhatsAppAccount[];
  createdAt: string;
  updatedAt: string;
}

export default function HubProjectsPanel() {
  const [projects, setProjects] = useState<HubProjectItem[]>([]);
  const [accounts, setAccounts] = useState<PublicWhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSecret, setCreatedSecret] = useState<{
    projectName: string;
    apiKey: string;
    webhookSecret: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingWebhooks, setEditingWebhooks] = useState<Record<string, string>>({});

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/projects');
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Falha ao carregar projetos');
        return;
      }
      const list = Array.isArray(data.projects) ? (data.projects as HubProjectItem[]) : [];
      setProjects(list);
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      const whMap: Record<string, string> = {};
      list.forEach((p) => {
        whMap[p.id] = p.webhookUrl || '';
      });
      setEditingWebhooks(whMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao listar projetos');
    } finally {
      setLoading(false);
    }
  }, []);

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
    setCreating(true);
    setError('');
    try {
      const resp = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          webhookUrl: webhookUrl.trim() || undefined,
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
        webhookSecret: data.project.webhookSecret,
      });
      setName('');
      setSlug('');
      setWebhookUrl('');
      await loadProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveWebhook = async (projectId: string) => {
    const resp = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: editingWebhooks[projectId] || '' }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setError(data.error || 'Erro ao salvar webhook');
      return;
    }
    await loadProjects();
  };

  const handleRotateKey = async (project: HubProjectItem) => {
    if (!confirm(`Gerar nova API Key para "${project.name}"? A chave anterior deixará de funcionar.`)) {
      return;
    }
    const resp = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
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
      webhookSecret: project.webhookSecret,
    });
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
      setError(data.error || 'Erro ao vincular número ao projeto');
      return;
    }
    await loadProjects();
  };

  const handleDelete = async (project: HubProjectItem) => {
    if (!confirm(`Excluir projeto "${project.name}"?`)) return;
    const resp = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
      method: 'DELETE',
    });
    if (resp.ok) await loadProjects();
  };

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://automatas.tech';

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Hub de Projetos & API Keys</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Crie projetos externos (como Nardelli Usinagem), gere API Keys e roteie números e webhooks da Meta pelo mesmo App Tech Provider.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProjects}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
          {error}
        </div>
      )}

      {createdSecret && (
        <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Credenciais geradas para {createdSecret.projectName} — copie agora!
            </div>
            <button
              type="button"
              onClick={() => setCreatedSecret(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">API Key do Projeto (x-api-key)</div>
              <div className="flex items-center justify-between gap-2 font-mono text-emerald-300 break-all">
                <span>{createdSecret.apiKey}</span>
                <button
                  type="button"
                  onClick={() => copyText(createdSecret.apiKey, 'created_api_key')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                >
                  {copiedId === 'created_api_key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Webhook Secret (HMAC X-Automatas-Signature)</div>
              <div className="flex items-center justify-between gap-2 font-mono text-blue-300 break-all">
                <span>{createdSecret.webhookSecret}</span>
                <button
                  type="button"
                  onClick={() => copyText(createdSecret.webhookSecret, 'created_wh_secret')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                >
                  {copiedId === 'created_wh_secret' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
            <span>Link direto para conectar WhatsApp do cliente:</span>
            <code className="px-2 py-1 rounded bg-slate-950 text-blue-300 font-mono break-all">
              {`${siteOrigin}/conectar?apiKey=${createdSecret.apiKey}`}
            </code>
            <button
              type="button"
              onClick={() => copyText(`${siteOrigin}/conectar?apiKey=${createdSecret.apiKey}`, 'created_link')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]"
            >
              {copiedId === 'created_link' ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>
      )}

      {/* Formulário: Novo Projeto */}
      <form
        onSubmit={handleCreate}
        className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3"
      >
        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-400" />
          Criar Novo Projeto no Hub
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do projeto (ex: Nardelli Usinagem)"
            required
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug opcional (ex: nardelli)"
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="URL Webhook destino (ex: https://orcamento.nardelliusinagem.com/api/webhook/meta)"
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Gerando API Key...' : 'Criar Projeto & Gerar API Key'}</span>
          </button>
        </div>
      </form>

      {/* Lista de Projetos */}
      <div className="grid grid-cols-1 gap-4">
        {projects.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Nenhum projeto cadastrado ainda. Crie o primeiro projeto acima para gerar uma API Key.
          </div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl border border-slate-800 bg-slate-900/70 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
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
                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>
                      API Key: <code className="text-blue-300 font-mono">{p.apiKeyPrefix}</code>
                    </span>
                    <span>
                      Webhook Secret:{' '}
                      <code className="text-slate-300 font-mono">{p.webhookSecret}</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleRotateKey(p)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Nova API Key</span>
                  </button>
                  <a
                    href={`/conectar`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-[11px] text-blue-300 border border-blue-500/30 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Portal /conectar</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* URL de Webhook destino */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                  <Webhook className="w-3.5 h-3.5 text-blue-400" />
                  <span>Webhook Destino:</span>
                </div>
                <input
                  type="url"
                  value={editingWebhooks[p.id] ?? ''}
                  onChange={(e) =>
                    setEditingWebhooks((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  placeholder="https://orcamento.nardelliusinagem.com/api/webhook/meta"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveWebhook(p.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                >
                  Salvar Webhook
                </button>
              </div>

              {/* Números vinculados ao projeto */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    Números WhatsApp Roteados ({p.accounts.length})
                  </span>
                  {accounts.length > 0 && (
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
                      <option value="">+ Vincular número já conectado...</option>
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
                    Nenhum número vinculado ainda. Vincule acima ou abra <code className="text-slate-300">/conectar</code> com a API Key deste projeto.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {p.accounts.map((acc) => (
                      <div
                        key={acc.phoneNumberId}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center gap-2"
                      >
                        <span className="text-emerald-400 font-semibold">
                          {acc.displayPhoneNumber || acc.phoneNumberId}
                        </span>
                        <span className="text-slate-500">({acc.phoneNumberId})</span>
                        {acc.isCoexistence && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">
                            Coex
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAssignPhone(p.id, acc.phoneNumberId, true)}
                          className="text-red-400 hover:text-red-300 ml-1"
                          title="Desvincular número deste projeto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
