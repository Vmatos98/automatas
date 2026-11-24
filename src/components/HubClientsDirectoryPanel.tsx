'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  FolderKanban,
  Instagram,
  Layers,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
  Webhook,
} from 'lucide-react';
import type { BillingCycle, PlanId, PublicSaasAccount } from './FinancialDashboardPanel';
import type { HubProjectItem } from './HubProjectsPanel';

type ClientAccountWithProjects = PublicSaasAccount & {
  projects?: HubProjectItem[];
};

function formatBRL(val: number): string {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusBadge(status: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (s === 'EXEMPT') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  if (s === 'OVERDUE' || s === 'PAUSED') return 'bg-red-500/15 text-red-300 border-red-500/30';
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

export default function HubClientsDirectoryPanel() {
  const [accounts, setAccounts] = useState<ClientAccountWithProjects[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form rápido de cadastro de cliente no Hub
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newPlan, setNewPlan] = useState<PlanId>('omnichannel');
  const [newCycle, setNewCycle] = useState<BillingCycle>('MONTHLY');
  const [newExempt, setNewExempt] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/billing?scope=admin', { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao carregar clientes do Hub.');
        return;
      }
      const list = Array.isArray(data.accounts)
        ? (data.accounts as ClientAccountWithProjects[])
        : [];
      setAccounts(list);
      setSelectedId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list[0]?.id || '';
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao listar clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {}
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setNotice('');
    try {
      const resp = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-create-account',
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword.trim(),
          cpfCnpj: newCpf.trim() || undefined,
          planId: newExempt ? 'admin_exempt' : newPlan,
          billingCycle: newCycle,
          isExempt: newExempt,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao cadastrar cliente.');
        return;
      }
      setNotice(`Cliente "${data.account.name}" cadastrado com sucesso!`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewCpf('');
      setNewExempt(false);
      setShowCreateForm(false);
      await loadClients();
      if (data.account?.id) setSelectedId(data.account.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleExempt = async (acc: ClientAccountWithProjects) => {
    const resp = await fetch('/api/billing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: acc.id,
        isExempt: !acc.isExempt,
        planId: !acc.isExempt ? 'admin_exempt' : 'omnichannel',
      }),
    });
    if (resp.ok) {
      setNotice(`Status de isenção atualizado para ${acc.name}.`);
      await loadClients();
    }
  };

  const handleChangePlan = async (acc: ClientAccountWithProjects, planId: PlanId) => {
    const resp = await fetch('/api/billing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: acc.id,
        planId,
        isExempt: planId === 'admin_exempt',
      }),
    });
    if (resp.ok) {
      setNotice(`Plano de ${acc.name} atualizado!`);
      await loadClients();
    }
  };

  const filtered = accounts.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.billing.plan.name.toLowerCase().includes(q)
    );
  });

  const selectedClient =
    filtered.find((a) => a.id === selectedId) ||
    accounts.find((a) => a.id === selectedId) ||
    null;

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://automatas.tech';

  return (
    <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Clientes Cadastrados no Hub ({accounts.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Veja o plano de cada cliente/agência e clique em qualquer conta para inspecionar todos
            os projetos, webhooks e canais vinculados a ela.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Cliente</span>
          </button>
          <button
            type="button"
            onClick={loadClients}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
          {notice}
        </div>
      )}

      {/* Form Rápido de Cadastro */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateClient}
          className="p-5 rounded-3xl border border-blue-500/30 bg-slate-900/80 space-y-3"
        >
          <div className="text-xs font-bold text-blue-300">Cadastrar Novo Cliente / Agência</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome / Agência"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
            />
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="E-mail de acesso"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Senha inicial"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
            />
            <input
              type="text"
              value={newCpf}
              onChange={(e) => setNewCpf(e.target.value)}
              placeholder="CPF / CNPJ (opcional)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
            />
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value as PlanId)}
              disabled={newExempt}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
            >
              <option value="whatsapp">API WhatsApp (R$ 20/mês)</option>
              <option value="instagram">API Instagram (R$ 20/mês)</option>
              <option value="omnichannel">Omnichannel Ambos (R$ 35/mês)</option>
            </select>
            <select
              value={newCycle}
              onChange={(e) => setNewCycle(e.target.value as BillingCycle)}
              disabled={newExempt}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual (-20% OFF)</option>
            </select>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newExempt}
                onChange={(e) => setNewExempt(e.target.checked)}
              />
              <span>Isento / Cortesia (R$ 0,00)</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
              >
                {creating ? 'Salvando...' : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Master-Detail: Lista de Clientes (Esquerda) + Projetos do Cliente Selecionado (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Coluna Esquerda: Clientes Cadastrados */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nome, e-mail ou plano..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-slate-500 space-y-2">
              <Users className="w-7 h-7 text-slate-700" />
              <p>Nenhum cliente cadastrado ainda.</p>
              <p className="text-[11px] text-slate-600">
                Clique em <strong>Novo Cliente</strong> acima ou cadastre pela tela de login.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filtered.map((acc) => {
                const isSelected = selectedClient?.id === acc.id;
                const projCount = acc.projects?.length ?? acc.billing.currentProjects;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedId(acc.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-blue-950/35 border-blue-500/60 shadow-md shadow-blue-950/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          {acc.isExempt && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${statusBadge(
                          acc.subscriptionStatus
                        )}`}
                      >
                        {acc.subscriptionStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-slate-800/70">
                      <span className="font-semibold text-blue-300">
                        {acc.billing.plan.name}
                        {!acc.isExempt && (
                          <span className="text-slate-500 font-normal">
                            {' '}
                            ({acc.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'})
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-300">
                        {projCount}/{acc.isExempt ? '∞' : acc.billing.includedProjects} proj.
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita: Detalhes + Projetos do Cliente Clicado */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col space-y-4">
          {!selectedClient ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-xs text-slate-500 space-y-2">
              <FolderKanban className="w-8 h-8 text-slate-700" />
              <p>Clique em um cliente à esquerda para visualizar o plano e os projetos dele.</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho do Cliente Selecionado */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{selectedClient.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusBadge(
                          selectedClient.subscriptionStatus
                        )}`}
                      >
                        {selectedClient.subscriptionStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedClient.email}
                      </span>
                      {selectedClient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {selectedClient.phone}
                        </span>
                      )}
                      {selectedClient.cpfCnpj && (
                        <span className="font-mono text-[11px] text-slate-500">
                          Doc: {selectedClient.cpfCnpj}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Valor do Ciclo</div>
                    <div className="text-lg font-bold font-mono text-emerald-300">
                      {selectedClient.isExempt
                        ? 'R$ 0,00 (Isento)'
                        : formatBRL(selectedClient.billing.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Controles rápidos de Plano & Isenção */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 text-[11px]">Plano:</span>
                    <select
                      value={selectedClient.isExempt ? 'admin_exempt' : selectedClient.planId}
                      onChange={(e) => handleChangePlan(selectedClient, e.target.value as PlanId)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    >
                      <option value="whatsapp">API WhatsApp (R$ 20/mês • 3 proj.)</option>
                      <option value="instagram">API Instagram (R$ 20/mês • 3 proj.)</option>
                      <option value="omnichannel">Omnichannel (R$ 35/mês • 5 proj.)</option>
                      <option value="admin_exempt">Isento / Cortesia (R$ 0,00)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleExempt(selectedClient)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    {selectedClient.isExempt ? 'Remover Isenção' : 'Tornar Isento'}
                  </button>
                </div>
              </div>

              {/* Lista de Projetos do Cliente */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Projetos de {selectedClient.name} ({selectedClient.projects?.length || 0})
                  </span>
                  {selectedClient.billing.extraProjects > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 font-semibold">
                      +{selectedClient.billing.extraProjects} projeto(s) extra(s)
                    </span>
                  )}
                </div>

                {!selectedClient.projects || selectedClient.projects.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    Este cliente ainda não criou nenhum projeto na aba <strong>Meus Projetos</strong>.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {selectedClient.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{proj.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {proj.slug}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyText(proj.loginJwt, `dir_jwt_${proj.id}`)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === `dir_jwt_${proj.id}` ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === `dir_jwt_${proj.id}` ? 'Copiado' : 'JWT'}</span>
                            </button>
                            <a
                              href={`${siteOrigin}/conectar?token=${encodeURIComponent(proj.loginJwt)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Popup</span>
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">
                              WhatsApp:{' '}
                              <strong className="text-slate-200">{proj.accounts.length}</strong>{' '}
                              {proj.accounts[0]?.displayPhoneNumber
                                ? `(${proj.accounts[0].displayPhoneNumber})`
                                : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Instagram className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                            <span className="truncate">
                              Instagram:{' '}
                              <strong className="text-slate-200">
                                {proj.instagramAccounts?.length || 0}
                              </strong>{' '}
                              {proj.instagramAccounts?.[0]?.username
                                ? `(@${proj.instagramAccounts[0].username})`
                                : ''}
                            </span>
                          </div>
                        </div>

                        {(proj.webhookUrl || proj.instagramWebhookUrl) && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                            {proj.webhookUrl && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Webhook className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate font-mono text-slate-300">
                                  WA: {proj.webhookUrl}
                                </span>
                              </div>
                            )}
                            {proj.instagramWebhookUrl && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Webhook className="w-3 h-3 text-fuchsia-400 shrink-0" />
                                <span className="truncate font-mono text-slate-300">
                                  IG: {proj.instagramWebhookUrl}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
