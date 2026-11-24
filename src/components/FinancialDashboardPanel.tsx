'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  DollarSign,
  ExternalLink,
  Instagram,
  Layers,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

export type PlanId = 'whatsapp' | 'instagram' | 'omnichannel' | 'admin_exempt';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  channels: Array<'whatsapp' | 'instagram'>;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  includedProjects: number;
  extraProjectMonthlyPrice: number;
  extraProjectYearlyPrice: number;
  highlighted?: boolean;
}

export interface BillingCalculation {
  plan: PlanDefinition;
  billingCycle: BillingCycle;
  isExempt: boolean;
  baseAmount: number;
  includedProjects: number;
  currentProjects: number;
  extraProjects: number;
  unitExtraPrice: number;
  extraAmount: number;
  totalAmount: number;
  monthlyEquivalent: number;
  allowedChannels: Array<'whatsapp' | 'instagram'>;
}

export interface PublicSaasAccount {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  billingType: BillingType;
  isExempt: boolean;
  subscriptionStatus: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  nextDueDate?: string;
  billing: BillingCalculation;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoiceItem {
  id: string;
  accountId: string;
  accountName?: string;
  accountEmail?: string;
  asaasPaymentId?: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  billingType: BillingType;
  baseAmount: number;
  extraProjectsCount: number;
  extraAmount: number;
  totalAmount: number;
  status: string;
  dueDate?: string;
  paidAt?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  description?: string;
  createdAt: string;
}

interface AdminMetrics {
  mrr: number;
  arr: number;
  totalAccounts: number;
  payingActiveAccounts: number;
  exemptAccounts: number;
  overdueAccounts: number;
  extraProjectsTotal: number;
  extraProjectsRevenueMonthly: number;
  adminOwnProjects: number;
}

interface FinancialDashboardPanelProps {
  mode: 'admin' | 'agency' | 'client';
  accountJwt?: string;
  projectJwt?: string;
  previewAsClient?: boolean;
  onAccountUpdated?: (acc: PublicSaasAccount) => void;
}

function formatBRL(val: number): string {
  return Number(val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function statusBadge(status: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE' || s === 'RECEIVED' || s === 'CONFIRMED') {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (s === 'EXEMPT') {
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  }
  if (s === 'OVERDUE' || s === 'CANCELED') {
    return 'bg-red-500/15 text-red-300 border-red-500/30';
  }
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

export default function FinancialDashboardPanel({
  mode,
  accountJwt,
  projectJwt,
  previewAsClient = false,
  onAccountUpdated,
}: FinancialDashboardPanelProps) {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [asaasConfigured, setAsaasConfigured] = useState(false);
  const [asaasEnv, setAsaasEnv] = useState('production');
  const [managedByAdmin, setManagedByAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin state
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [accounts, setAccounts] = useState<PublicSaasAccount[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoiceItem[]>([]);
  const [showNewAccForm, setShowNewAccForm] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccCpf, setNewAccCpf] = useState('');
  const [newAccPlan, setNewAccPlan] = useState<PlanId>('omnichannel');
  const [newAccCycle, setNewAccCycle] = useState<BillingCycle>('MONTHLY');
  const [newAccExempt, setNewAccExempt] = useState(false);
  const [savingAcc, setSavingAcc] = useState(false);

  // Agency state
  const [myAccount, setMyAccount] = useState<PublicSaasAccount | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('omnichannel');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('MONTHLY');
  const [selectedBillingType, setSelectedBillingType] = useState<BillingType>('PIX');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [latestInvoice, setLatestInvoice] = useState<BillingInvoiceItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'admin') {
        const resp = await fetch('/api/billing?scope=admin', { cache: 'no-store' });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Erro ao carregar painel financeiro.');
          return;
        }
        setPlans(data.plans || []);
        setAsaasConfigured(Boolean(data.asaasConfigured));
        setAsaasEnv(data.asaasEnv || 'production');
        setMetrics(data.metrics || null);
        setAccounts(data.accounts || []);
        setInvoices(data.invoices || []);
      } else if (mode === 'client') {
        if (!projectJwt) return;
        const resp = await fetch('/api/hub/dashboard?scope=billing', {
          headers: { 'x-project-jwt': projectJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Erro ao carregar dados financeiros do projeto.');
          return;
        }
        setPlans(data.plans || []);
        setManagedByAdmin(Boolean(data.managedByAdmin));
        setMyAccount(data.account || null);
        setInvoices(data.invoices || []);
      } else {
        if (previewAsClient && !accountJwt) {
          const resp = await fetch('/api/billing?scope=plans', { cache: 'no-store' });
          const data = await resp.json();
          const loadedPlans: PlanDefinition[] = data.plans || [];
          setPlans(loadedPlans);
          setAsaasConfigured(Boolean(data.asaasConfigured));
          setAsaasEnv(data.asaasEnv || 'production');
          const omni = loadedPlans.find((p) => p.id === 'omnichannel') || loadedPlans[0];
          if (omni) {
            setMyAccount({
              id: 'preview_client',
              name: 'Agência Exemplo (Preview Visão Cliente)',
              email: 'cliente@exemplo.com',
              cpfCnpj: '12345678000199',
              phone: '(11) 99999-8888',
              planId: omni.id,
              billingCycle: 'MONTHLY',
              billingType: 'PIX',
              isExempt: false,
              subscriptionStatus: 'active',
              billing: {
                plan: omni,
                billingCycle: 'MONTHLY',
                isExempt: false,
                baseAmount: omni.monthlyPrice,
                includedProjects: omni.includedProjects,
                currentProjects: 6,
                extraProjects: Math.max(0, 6 - omni.includedProjects),
                unitExtraPrice: omni.extraProjectMonthlyPrice,
                extraAmount: Math.max(0, 6 - omni.includedProjects) * omni.extraProjectMonthlyPrice,
                totalAmount:
                  omni.monthlyPrice +
                  Math.max(0, 6 - omni.includedProjects) * omni.extraProjectMonthlyPrice,
                monthlyEquivalent:
                  omni.monthlyPrice +
                  Math.max(0, 6 - omni.includedProjects) * omni.extraProjectMonthlyPrice,
                allowedChannels: omni.channels,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setCpfCnpj('12345678000199');
            setPhone('(11) 99999-8888');
            setInvoices([
              {
                id: 'inv_preview_1',
                accountId: 'preview_client',
                planId: omni.id,
                billingCycle: 'MONTHLY',
                billingType: 'PIX',
                baseAmount: omni.monthlyPrice,
                extraProjectsCount: 1,
                extraAmount: 10,
                totalAmount: omni.monthlyPrice + 10,
                status: 'RECEIVED',
                dueDate: new Date().toISOString().slice(0, 10),
                description: 'Automatas Hub • Omnichannel (Mensal) + 1 projeto extra',
                createdAt: new Date().toISOString(),
              },
            ]);
          }
          return;
        }
        if (!accountJwt) return;
        const resp = await fetch('/api/billing?scope=me', {
          headers: { 'x-account-jwt': accountJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setError(data.error || 'Erro ao carregar assinatura da conta.');
          return;
        }
        setPlans(data.plans || []);
        setAsaasConfigured(Boolean(data.asaasConfigured));
        setAsaasEnv(data.asaasEnv || 'production');
        setMyAccount(data.account || null);
        setInvoices(data.invoices || []);
        if (data.account) {
          setSelectedPlan(data.account.planId === 'admin_exempt' ? 'omnichannel' : data.account.planId);
          setSelectedCycle(data.account.billingCycle || 'MONTHLY');
          setSelectedBillingType(data.account.billingType || 'PIX');
          setCpfCnpj(data.account.cpfCnpj || '');
          setPhone(data.account.phone || '');
          onAccountUpdated?.(data.account);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha de rede no Financeiro.');
    } finally {
      setLoading(false);
    }
  }, [mode, accountJwt, projectJwt, onAccountUpdated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {}
  };

  const handleAdminCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAcc(true);
    setError('');
    setNotice('');
    try {
      const resp = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-create-account',
          name: newAccName.trim(),
          email: newAccEmail.trim(),
          password: newAccPassword.trim(),
          cpfCnpj: newAccCpf.trim() || undefined,
          planId: newAccExempt ? 'admin_exempt' : newAccPlan,
          billingCycle: newAccCycle,
          isExempt: newAccExempt,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao criar conta.');
        return;
      }
      setNotice(`Conta "${data.account.name}" criada com sucesso! O cliente já pode fazer login em /app.`);
      setNewAccName('');
      setNewAccEmail('');
      setNewAccPassword('');
      setNewAccCpf('');
      setNewAccExempt(false);
      setShowNewAccForm(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar conta.');
    } finally {
      setSavingAcc(false);
    }
  };

  const handleToggleExempt = async (acc: PublicSaasAccount) => {
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
      setNotice(
        !acc.isExempt
          ? `Conta "${acc.name}" marcada como ISENTA (R$ 0,00).`
          : `Isenção removida de "${acc.name}" (plano Omnichannel).`
      );
      await loadData();
    }
  };

  const handleToggleStatus = async (acc: PublicSaasAccount) => {
    const nextStatus = acc.subscriptionStatus === 'paused' ? 'active' : 'paused';
    const resp = await fetch('/api/billing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: acc.id, subscriptionStatus: nextStatus }),
    });
    if (resp.ok) await loadData();
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const resp = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'admin-mark-paid', invoiceId }),
    });
    if (resp.ok) {
      setNotice('Fatura marcada como PAGA e conta ativada!');
      await loadData();
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewAsClient && !accountJwt) {
      setNotice(
        '[Modo Preview Cliente] Simulação concluída! Para gerar cobrança real no Asaas, entre com uma conta de Cliente/Agência.'
      );
      return;
    }
    if (!accountJwt) return;
    setSubscribing(true);
    setError('');
    setNotice('');
    try {
      const resp = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-jwt': accountJwt,
        },
        body: JSON.stringify({
          action: 'subscribe',
          planId: selectedPlan,
          billingCycle: selectedCycle,
          billingType: selectedBillingType,
          cpfCnpj: cpfCnpj.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao atualizar assinatura.');
        return;
      }
      setLatestInvoice(data.invoice || null);
      setNotice(
        data.warning ||
          'Assinatura atualizada no Asaas com sucesso! Use o Pix ou link da fatura abaixo.'
      );
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar assinatura.');
    } finally {
      setSubscribing(false);
    }
  };

  // ==============================================================
  // MODO ADMIN: FINANCEIRO GLOBAL + GESTÃO DE CONTAS / AGÊNCIAS
  // ==============================================================
  if (mode === 'admin') {
    return (
      <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
        {/* Banner Admin Isento + Status Asaas */}
        <div className="p-5 rounded-3xl border border-emerald-500/25 bg-slate-900/70 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Gerenciamento Financeiro &amp; Planos (Asaas)
                </h2>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Admin Isento • R$ 0,00 / Projetos Ilimitados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Você cria projetos próprios ou de clientes sem custo. Clientes/agências pagam pelo
                plano escolhido + R$ 10/mês por projeto adicional acima da franquia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] px-3 py-1.5 rounded-xl border font-medium ${
                asaasConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/35 text-amber-300'
              }`}
            >
              {asaasConfigured
                ? `Asaas Conectado (${asaasEnv})`
                : 'Asaas: adicione ASAAS_API_KEY no .env'}
            </span>
            <button
              type="button"
              onClick={() => setShowNewAccForm((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Conta / Agência</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Webhook Asaas Info */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-400">
            Webhook para configurar no painel do <strong className="text-slate-200">Asaas</strong>{' '}
            (confirmação automática de Pix/Boleto/Cartão):
          </div>
          <div className="flex items-center gap-2">
            <code className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-blue-300 font-mono text-[11px]">
              https://api.automatas.tech/webhook/asaas
            </code>
            <button
              type="button"
              onClick={() => copyText('https://api.automatas.tech/webhook/asaas', 'asaas_wh')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'asaas_wh' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId === 'asaas_wh' ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

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

        {/* KPIs Financeiros */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>MRR (Mensal Recorrente)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300 font-mono">
                {formatBRL(metrics.mrr)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ARR projetado: {formatBRL(metrics.arr)}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Contas Pagantes / Isentas</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {metrics.payingActiveAccounts}{' '}
                <span className="text-sm text-slate-400 font-normal">
                  / {metrics.exemptAccounts} isentas
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {metrics.overdueAccounts > 0
                  ? `${metrics.overdueAccounts} conta(s) em atraso`
                  : 'Nenhuma conta inadimplente'}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Projetos Extras Faturados</span>
                <TrendingUp className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div className="text-2xl font-bold text-fuchsia-300 font-mono">
                +{metrics.extraProjectsTotal}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Adicional mensal: {formatBRL(metrics.extraProjectsRevenueMonthly)}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Seus Projetos Admin</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {metrics.adminOwnProjects}
              </div>
              <div className="text-[11px] text-emerald-400/90 mt-0.5">
                Custo R$ 0,00 (Ilimitado)
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Planos Vigentes (Referência rápida) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border ${
                p.highlighted
                  ? 'border-blue-500/40 bg-blue-950/20'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {p.includedProjects} projetos inclusos
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white font-mono">
                  {formatBRL(p.monthlyPrice)}
                </span>
                <span className="text-[11px] text-slate-400">/mês</span>
                <span className="text-[11px] text-emerald-400 ml-auto">
                  Anual: {formatBRL(p.yearlyPrice)} ({formatBRL(p.yearlyMonthlyEquivalent)}/mês)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                Projeto extra: +{formatBRL(p.extraProjectMonthlyPrice)}/mês (ou +R$ 8/mês no anual)
              </div>
            </div>
          ))}
        </div>

        {/* Form Criar Conta/Agência pelo Admin */}
        {showNewAccForm && (
          <form
            onSubmit={handleAdminCreateAccount}
            className="p-5 rounded-3xl border border-blue-500/30 bg-slate-900/85 space-y-3"
          >
            <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar Nova Conta / Agência Revendedora
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                placeholder="Nome da Agência / Cliente"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
              <input
                type="email"
                required
                value={newAccEmail}
                onChange={(e) => setNewAccEmail(e.target.value)}
                placeholder="E-mail de login"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
              <input
                type="password"
                required
                value={newAccPassword}
                onChange={(e) => setNewAccPassword(e.target.value)}
                placeholder="Senha inicial (mín. 4 chars)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
              <input
                type="text"
                value={newAccCpf}
                onChange={(e) => setNewAccCpf(e.target.value)}
                placeholder="CPF ou CNPJ (opcional para Asaas)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
              <select
                value={newAccPlan}
                onChange={(e) => setNewAccPlan(e.target.value as PlanId)}
                disabled={newAccExempt}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              >
                <option value="whatsapp">API WhatsApp (R$ 20/mês • 3 projetos)</option>
                <option value="instagram">API Instagram (R$ 20/mês • 3 projetos)</option>
                <option value="omnichannel">Omnichannel Ambos (R$ 35/mês • 5 projetos)</option>
              </select>
              <select
                value={newAccCycle}
                onChange={(e) => setNewAccCycle(e.target.value as BillingCycle)}
                disabled={newAccExempt}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              >
                <option value="MONTHLY">Ciclo Mensal</option>
                <option value="YEARLY">Ciclo Anual (20% OFF)</option>
              </select>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAccExempt}
                  onChange={(e) => setNewAccExempt(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span>Conta Isenta / Cortesia (R$ 0,00 e projetos ilimitados)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAccForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAcc}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                >
                  {savingAcc ? 'Cadastrando...' : 'Criar Conta'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tabela de Contas / Assinantes */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Contas &amp; Agências Cadastradas ({accounts.length})
            </span>
          </div>
          {accounts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma conta/agência cadastrada ainda. Clique em <strong>Nova Conta / Agência</strong>{' '}
              acima ou teste o autocadastro na tela de login.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Conta / E-mail</th>
                    <th className="px-4 py-3">Plano &amp; Ciclo</th>
                    <th className="px-4 py-3">Projetos</th>
                    <th className="px-4 py-3">Total Ciclo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-900/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">{acc.name}</div>
                        <div className="text-[11px] text-slate-400">{acc.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-medium">{acc.billing.plan.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {acc.isExempt
                            ? 'Cortesia Admin'
                            : acc.billingCycle === 'YEARLY'
                              ? 'Anual (-20%)'
                              : 'Mensal'}{' '}
                          • {acc.billingType}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-slate-100">{acc.billing.currentProjects}</span>
                        <span className="text-slate-500">
                          /{acc.isExempt ? '∞' : acc.billing.includedProjects}
                        </span>
                        {acc.billing.extraProjects > 0 && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300">
                            +{acc.billing.extraProjects} extra
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-300">
                        {acc.isExempt ? 'R$ 0,00' : formatBRL(acc.billing.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusBadge(
                            acc.subscriptionStatus
                          )}`}
                        >
                          {acc.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleExempt(acc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 cursor-pointer"
                        >
                          {acc.isExempt ? 'Remover Isenção' : 'Isentar'}
                        </button>
                        {!acc.isExempt && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 cursor-pointer"
                          >
                            {acc.subscriptionStatus === 'paused' ? 'Ativar' : 'Pausar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabela de Faturas Asaas */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Histórico de Faturas &amp; Cobranças ({invoices.length})
            </span>
          </div>
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Nenhuma cobrança gerada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Conta</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">
                          {inv.accountName || inv.accountId}
                        </div>
                        <div className="text-[10px] text-slate-500">{inv.accountEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div>{inv.description}</div>
                        <div className="text-[10px] text-slate-500">
                          Venc.: {inv.dueDate || '-'} • {inv.billingType}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {formatBRL(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusBadge(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {inv.invoiceUrl && (
                          <a
                            href={inv.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Fatura</span>
                          </a>
                        )}
                        {inv.status !== 'RECEIVED' && inv.status !== 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] cursor-pointer"
                          >
                            Confirmar Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==============================================================
  // MODO CLIENTE PROJETO JWT: ACOMPANHAMENTO DE CONTA & FATURAS
  // ==============================================================
  if (mode === 'client') {
    return (
      <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Financeiro &amp; Faturas da Conta</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhe o status do plano, faturas e boletos/Pix vinculados a este projeto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {managedByAdmin || !myAccount ? (
          <div className="p-5 rounded-3xl border border-blue-500/30 bg-blue-950/20 text-xs text-slate-200 space-y-2">
            <div className="font-bold text-blue-300 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Projeto Gerenciado Diretamente pela Automatas Tech
            </div>
            <p className="text-slate-400">
              Este projeto está vinculado diretamente à conta administrativa (sem cobrança
              recorrente individual no painel). Caso queira contratar uma conta própria de agência
              para gerenciar múltiplos projetos, confira os planos vigentes abaixo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"
                >
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="font-mono text-base font-bold text-emerald-300">
                    {formatBRL(p.monthlyPrice)}/mês
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {p.includedProjects} projetos inclusos • Anual {formatBRL(p.yearlyPrice)} (-20%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] text-slate-400">Conta Titular</div>
                <div className="text-sm font-bold text-white mt-0.5">{myAccount.name}</div>
                <div className="text-xs text-slate-400">{myAccount.email}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Plano &amp; Status</div>
                <div className="text-sm font-bold text-blue-300 mt-0.5">
                  {myAccount.billing.plan.name} (
                  {myAccount.billingCycle === 'YEARLY' ? 'Anual -20%' : 'Mensal'})
                </div>
                <span
                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusBadge(
                    myAccount.subscriptionStatus
                  )}`}
                >
                  {myAccount.subscriptionStatus}
                </span>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Valor do Ciclo</div>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
                  {myAccount.isExempt ? 'R$ 0,00' : formatBRL(myAccount.billing.totalAmount)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Projetos ativos: {myAccount.billing.currentProjects}/
                  {myAccount.isExempt ? '∞' : myAccount.billing.includedProjects}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Faturas da Conta ({invoices.length})
                </span>
              </div>
              {invoices.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhuma fatura registrada ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{inv.description}</div>
                        <div className="text-[11px] text-slate-500">
                          Venc.: {inv.dueDate || '-'} • {inv.billingType}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">
                          {formatBRL(inv.totalAmount)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusBadge(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                        {inv.invoiceUrl && (
                          <a
                            href={inv.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 text-[11px] flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir Fatura</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ==============================================================
  // MODO AGÊNCIA / CLIENTE PAGANTE: MEU PLANO, CHECKOUT ASAAS & FATURAS
  // ==============================================================
  const activePlanObj = plans.find((p) => p.id === selectedPlan) || plans[0];
  const currentProjCount = myAccount?.billing.currentProjects || 0;
  const previewExtraCount = activePlanObj
    ? Math.max(0, currentProjCount - activePlanObj.includedProjects)
    : 0;
  const previewBase = activePlanObj
    ? selectedCycle === 'YEARLY'
      ? activePlanObj.yearlyPrice
      : activePlanObj.monthlyPrice
    : 0;
  const previewExtraAmount = activePlanObj
    ? previewExtraCount *
      (selectedCycle === 'YEARLY'
        ? activePlanObj.extraProjectYearlyPrice
        : activePlanObj.extraProjectMonthlyPrice)
    : 0;
  const previewTotal = previewBase + previewExtraAmount;

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
      {/* Resumo da Assinatura Atual */}
      {myAccount && (
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">
                Meu Financeiro &amp; Assinatura
              </h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${statusBadge(
                  myAccount.subscriptionStatus
                )}`}
              >
                {myAccount.isExempt ? 'ISENTO / CORTESIA' : myAccount.subscriptionStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plano atual: <strong className="text-slate-100">{myAccount.billing.plan.name}</strong>{' '}
              ({myAccount.billingCycle === 'YEARLY' ? 'Anual -20% OFF' : 'Mensal'})
            </p>
            <div className="flex items-center gap-2 pt-1">
              {myAccount.billing.allowedChannels.includes('whatsapp') && (
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> WhatsApp Liberado
                </span>
              )}
              {myAccount.billing.allowedChannels.includes('instagram') && (
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> Instagram Liberado
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">Uso de Projetos</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              {myAccount.billing.currentProjects}{' '}
              <span className="text-xs text-slate-400 font-normal">
                / {myAccount.isExempt ? '∞' : `${myAccount.billing.includedProjects} inclusos`}
              </span>
            </div>
            {myAccount.billing.extraProjects > 0 ? (
              <div className="text-[11px] text-fuchsia-300 mt-1">
                +{myAccount.billing.extraProjects} projeto(s) extra(s) ({formatBRL(myAccount.billing.extraAmount)})
              </div>
            ) : (
              <div className="text-[11px] text-emerald-400 mt-1">Dentro da franquia inclusa</div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">
              Valor {myAccount.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'} Atual
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
              {myAccount.isExempt ? 'R$ 0,00' : formatBRL(myAccount.billing.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {myAccount.isExempt
                ? 'Conta isenta pelo Administrador'
                : `Base ${formatBRL(myAccount.billing.baseAmount)} + Extras ${formatBRL(myAccount.billing.extraAmount)}`}
            </div>
          </div>
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

      {/* Box de Pagamento Pix / Fatura Recém-Gerada */}
      {latestInvoice && (
        <div className="p-5 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Cobrança Gerada — {formatBRL(latestInvoice.totalAmount)} ({latestInvoice.billingType})
            </div>
            <button
              type="button"
              onClick={() => setLatestInvoice(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {latestInvoice.pixQrCode && (
              <img
                src={`data:image/png;base64,${latestInvoice.pixQrCode}`}
                alt="QR Code Pix Asaas"
                className="w-36 h-36 rounded-2xl bg-white p-2"
              />
            )}
            <div className="flex-1 space-y-2 text-xs">
              <div className="text-slate-200">{latestInvoice.description}</div>
              {latestInvoice.pixCopyPaste && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={latestInvoice.pixCopyPaste}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] text-emerald-300"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(latestInvoice.pixCopyPaste!, 'pix_copy')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    {copiedId === 'pix_copy' ? 'Copiado!' : 'Copiar Pix'}
                  </button>
                </div>
              )}
              {latestInvoice.invoiceUrl && (
                <a
                  href={latestInvoice.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Fatura / Pagar no Asaas</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Planos + Checkout Asaas (escondido apenas se isento) */}
      {!myAccount?.isExempt && (
        <form
          onSubmit={handleSubscribe}
          className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Escolha ou Altere seu Plano
              </h3>
              <p className="text-xs text-slate-400">
                Projetos acima do limite incluso cobram apenas +R$ 10/mês (+R$ 8/mês no plano anual).
              </p>
            </div>

            {/* Toggle Mensal vs Anual */}
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setSelectedCycle('MONTHLY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  selectedCycle === 'MONTHLY'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycle('YEARLY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  selectedCycle === 'YEARLY'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/25">-20% OFF</span>
              </button>
            </div>
          </div>

          {/* 3 Cards de Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              const displayPrice =
                selectedCycle === 'YEARLY' ? p.yearlyMonthlyEquivalent : p.monthlyPrice;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/30 shadow-lg shadow-blue-950/30'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{p.name}</span>
                      {p.highlighted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/25 text-blue-300 border border-blue-500/40 font-semibold">
                          Mais Popular
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{p.tagline}</p>
                    <div className="pt-1">
                      <span className="text-2xl font-bold text-white font-mono">
                        {formatBRL(displayPrice)}
                      </span>
                      <span className="text-xs text-slate-400">/mês</span>
                      {selectedCycle === 'YEARLY' && (
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          Cobrado {formatBRL(p.yearlyPrice)}/ano (economia de 20%)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Até <strong>{p.includedProjects} projetos inclusos</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        Extra:{' '}
                        {selectedCycle === 'YEARLY' ? '+R$ 8,00/mês (R$ 96/ano)' : '+R$ 10,00/mês'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagamento Asaas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Forma de Pagamento (Asaas)
              </label>
              <select
                value={selectedBillingType}
                onChange={(e) => setSelectedBillingType(e.target.value as BillingType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="PIX">Pix (Aprovação Imediata)</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CREDIT_CARD">Cartão de Crédito Recorrente</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">CPF ou CNPJ</label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Somente números (obrigatório no Asaas)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-300">
              Total desta assinatura ({selectedCycle === 'YEARLY' ? 'Anual' : 'Mensal'}):{' '}
              <strong className="text-emerald-300 font-mono text-base ml-1">
                {formatBRL(previewTotal)}
              </strong>
              {previewExtraCount > 0 && (
                <span className="text-[11px] text-fuchsia-300 ml-2">
                  (inclui {previewExtraCount} projeto(s) extra(s))
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={subscribing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {subscribing ? 'Gerando no Asaas...' : 'Confirmar Plano & Gerar Cobrança Asaas'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Histórico de Faturas da Conta */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Minhas Faturas ({invoices.length})
          </span>
        </div>
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Nenhuma fatura gerada ainda. Selecione um plano acima para gerar sua assinatura.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{inv.description}</div>
                  <div className="text-[11px] text-slate-500">
                    Vencimento: {inv.dueDate || '-'} • {inv.billingType}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-white">
                    {formatBRL(inv.totalAmount)}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusBadge(
                      inv.status
                    )}`}
                  >
                    {inv.status}
                  </span>
                  {inv.invoiceUrl && (
                    <a
                      href={inv.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 text-[11px] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Pagar</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
