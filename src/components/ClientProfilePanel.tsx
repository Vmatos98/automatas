'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  Webhook,
} from 'lucide-react';
import type { BillingType, PublicSaasAccount } from './FinancialDashboardPanel';

interface ClientProfilePanelProps {
  mode: 'agency' | 'client';
  accountJwt?: string;
  projectJwt?: string;
  previewAsClient?: boolean;
  onAccountUpdated?: (acc: PublicSaasAccount) => void;
  onGoToFinance?: () => void;
}

export default function ClientProfilePanel({
  mode,
  accountJwt,
  projectJwt,
  previewAsClient = false,
  onAccountUpdated,
  onGoToFinance,
}: ClientProfilePanelProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Agency profile fields
  const [account, setAccount] = useState<PublicSaasAccount | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Project JWT profile fields
  const [projectSlug, setProjectSlug] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectWebhookWa, setProjectWebhookWa] = useState('');
  const [projectWebhookIg, setProjectWebhookIg] = useState('');
  const [projectApiKeyPrefix, setProjectApiKeyPrefix] = useState('');
  const [projectWebhookSecret, setProjectWebhookSecret] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'agency') {
        if (previewAsClient && !accountJwt) {
          setName('Agência Exemplo Digital Ltda');
          setEmail('cliente@exemplo.com');
          setCpfCnpj('12.345.678/0001-99');
          setPhone('(11) 99999-8888');
          setBillingType('PIX');
          return;
        }
        if (!accountJwt) return;
        const resp = await fetch('/api/billing?scope=me', {
          headers: { 'x-account-jwt': accountJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success || !data.account) {
          setError(data.error || 'Erro ao carregar dados da conta.');
          return;
        }
        const acc = data.account as PublicSaasAccount;
        setAccount(acc);
        setName(acc.name || '');
        setEmail(acc.email || '');
        setCpfCnpj(acc.cpfCnpj || '');
        setPhone(acc.phone || '');
        setBillingType(acc.billingType || 'PIX');
        onAccountUpdated?.(acc);
      } else {
        if (!projectJwt) return;
        const resp = await fetch('/api/hub/dashboard', {
          headers: { 'x-project-jwt': projectJwt },
          cache: 'no-store',
        });
        const data = await resp.json();
        if (!resp.ok || !data.success || !data.project) {
          setError(data.error || 'Erro ao carregar informações do projeto.');
          return;
        }
        setName(data.project.name || '');
        setProjectSlug(data.project.slug || '');
        setProjectDesc(data.project.description || '');
        setProjectWebhookWa(data.project.webhookUrl || '');
        setProjectWebhookIg(data.project.instagramWebhookUrl || '');
        setProjectApiKeyPrefix(data.project.apiKeyPrefix || '');
        setProjectWebhookSecret(data.project.webhookSecret || '');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha de rede ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, [mode, accountJwt, projectJwt, onAccountUpdated]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveAgencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewAsClient && !accountJwt) {
      setNotice('[Modo Preview Cliente] Alterações validadas visualmente!');
      return;
    }
    if (!accountJwt) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const resp = await fetch('/api/billing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-account-jwt': accountJwt,
        },
        body: JSON.stringify({
          scope: 'me',
          name: name.trim(),
          email: email.trim(),
          cpfCnpj: cpfCnpj.trim(),
          phone: phone.trim(),
          billingType,
          currentPassword: currentPassword.trim() || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao salvar informações da conta.');
        return;
      }
      setNotice('Informações da conta atualizadas com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      if (data.account) {
        setAccount(data.account);
        onAccountUpdated?.(data.account);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProjectProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectJwt) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const resp = await fetch('/api/hub/dashboard', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-project-jwt': projectJwt,
        },
        body: JSON.stringify({
          scope: 'profile',
          name: name.trim(),
          description: projectDesc.trim(),
          webhookUrl: projectWebhookWa.trim(),
          instagramWebhookUrl: projectWebhookIg.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || 'Erro ao atualizar dados do projeto.');
        return;
      }
      setNotice('Dados do projeto atualizados com sucesso!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar projeto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-5 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'agency' ? 'Minha Conta & Dados Cadastrais' : 'Informações do Meu Projeto'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'agency'
                ? 'Atualize seus dados pessoais/empresa, documentos de cobrança Asaas e senha de acesso.'
                : 'Ajuste o nome, descrição e URLs de webhook do seu projeto.'}
            </p>
          </div>
        </div>

        {onGoToFinance && (
          <button
            type="button"
            onClick={onGoToFinance}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Ver Meu Financeiro</span>
          </button>
        )}
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

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-400">Carregando informações...</div>
      ) : mode === 'agency' ? (
        <form
          onSubmit={handleSaveAgencyProfile}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-5"
        >
          {account && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  Plano ativo: <strong className="text-white">{account.billing.plan.name}</strong> (
                  {account.billingCycle === 'YEARLY' ? 'Anual -20%' : 'Mensal'})
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Projetos: {account.billing.currentProjects}/
                {account.isExempt ? '∞' : account.billing.includedProjects}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome / Razão Social
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                CPF ou CNPJ (Cobrança Asaas)
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Somente números"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                WhatsApp / Telefone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Forma de Pagamento Preferida (Asaas)
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as BillingType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="PIX">Pix</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CREDIT_CARD">Cartão de Crédito Recorrente</option>
              </select>
            </div>
          </div>

          {/* Alteração Opcional de Senha */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Alterar Senha (opcional)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mín. 4 caracteres)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleSaveProjectProfile}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4"
        >
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap gap-4 text-[11px] text-slate-400">
            <span>
              Slug: <code className="text-slate-200 font-mono">{projectSlug}</code>
            </span>
            <span>
              API Key: <code className="text-emerald-300 font-mono">{projectApiKeyPrefix}</code>
            </span>
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-400" />
              Secret: <code className="text-amber-300 font-mono">{projectWebhookSecret}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome do Projeto
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Ex: Automação de ofertas e atendimento"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webhook WhatsApp</span>
              </label>
              <input
                type="url"
                value={projectWebhookWa}
                onChange={(e) => setProjectWebhookWa(e.target.value)}
                placeholder="https://seu-app.com/webhook/whatsapp"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Webhook Instagram</span>
              </label>
              <input
                type="url"
                value={projectWebhookIg}
                onChange={(e) => setProjectWebhookIg(e.target.value)}
                placeholder="https://seu-app.com/webhook/instagram"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar Informações'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
