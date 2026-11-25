'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  initFacebookSdk,
  launchWhatsAppEmbeddedSignup,
  getFacebookUserProfile,
  FacebookUserProfile,
  WhatsAppEmbeddedSignupData,
} from '@/lib/facebookSdk';
import {
  Bot,
  Lock,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Send,
  MessageSquare,
  Smartphone,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Search,
  User,
  Phone,
  CheckCheck,
  Plus,
  PlusCircle,
  Clock,
  Radio,
  FileText,
  Trash2,
  ShieldCheck,
  Globe,
  Settings,
  Menu,
  X,
  Copy,
  Check,
  Users,
  UserPlus,
  Ban,
  ShieldAlert,
  Filter,
  UserCheck,
  Mail,
  Eye,
  EyeOff,
  Instagram,
  KeyRound,
  ChevronDown,
  DollarSign,
} from 'lucide-react';
import HubProjectsPanel from '@/components/HubProjectsPanel';
import InstagramWorkspacePanel from '@/components/InstagramWorkspacePanel';
import HubClientsDirectoryPanel from '@/components/HubClientsDirectoryPanel';
import ClientProfilePanel from '@/components/ClientProfilePanel';
import FinancialDashboardPanel, {
  BillingCycle,
  PlanId,
  PublicSaasAccount,
} from '@/components/FinancialDashboardPanel';

interface AdminUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: 'active' | 'pending_deletion' | 'deleted' | 'blocked';
  deletion_protocol?: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageItem {
  id: string;
  from: string;
  to?: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  status: 'received' | 'sent' | 'delivered' | 'read' | 'failed';
  senderName?: string;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  unreadCount?: number;
}

interface ConnectedWhatsAppAccount {
  phoneNumberId: string;
  wabaId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  userName?: string;
  userEmail?: string;
  isCoexistence: boolean;
  onboardingMode: 'coexistence' | 'standard' | 'system_user';
  authType: 'embedded_signup' | 'facebook_login' | 'system_user';
  isDefaultEnv?: boolean;
  tokenExchanged?: boolean;
  webhookSubscribed?: boolean;
  contactsSynced?: boolean;
  historySynced?: boolean;
  lastSyncAt?: string;
  syncWarnings?: string[];
  connectedAt?: string;
}

interface MetaStatus {
  configured: boolean;
  phoneNumberId: string | null;
  activePhoneNumberId?: string;
  verifyTokenConfigured: boolean;
  apiVersion: string;
  appId: string;
  accounts?: ConnectedWhatsAppAccount[];
  totalMessages: number;
  messages: MessageItem[];
  contacts?: ContactItem[];
}

export default function AppPage() {
  // Estado de Autenticação (Admin corporativo, Agência/Conta SaaS ou Projeto Individual JWT)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'admin' | 'agency' | 'client'>('admin');
  const [loginTab, setLoginTab] = useState<'email' | 'jwt' | 'signup'>('email');
  const [jwtInput, setJwtInput] = useState('');
  const [projectJwt, setProjectJwt] = useState('');
  const [clientProject, setClientProject] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [accountJwt, setAccountJwt] = useState('');
  const [agencyAccount, setAgencyAccount] = useState<PublicSaasAccount | null>(null);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState<PlanId>('omnichannel');
  const [regCycle, setRegCycle] = useState<BillingCycle>('MONTHLY');
  const [regCourtesyCode, setRegCourtesyCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Modo de Auditoria Meta (Ambiente Sandbox Seguro Isolado)
  const [isAuditorMode, setIsAuditorMode] = useState<boolean>(false);

  // Estado da Conexão WhatsApp & Meta
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [phoneId, setPhoneId] = useState<string>('1275823778955658');
  const [wabaId, setWabaId] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>('');
  const [isCoexistence, setIsCoexistence] = useState<boolean>(false);
  const [coexistenceEnabled, setCoexistenceEnabled] = useState<boolean>(true);
  const [isSyncingCoexistence, setIsSyncingCoexistence] = useState<boolean>(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedWhatsAppAccount[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('all');
  const [metaAppId, setMetaAppId] = useState<string>(process.env.NEXT_PUBLIC_META_APP_ID || '');
  const [metaConfigId, setMetaConfigId] = useState<string>(process.env.NEXT_PUBLIC_META_CONFIG_ID || '');
  const [fbUserProfile, setFbUserProfile] = useState<FacebookUserProfile | null>(null);
  const [isEmbeddedSigningUp, setIsEmbeddedSigningUp] = useState<boolean>(false);
  const [showAppIdModal, setShowAppIdModal] = useState<boolean>(false);
  const [tempAppId, setTempAppId] = useState<string>('');
  const [tempConfigId, setTempConfigId] = useState<string>('');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState<string>('+1 555-xxx-xxxx (Meta Test Number)');

  // Contatos e Mensagens
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContactPhone, setSelectedContactPhone] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [, setMetaInfo] = useState<MetaStatus | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Input de Mensagem no Chat
  const [chatInputText, setChatInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal / Novo Contato Rápido
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Controle de Visualização e Papel de Acesso (Admin vs Agência vs Cliente JWT)
  const [currentView, setCurrentView] = useState<'chat' | 'instagram' | 'projects' | 'finance' | 'profile' | 'users'>('chat');
  const [adminAccountsSubTab, setAdminAccountsSubTab] = useState<'clients' | 'leads'>('clients');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');
  const isAdmin = authMode === 'admin' && userRole === 'admin';
  const isPreviewingClient = authMode === 'admin' && userRole === 'user';
  const agencyAllowedChannels =
    authMode === 'agency' && agencyAccount
      ? agencyAccount.billing.allowedChannels
      : (['whatsapp', 'instagram'] as Array<'whatsapp' | 'instagram'>);
  const canAccessWhatsapp = authMode !== 'agency' || agencyAllowedChannels.includes('whatsapp');
  const canAccessInstagram = authMode !== 'agency' || agencyAllowedChannels.includes('instagram');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Gestão de Usuários e Contas (Exclusivo Admin)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'leads' | 'whatsapp' | 'deleted'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userStats, setUserStats] = useState({ total: 0, active: 0, whatsapp: 0, deletions: 0 });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Modal de Cadastro de Novo Usuário / Lead
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserName, setCreateUserName] = useState('');
  const [createUserEmail, setCreateUserEmail] = useState('');
  const [createUserPhone, setCreateUserPhone] = useState('');
  const [createUserSource, setCreateUserSource] = useState('manual_admin');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Modal / Menu de Configurações Meta e Telas Obrigatórias
  const [showMetaSettingsModal, setShowMetaSettingsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modo de Privacidade / Mascaramento para Vídeos e Auditoria Meta
  const [privacyMode, setPrivacyMode] = useState<boolean>(true);
  const [showVerifyToken, setShowVerifyToken] = useState<boolean>(false);
  const [showPhoneId, setShowPhoneId] = useState<boolean>(false);
  const [showMetaAppId, setShowMetaAppId] = useState<boolean>(false);
  const [showMetaConfigId, setShowMetaConfigId] = useState<boolean>(false);
  const [showWabaId, setShowWabaId] = useState<boolean>(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Inicializar autenticação e papel salvos + Meta credentials
  useEffect(() => {
    const savedAccountJwt = localStorage.getItem('automatas_account_jwt');
    const savedProjectJwt = localStorage.getItem('automatas_project_jwt');
    const savedAuth = localStorage.getItem('automatas_app_auth');
    const savedRole = localStorage.getItem('automatas_app_role') as 'admin' | 'user' | null;
    const savedEmail = localStorage.getItem('automatas_app_email');
    const savedAuditor = localStorage.getItem('automatas_app_auditor_mode');

    // 0. Se houver JWT de Conta / Agência salvo, autentica em modo Agência
    if (savedAccountJwt && savedAccountJwt.split('.').length === 3) {
      fetch('/api/billing?scope=me', {
        headers: { 'x-account-jwt': savedAccountJwt },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data?.account) {
            setAuthMode('agency');
            setAccountJwt(savedAccountJwt);
            setAgencyAccount(data.account);
            setUserRole('user');
            setIsAuthenticated(true);
            setCurrentView('projects');
          } else {
            localStorage.removeItem('automatas_account_jwt');
          }
        })
        .catch(() => {});
    } else if (savedProjectJwt && savedProjectJwt.split('.').length === 3) {
      // 1. Se houver JWT de Projeto salvo, valida e autentica em modo Cliente isolado
      fetch(`/api/hub/connect?token=${encodeURIComponent(savedProjectJwt)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data?.project) {
            setAuthMode('client');
            setProjectJwt(savedProjectJwt);
            setClientProject({
              id: data.project.id,
              slug: data.project.slug,
              name: data.project.name,
            });
            setUserRole('user');
            setIsAuthenticated(true);
            if (data.appId) {
              setMetaAppId(data.appId);
              initFacebookSdk(data.appId);
            }
            if (data.configId) setMetaConfigId(data.configId);
          } else {
            localStorage.removeItem('automatas_project_jwt');
          }
        })
        .catch(() => {});
    } else if (savedAuth === 'true') {
      // 2. Sessão corporativa/admin: apenas e-mails oficiais autorizados (nunca Facebook público)
      const validEmails = ['reviewer@automatas.tech', 'admin@automatas.tech', 'contato@automatas.tech'];
      if (savedEmail && validEmails.includes(savedEmail.toLowerCase())) {
        setAuthMode('admin');
        setIsAuthenticated(true);
        if (savedRole) setUserRole(savedRole);
        if (savedEmail) setEmail(savedEmail);
      } else {
        localStorage.removeItem('automatas_app_auth');
        localStorage.removeItem('automatas_app_role');
        localStorage.removeItem('automatas_app_email');
        localStorage.removeItem('automatas_app_auditor_mode');
        setIsAuthenticated(false);
      }
    }
    if (
      savedAuditor === 'true' ||
      (savedEmail && (savedEmail.toLowerCase().includes('review') || savedEmail.toLowerCase().includes('meta')))
    ) {
      setIsAuditorMode(true);
    }

    const savedAppId = localStorage.getItem('automatas_meta_app_id') || process.env.NEXT_PUBLIC_META_APP_ID || '';
    const savedConfigId = localStorage.getItem('automatas_meta_config_id') || process.env.NEXT_PUBLIC_META_CONFIG_ID || '';
    const savedPhoneId = localStorage.getItem('automatas_meta_phone_id');
    const savedWabaId = localStorage.getItem('automatas_meta_waba_id');
    const savedBusinessId = localStorage.getItem('automatas_meta_business_id');
    const savedCoexistence = localStorage.getItem('automatas_meta_coexistence');
    const savedActiveChannel = localStorage.getItem('automatas_active_channel_id');
    const savedUser = localStorage.getItem('automatas_meta_user');

    if (savedAppId) setMetaAppId(savedAppId);
    if (savedConfigId) setMetaConfigId(savedConfigId);
    if (savedPhoneId) {
      setPhoneId(savedPhoneId);
      setDisplayPhoneNumber(`+${savedPhoneId}`);
    }
    if (savedWabaId) setWabaId(savedWabaId);
    if (savedBusinessId) setBusinessId(savedBusinessId);
    if (savedCoexistence === 'true') setIsCoexistence(true);
    if (savedActiveChannel) setActiveChannelId(savedActiveChannel);
    if (savedUser) {
      try {
        setFbUserProfile(JSON.parse(savedUser));
      } catch {}
    }

    // Inicializa SDK do Facebook
    if (savedAppId) {
      initFacebookSdk(savedAppId);
    }

    // Consultar contas conectadas e sessão ativa no backend (somente se não for cliente JWT nem agência)
    if (!savedProjectJwt && !savedAccountJwt) {
      fetch('/api/meta/auth')
        .then((res) => res.json())
        .then((data) => {
          const accountsList: ConnectedWhatsAppAccount[] = Array.isArray(data.accounts)
            ? data.accounts
            : [];
          if (accountsList.length > 0) {
            setConnectedAccounts(accountsList);
          }

          const matchedAccount =
            savedActiveChannel && savedActiveChannel !== 'all'
              ? accountsList.find((a) => a.phoneNumberId === savedActiveChannel)
              : undefined;
          const activeTarget = matchedAccount || accountsList[0];

          if (activeTarget) {
            setPhoneId(activeTarget.phoneNumberId);
            setDisplayPhoneNumber(
              activeTarget.displayPhoneNumber || `+${activeTarget.phoneNumberId}`
            );
            if (activeTarget.wabaId) setWabaId(activeTarget.wabaId);
            if (activeTarget.businessId) setBusinessId(activeTarget.businessId);
            setIsCoexistence(Boolean(activeTarget.isCoexistence));
          } else if (data.session) {
            if (data.session.phoneNumberId) {
              setPhoneId(data.session.phoneNumberId);
              setDisplayPhoneNumber(data.session.displayPhoneNumber || `+${data.session.phoneNumberId}`);
            } else if (data.session.displayPhoneNumber) {
              setDisplayPhoneNumber(data.session.displayPhoneNumber);
            }
            if (data.session.wabaId) setWabaId(data.session.wabaId);
            if (data.session.businessId) {
              setBusinessId(data.session.businessId);
              localStorage.setItem('automatas_meta_business_id', data.session.businessId);
            }
            if (typeof data.session.isCoexistence === 'boolean') {
              setIsCoexistence(data.session.isCoexistence);
              localStorage.setItem('automatas_meta_coexistence', String(data.session.isCoexistence));
            }
          }

          if (data.session?.userName && !savedUser) {
            setFbUserProfile({
              id: data.session.userId || 'meta-user',
              name: data.session.userName,
              email: data.session.userEmail,
              pictureUrl: data.session.userPicture,
            });
          }
          if (!savedAppId && data.appId) {
            setMetaAppId(data.appId);
            initFacebookSdk(data.appId);
          }
          if (!savedConfigId && data.configId) {
            setMetaConfigId(data.configId);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSaveAppCredentials = (newAppId: string, newConfigId: string) => {
    setMetaAppId(newAppId);
    setMetaConfigId(newConfigId);
    localStorage.setItem('automatas_meta_app_id', newAppId);
    localStorage.setItem('automatas_meta_config_id', newConfigId);
    setShowAppIdModal(false);
    if (newAppId) {
      initFacebookSdk(newAppId);
    }
    setFeedbackMessage({
      text: 'Credenciais Meta configuradas com sucesso!',
      type: 'success',
    });
  };

  // Login isolado de Cliente via Chave JWT do Projeto
  const handleJwtLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const clean = jwtInput.trim();
    if (!clean) {
      setLoginError('Cole a Chave JWT de Login fornecida para o seu projeto.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch(`/api/hub/connect?token=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.project) {
        setLoginError(data.error || 'Chave JWT inválida, revogada ou projeto pausado.');
        return;
      }

      setAuthMode('client');
      setProjectJwt(clean);
      setClientProject({
        id: data.project.id,
        slug: data.project.slug,
        name: data.project.name,
      });
      setUserRole('user');
      setIsAuditorMode(false);
      setIsAuthenticated(true);
      setCurrentView('chat');
      localStorage.setItem('automatas_project_jwt', clean);
      localStorage.removeItem('automatas_app_auth');

      if (data.appId) {
        setMetaAppId(data.appId);
        initFacebookSdk(data.appId);
      }
      if (data.configId) setMetaConfigId(data.configId);
      setJwtInput('');
      setFeedbackMessage({
        text: `Conectado ao projeto "${data.project.name}" com acesso isolado!`,
        type: 'success',
      });
    } catch {
      setLoginError('Falha ao validar a Chave JWT no servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLaunchEmbeddedSignup = async (coexistenceOverride?: boolean) => {
    const useCoexistence =
      typeof coexistenceOverride === 'boolean' ? coexistenceOverride : coexistenceEnabled;

    if (!metaAppId?.trim() || !metaConfigId?.trim()) {
      setTempAppId(metaAppId);
      setTempConfigId(metaConfigId);
      setShowAppIdModal(true);
      setFeedbackMessage({
        text: 'Informe o Meta App ID e o Embedded Signup Config ID (Facebook Login for Business) para iniciar o Embedded Signup.',
        type: 'error',
      });
      return;
    }

    setIsEmbeddedSigningUp(true);
    setFeedbackMessage(null);

    try {
      await initFacebookSdk(metaAppId);

      let capturedEvent: WhatsAppEmbeddedSignupData | null = null;

      const res = await launchWhatsAppEmbeddedSignup({
        configId: metaConfigId,
        coexistence: useCoexistence,
        onEmbeddedEvent: (evt) => {
          capturedEvent = evt;
          if (evt.event === 'CANCEL' || evt.event === 'ERROR') {
            return;
          }
          if (evt.phone_number_id) {
            setPhoneId(evt.phone_number_id);
            setDisplayPhoneNumber(`+${evt.phone_number_id}`);
            localStorage.setItem('automatas_meta_phone_id', evt.phone_number_id);
          }
          if (evt.waba_id) {
            setWabaId(evt.waba_id);
            localStorage.setItem('automatas_meta_waba_id', evt.waba_id);
          }
          if (evt.business_id) {
            setBusinessId(evt.business_id);
            localStorage.setItem('automatas_meta_business_id', evt.business_id);
          }
        },
      });

      const mergedEventData: WhatsAppEmbeddedSignupData = {
        ...(capturedEvent || {}),
        ...(res.embeddedData || {}),
      };

      const hasCompletedAssets = Boolean(
        mergedEventData.event?.startsWith('FINISH') ||
          mergedEventData.waba_id ||
          mergedEventData.phone_number_id
      );

      if (res.status === 'connected' && res.authResponse && hasCompletedAssets) {
        const profile = await getFacebookUserProfile();
        if (profile) setFbUserProfile(profile);

        // Nunca reutilizar phoneId/wabaId antigos de sessões anteriores se o evento atual não trouxe
        const resolvedPhoneId = mergedEventData.phone_number_id || undefined;
        const resolvedWabaId = mergedEventData.waba_id || undefined;
        const resolvedBusinessId = mergedEventData.business_id || undefined;
        const detectedCoexistence = Boolean(
          mergedEventData.is_coexistence ||
            mergedEventData.is_on_biz_app ||
            mergedEventData.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' ||
            (useCoexistence &&
              mergedEventData.event !== 'FINISH' &&
              mergedEventData.event !== 'FINISH_ONLY_WABA')
        );

        const onboardingBody = {
          authType: 'embedded_signup',
          userId: profile?.id || res.authResponse.userID,
          userName: profile?.name || 'WhatsApp Business Integrado',
          userEmail: profile?.email || null,
          code: res.authResponse.code,
          accessToken: res.authResponse.accessToken,
          phoneNumberId: resolvedPhoneId,
          wabaId: resolvedWabaId,
          businessId: resolvedBusinessId,
          isCoexistence: detectedCoexistence,
          onboardingMode: detectedCoexistence ? 'coexistence' : 'standard',
          embeddedEvent: mergedEventData.event,
        };

        const authRes =
          authMode === 'client' && projectJwt
            ? await fetch('/api/hub/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: projectJwt,
                  channel: 'whatsapp',
                  ...onboardingBody,
                }),
              })
            : await fetch('/api/meta/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(onboardingBody),
              });

        const authData = await authRes.json().catch(() => ({}));
        if (!authRes.ok || !authData?.success) {
          setFeedbackMessage({
            text: authData?.error || 'Não foi possível concluir a vinculação da conta WhatsApp.',
            type: 'error',
          });
          return;
        }
        const session = authData?.session;

        if (Array.isArray(authData?.accounts)) {
          setConnectedAccounts(authData.accounts);
        }

        const finalPhoneId = session?.phoneNumberId || resolvedPhoneId;
        const finalWabaId = session?.wabaId || resolvedWabaId;
        const finalBusinessId = session?.businessId || resolvedBusinessId;
        const finalIsCoexistence = Boolean(session?.isCoexistence ?? detectedCoexistence);

        if (finalPhoneId) {
          setPhoneId(finalPhoneId);
          setActiveChannelId(finalPhoneId);
          localStorage.setItem('automatas_meta_phone_id', finalPhoneId);
          localStorage.setItem('automatas_active_channel_id', finalPhoneId);
          setDisplayPhoneNumber(session?.displayPhoneNumber || `+${finalPhoneId}`);
        }
        if (finalWabaId) {
          setWabaId(finalWabaId);
          localStorage.setItem('automatas_meta_waba_id', finalWabaId);
        }
        if (finalBusinessId) {
          setBusinessId(finalBusinessId);
          localStorage.setItem('automatas_meta_business_id', finalBusinessId);
        }

        setIsCoexistence(finalIsCoexistence);
        localStorage.setItem('automatas_meta_coexistence', String(finalIsCoexistence));
        setIsConnected(true);

        const warnings: string[] = authData?.onboardingDetails?.warnings || [];
        const baseText = finalIsCoexistence
          ? 'Conta WhatsApp Business vinculada em modo Coexistência (App + Cloud API)!'
          : 'Conta de WhatsApp Business vinculada com sucesso via Embedded Signup!';

        setFeedbackMessage({
          text: warnings.length > 0 ? `${baseText} Atenção: ${warnings.join(' | ')}` : baseText,
          type: 'success',
        });
        fetchMessagesAndContacts();
      } else {
        setFeedbackMessage({
          text: res.error || 'Fluxo de Onboarding não concluído. Nenhuma conta foi adicionada.',
          type: 'error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro durante o Onboarding Embutido da Meta';
      setFeedbackMessage({ text: msg, type: 'error' });
    } finally {
      setIsEmbeddedSigningUp(false);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    localStorage.setItem('automatas_active_channel_id', channelId);
    setSelectedContactPhone('');

    if (channelId !== 'all') {
      const acc = connectedAccounts.find((a) => a.phoneNumberId === channelId);
      if (acc) {
        setPhoneId(acc.phoneNumberId);
        setDisplayPhoneNumber(acc.displayPhoneNumber || `+${acc.phoneNumberId}`);
        setWabaId(acc.wabaId || '');
        setBusinessId(acc.businessId || '');
        setIsCoexistence(Boolean(acc.isCoexistence));
      }
    }
  };

  const handleManualCoexistenceSync = async (targetPhoneId?: string) => {
    setIsSyncingCoexistence(true);
    setFeedbackMessage(null);
    const phoneToSync = targetPhoneId || phoneId;
    try {
      const res = await fetch('/api/meta/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_coexistence',
          phoneNumberId: phoneToSync,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.accounts)) {
        setConnectedAccounts(data.accounts);
      }
      if (res.ok && data.success) {
        const warnings: string[] = data.syncResult?.warnings || [];
        setFeedbackMessage({
          text:
            warnings.length > 0
              ? `Sincronização parcial de coexistência concluída. Avisos: ${warnings.join(' | ')}`
              : 'Sincronização de contatos e histórico (até 6 meses) da Coexistência solicitada com sucesso à Meta!',
          type: 'success',
        });
        fetchMessagesAndContacts();
      } else {
        const warnList: string[] = data.syncResult?.warnings || [];
        setFeedbackMessage({
          text:
            data.error ||
            (warnList.length > 0
              ? `Não foi possível sincronizar: ${warnList.join(' | ')}`
              : 'Não foi possível solicitar a sincronização de coexistência.'),
          type: 'error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha de comunicação ao sincronizar.';
      setFeedbackMessage({ text: msg, type: 'error' });
    } finally {
      setIsSyncingCoexistence(false);
    }
  };

  // Buscar usuários para a tela de admin
  const fetchAdminUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userFilter !== 'all') params.append('filter', userFilter);
      if (userSearch.trim()) params.append('q', userSearch.trim());
      params.append('auditor', isAuditorMode ? 'true' : 'false');

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'x-auditor-mode': isAuditorMode ? 'true' : 'false',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.users || []);
        if (data.stats) setUserStats(data.stats);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userFilter, userSearch, isAuditorMode]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && currentView === 'users') {
      fetchAdminUsers();
    }
  }, [isAuthenticated, isAdmin, currentView, fetchAdminUsers]);

  // Buscar dados e mensagens
  const fetchMessagesAndContacts = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      if (authMode === 'agency' && accountJwt) {
        const res = await fetch('/api/billing?scope=workspace', {
          headers: { 'x-account-jwt': accountJwt },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.account) setAgencyAccount(data.account);
          const waAccounts: ConnectedWhatsAppAccount[] = Array.isArray(data.whatsapp?.accounts)
            ? data.whatsapp.accounts
            : [];
          const waMessages: MessageItem[] = Array.isArray(data.whatsapp?.messages)
            ? data.whatsapp.messages
            : [];
          setConnectedAccounts(waAccounts);
          setMessages(waMessages);
          if (waAccounts[0]) {
            setPhoneId(waAccounts[0].phoneNumberId);
            setDisplayPhoneNumber(waAccounts[0].displayPhoneNumber || `+${waAccounts[0].phoneNumberId}`);
            setIsConnected(true);
          }
          const byPhone = new Map<string, ContactItem>();
          for (const m of waMessages) {
            const peer = m.direction === 'outbound' ? m.to || m.from : m.from;
            const clean = String(peer || '').replace(/\D/g, '');
            if (!clean) continue;
            if (!byPhone.has(clean)) {
              byPhone.set(clean, {
                id: `ag_c_${clean}`,
                name: m.senderName || `Contato +${clean}`,
                phone: clean,
                lastMessage: m.text,
                lastTimestamp: m.timestamp,
              });
            }
          }
          const contactList = Array.from(byPhone.values());
          setContacts(contactList);
          setSelectedContactPhone((prev) => (!prev && contactList.length > 0 ? contactList[0].phone : prev));
        }
        return;
      }

      if (authMode === 'client' && projectJwt) {
        const channelParam =
          activeChannelId && activeChannelId !== 'all'
            ? `?phoneNumberId=${encodeURIComponent(activeChannelId)}`
            : '';
        const res = await fetch(`/api/hub/dashboard${channelParam}`, {
          headers: { 'x-project-jwt': projectJwt },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          const waAccounts: ConnectedWhatsAppAccount[] = Array.isArray(data.whatsapp?.accounts)
            ? data.whatsapp.accounts
            : [];
          const waMessages: MessageItem[] = Array.isArray(data.whatsapp?.messages)
            ? data.whatsapp.messages
            : [];
          setConnectedAccounts(waAccounts);
          setMessages(waMessages);
          if (waAccounts[0]) {
            setPhoneId(waAccounts[0].phoneNumberId);
            setDisplayPhoneNumber(waAccounts[0].displayPhoneNumber || `+${waAccounts[0].phoneNumberId}`);
            setIsCoexistence(Boolean(waAccounts[0].isCoexistence));
            setIsConnected(true);
          }

          // Agrupar contatos a partir das mensagens do projeto
          const byPhone = new Map<string, ContactItem>();
          for (const m of waMessages) {
            const peer = m.direction === 'outbound' ? m.to || m.from : m.from;
            const clean = String(peer || '').replace(/\D/g, '');
            if (!clean) continue;
            if (!byPhone.has(clean)) {
              byPhone.set(clean, {
                id: `proj_c_${clean}`,
                name: m.senderName || `Contato +${clean}`,
                phone: clean,
                lastMessage: m.text,
                lastTimestamp: m.timestamp,
              });
            }
          }
          const contactList = Array.from(byPhone.values());
          setContacts((prev) => {
            const pending = prev.filter(
              (p) =>
                (p.id.startsWith('temp_') || p.id.startsWith('lead_')) &&
                !contactList.some((c) => c.phone === p.phone)
            );
            return [...pending, ...contactList];
          });
          setSelectedContactPhone((prev) => (!prev && contactList.length > 0 ? contactList[0].phone : prev));
        }
        return;
      }

      const channelParam =
        activeChannelId && activeChannelId !== 'all'
          ? `&phoneNumberId=${encodeURIComponent(activeChannelId)}`
          : '';
      const res = await fetch(
        `/api/messages?auditor=${isAuditorMode ? 'true' : 'false'}${channelParam}`,
        {
          headers: {
            'x-auditor-mode': isAuditorMode ? 'true' : 'false',
          },
        }
      );
      if (res.ok) {
        const data: MetaStatus = await res.json();
        setMetaInfo(data);
        setMessages(data.messages || []);
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          setConnectedAccounts(data.accounts);
        }

        const contactList = data.contacts || [];
        setContacts((prev) => {
          // Preservar contatos temporários criados manualmente enquanto aguardam envio/resposta
          const pending = prev.filter(
            (p) =>
              (p.id.startsWith('temp_') || p.id.startsWith('lead_')) &&
              !contactList.some((c) => c.phone === p.phone)
          );
          return [...pending, ...contactList];
        });

        // Se nenhum contato estiver selecionado e houver contatos, selecionar o primeiro
        setSelectedContactPhone((prev) => {
          if (!prev && contactList.length > 0) {
            return contactList[0].phone;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens do chat:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isAuditorMode, activeChannelId, authMode, projectJwt, accountJwt]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessagesAndContacts();
      const interval = setInterval(fetchMessagesAndContacts, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchMessagesAndContacts]);

  // Rolar para o final do chat sempre que as mensagens mudarem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContactPhone]);

  // Login handler com validação segura de credenciais no servidor
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) {
      setLoginError('Preencha o e-mail e a senha para acessar.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        return;
      }

      // Autenticação autorizada com sucesso pelo servidor
      if (data.user?.role === 'agency' && data.accountJwt && data.account) {
        setAuthMode('agency');
        setAccountJwt(data.accountJwt);
        setAgencyAccount(data.account);
        setProjectJwt('');
        setClientProject(null);
        setUserRole('user');
        setIsAuditorMode(false);
        setIsAuthenticated(true);
        setCurrentView('projects');
        localStorage.setItem('automatas_account_jwt', data.accountJwt);
        localStorage.removeItem('automatas_project_jwt');
        localStorage.removeItem('automatas_app_auth');
        setLoginError('');
        return;
      }

      setAuthMode('admin');
      setProjectJwt('');
      setClientProject(null);
      setAccountJwt('');
      setAgencyAccount(null);
      localStorage.removeItem('automatas_project_jwt');
      localStorage.removeItem('automatas_account_jwt');
      setIsAuthenticated(true);
      const role: 'admin' | 'user' = data.user.role || 'admin';
      const isAuditor = Boolean(data.user.isAuditorMode);

      setUserRole(role);
      setIsAuditorMode(isAuditor);

      localStorage.setItem('automatas_app_auth', 'true');
      localStorage.setItem('automatas_app_role', role);
      localStorage.setItem('automatas_app_email', data.user.email);
      localStorage.setItem('automatas_app_auditor_mode', isAuditor ? 'true' : 'false');
      setLoginError('');
    } catch {
      setLoginError('Falha ao conectar com o servidor de autenticação.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Autocadastro de nova Conta / Agência escolhendo Plano (Mensal ou Anual -20%)
  const handleRegisterAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!regName.trim() || !regEmail.trim() || regPassword.trim().length < 4) {
      setLoginError('Preencha nome, e-mail válido e senha (mín. 4 caracteres).');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          planId: regPlan,
          billingCycle: regCycle,
          courtesyCode: regCourtesyCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.accountJwt) {
        setLoginError(data.error || 'Não foi possível criar a conta.');
        return;
      }

      setAuthMode('agency');
      setAccountJwt(data.accountJwt);
      setAgencyAccount(data.account);
      setUserRole('user');
      setIsAuditorMode(false);
      setIsAuthenticated(true);
      setCurrentView(data.courtesyApplied ? 'projects' : 'finance');
      setRegCourtesyCode('');
      localStorage.setItem('automatas_account_jwt', data.accountJwt);
      localStorage.removeItem('automatas_project_jwt');
      localStorage.removeItem('automatas_app_auth');
      setFeedbackMessage({
        text: data.courtesyApplied
          ? `Conta "${data.account.name}" criada com Código Promocional aplicado (Omnichannel Isento)!`
          : `Conta "${data.account.name}" criada! Finalize sua assinatura Asaas no Financeiro ou comece a criar projetos.`,
        type: 'success',
      });
    } catch {
      setLoginError('Falha ao conectar com o servidor de cadastro.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthMode('admin');
    setProjectJwt('');
    setClientProject(null);
    setAccountJwt('');
    setAgencyAccount(null);
    setIsAuditorMode(false);
    setShowMoreMenu(false);
    localStorage.removeItem('automatas_project_jwt');
    localStorage.removeItem('automatas_account_jwt');
    localStorage.removeItem('automatas_app_auth');
    localStorage.removeItem('automatas_app_role');
    localStorage.removeItem('automatas_app_email');
    localStorage.removeItem('automatas_app_auditor_mode');
    localStorage.removeItem('automatas_meta_user');
    setFbUserProfile(null);
  };

  // Alternador de Modo Auditoria Meta / Produção Real
  const toggleAuditorMode = () => {
    const nextMode = !isAuditorMode;
    setIsAuditorMode(nextMode);
    localStorage.setItem('automatas_app_auditor_mode', nextMode ? 'true' : 'false');
    setFeedbackMessage({
      text: nextMode
        ? '🛡️ Modo Auditoria Meta Ativado: Exibindo apenas contatos e histórico de teste isolados.'
        : '🚀 Modo Produção Ativado: Exibindo conversas reais do sistema.',
      type: 'success',
    });
  };

  // Alternador rápido de visão (Admin vs Simulação de Visão Cliente)
  const toggleRoleView = () => {
    const nextRole = userRole === 'admin' ? 'user' : 'admin';
    setUserRole(nextRole);
    localStorage.setItem('automatas_app_role', nextRole);
    if (nextRole === 'user' && currentView === 'users') {
      setCurrentView('finance');
    }
    setFeedbackMessage({
      text: `Visão alternada para: ${nextRole === 'admin' ? 'Administrador (Visão Completa Isenta)' : 'Cliente / Agência (Preview com Projetos, Financeiro e Minha Conta)'}`,
      type: 'success',
    });
  };

  // Ações de Gestão de Usuários (Admin)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserName.trim()) return;
    setIsSavingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createUserName.trim(),
          email: createUserEmail.trim() || null,
          phone: createUserPhone.trim() || null,
          source: createUserSource,
        }),
      });
      if (res.ok) {
        setFeedbackMessage({ text: 'Usuário cadastrado com sucesso!', type: 'success' });
        setShowCreateUserModal(false);
        setCreateUserName('');
        setCreateUserEmail('');
        setCreateUserPhone('');
        fetchAdminUsers();
        fetchMessagesAndContacts();
      } else {
        const err = await res.json();
        setFeedbackMessage({ text: err.error || 'Erro ao criar usuário', type: 'error' });
      }
    } catch {
      setFeedbackMessage({ text: 'Falha na comunicação com o servidor', type: 'error' });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUserStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setFeedbackMessage({ text: `Status atualizado para "${newStatus}"!`, type: 'success' });
        fetchAdminUsers();
      }
    } catch {
      setFeedbackMessage({ text: 'Erro ao atualizar status', type: 'error' });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir os dados e histórico de "${name}"? Esta ação não pode ser desfeita (Expurgo LGPD).`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?id=${id}&auditor=${isAuditorMode ? 'true' : 'false'}`, {
        method: 'DELETE',
        headers: {
          'x-auditor-mode': isAuditorMode ? 'true' : 'false',
        },
      });
      if (res.ok) {
        setFeedbackMessage({ text: `Dados de "${name}" expurgados com sucesso!`, type: 'success' });
        fetchAdminUsers();
        fetchMessagesAndContacts();
      } else {
        setFeedbackMessage({ text: 'Erro ao excluir usuário', type: 'error' });
      }
    } catch {
      setFeedbackMessage({ text: 'Erro ao excluir usuário', type: 'error' });
    }
  };

  const handleOpenChatWithUser = (phone: string | null, name: string) => {
    if (!phone) {
      setFeedbackMessage({ text: `Usuário "${name}" não possui número de WhatsApp informado.`, type: 'error' });
      return;
    }
    const clean = phone.replace(/\D/g, '');
    // Se o contato já existir na lista, seleciona; se não, cria temporário
    setContacts((prev) => {
      const exists = prev.some((c) => c.phone === clean);
      if (exists) return prev;
      return [
        {
          id: `lead_${Date.now()}`,
          name,
          phone: clean,
          lastMessage: 'Conversa iniciada pelo gerenciador',
          lastTimestamp: new Date().toISOString(),
        },
        ...prev,
      ];
    });
    setSelectedContactPhone(clean);
    setCurrentView('chat');
  };


  // Enviar Mensagem Ativa para o Contato Selecionado
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedContactPhone || !chatInputText.trim() || isSending) return;

    const messageText = chatInputText.trim();
    setIsSending(true);
    setFeedbackMessage(null);

    const sendFromPhoneId = activeChannelId !== 'all' ? activeChannelId : phoneId;

    try {
      const res =
        authMode === 'client' && projectJwt
          ? await fetch('/api/hub/dashboard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-project-jwt': projectJwt,
              },
              body: JSON.stringify({
                action: 'send-whatsapp',
                to: selectedContactPhone,
                text: messageText,
                phoneNumberId: sendFromPhoneId,
              }),
            })
          : await fetch('/api/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auditor-mode': isAuditorMode ? 'true' : 'false',
              },
              body: JSON.stringify({
                to: selectedContactPhone,
                text: messageText,
                phoneNumberId: sendFromPhoneId,
                isAuditorMode,
              }),
            });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'O servidor retornou uma resposta inesperada (Status ' + res.status + ').' };
      }

      if (res.ok && data.success) {
        setChatInputText('');
        setFeedbackMessage({
          text: `Mensagem enviada com sucesso para ${selectedContact?.name || selectedContactPhone}!`,
          type: 'success',
        });
        await fetchMessagesAndContacts();
      } else {
        setFeedbackMessage({
          text: data.error || 'Erro ao enviar mensagem via Meta Cloud API.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ text: 'Falha na conexão com o servidor.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  // Simular Mensagem Recebida do Contato Selecionado (ex: Cliente mandando 'Oi')
  const handleSimulateInboundFromContact = async (simulatedText = 'Olá! Gostaria de mais informações.') => {
    if (!selectedContactPhone || isSending) return;

    setIsSending(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContactPhone,
          text: simulatedText,
          isSimulatedInbound: true,
        }),
      });

      if (res.ok) {
        setFeedbackMessage({
          text: `Mensagem de "${simulatedText}" recebida de ${selectedContact?.name || selectedContactPhone} e resposta automática gerada!`,
          type: 'success',
        });
        await fetchMessagesAndContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Adicionar Novo Contato
  const handleCreateNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactPhone.trim()) return;

    const cleanPhone = newContactPhone.replace(/\D/g, '');
    const newContact: ContactItem = {
      id: `temp_${Date.now()}`,
      name: newContactName.trim() || `Contato ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      lastMessage: 'Nova conversa iniciada',
      lastTimestamp: new Date().toISOString(),
    };

    setContacts((prev) => [newContact, ...prev.filter((c) => c.phone !== cleanPhone)]);
    setSelectedContactPhone(cleanPhone);
    setShowNewContactModal(false);
    setNewContactName('');
    setNewContactPhone('');
  };

  // Contato Ativo
  const selectedContact = contacts.find((c) => c.phone === selectedContactPhone) || {
    id: 'unknown',
    name: 'Contato WhatsApp',
    phone: selectedContactPhone,
    lastMessage: '',
  };

  // Mensagens filtradas para o contato ativo
  const activeChatMessages = messages
    .filter((m) => {
      const cleanContact = selectedContactPhone.replace(/\D/g, '');
      const cleanFrom = m.from.replace(/\D/g, '');
      const cleanTo = (m.to || '').replace(/\D/g, '');
      return cleanFrom === cleanContact || cleanTo === cleanContact;
    })
    .reverse(); // Em ordem cronológica (mais antigas primeiro)

  // Filtragem de contatos na busca
  const filteredContacts = contacts.filter((c) => {
    const term = searchFilter.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.phone.includes(term);
  });

  // ==========================================
  // VIEW: TELA DE LOGIN (Caso não autenticado)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
        <header className="border-b border-slate-900 py-4 px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <span>
              automatas<span className="text-blue-500">.tech</span>
            </span>
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            Painel do Provedor de Tecnologia
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md p-7 rounded-3xl bg-slate-900/85 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-blue-400">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Automatas Omnichannel Hub
              </h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Acesso privado para projetos autorizados (WhatsApp &amp; Instagram Meta API)
              </p>
            </div>

            {/* Seletor de Modo de Login: E-mail (Admin/Agência) | Criar Conta | Chave JWT */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('email');
                  setLoginError('');
                }}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  loginTab === 'email'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('signup');
                  setLoginError('');
                }}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  loginTab === 'signup'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Planos / Criar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('jwt');
                  setLoginError('');
                }}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  loginTab === 'jwt'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Chave JWT</span>
              </button>
            </div>

            {loginError && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            {loginTab === 'jwt' ? (
              <form onSubmit={handleJwtLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Chave JWT de Login do Projeto
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={jwtInput}
                    onChange={(e) => setJwtInput(e.target.value)}
                    placeholder="Cole aqui o token JWT (eyJ...) fornecido para o seu projeto"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Acesso isolado apenas aos canais WhatsApp, Instagram e webhooks de 1 projeto específico.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <span>{isLoggingIn ? 'Validando Chave JWT...' : 'Acessar Meu Projeto'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : loginTab === 'signup' ? (
              <form onSubmit={handleRegisterAgency} className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Seu Nome ou Nome da Agência"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="E-mail profissional"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Senha (mín. 4 caracteres)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Escolha de Plano e Ciclo */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">Escolha seu Plano:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRegCycle('MONTHLY')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                          regCycle === 'MONTHLY' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegCycle('YEARLY')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                          regCycle === 'YEARLY' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Anual -20%
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {[
                      { id: 'whatsapp' as PlanId, label: 'WhatsApp', m: 'R$ 20', y: 'R$ 16', p: '3 proj.' },
                      { id: 'instagram' as PlanId, label: 'Instagram', m: 'R$ 20', y: 'R$ 16', p: '3 proj.' },
                      { id: 'omnichannel' as PlanId, label: 'Ambos', m: 'R$ 35', y: 'R$ 28', p: '5 proj.' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRegPlan(opt.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          regPlan === opt.id
                            ? 'bg-emerald-600/20 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{opt.label}</div>
                        <div className="text-xs font-mono font-bold text-emerald-300">
                          {regCycle === 'YEARLY' ? opt.y : opt.m}/mês
                        </div>
                        <div className="text-[9px] text-slate-400">{opt.p}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Projeto extra após o limite: +R$ 10/mês (+R$ 8/mês no anual). Cobrança via Asaas (Pix, Boleto ou Cartão).
                  </p>
                </div>

                <div className="space-y-1 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/25">
                  <label className="block text-[11px] font-semibold text-emerald-300">
                    Código Promocional (opcional)
                  </label>
                  <input
                    type="text"
                    value={regCourtesyCode}
                    onChange={(e) => setRegCourtesyCode(e.target.value.toUpperCase())}
                    placeholder="Ex: META-XXXX-XXXX"
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
                  />
                  {regCourtesyCode.trim() && (
                    <p className="text-[10px] text-emerald-400">
                      Código informado: se válido, libera acesso Omnichannel Isento (R$ 0,00) imediatamente.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <span>{isLoggingIn ? 'Criando Conta...' : 'Criar Conta & Gerenciar Projetos'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    E-mail (Admin, Auditoria Meta ou Conta/Agência)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: admin@automatas.tech ou sua conta"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Senha</label>
                    <span className="text-[11px] text-slate-500">Mínimo 4 caracteres</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span>{isLoggingIn ? 'Autenticando no Servidor...' : 'Entrar no Painel'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </main>

        <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} automatas.tech • WhatsApp Business Solution Provider</p>
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD CRM & CHAT WHATSAPP
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Navbar Compacta & Responsiva (Sem Overflow) */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 py-2.5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
          {/* Esquerda: Marca + Badge de Contexto */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <span className="hidden sm:inline">
                automatas<span className="text-blue-500">.tech</span>
              </span>
            </Link>

            {authMode === 'client' && clientProject ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold max-w-[160px] truncate">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">{clientProject.name}</span>
              </span>
            ) : authMode === 'agency' && agencyAccount ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold max-w-[170px] truncate">
                <Layers className="w-3 h-3 shrink-0" />
                <span className="truncate">{agencyAccount.name}</span>
              </span>
            ) : (
              isConnected && (
                <span
                  className="hidden xl:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium shrink-0"
                  title="WhatsApp Cloud API & Coexistência Conectada"
                >
                  <Radio className="w-3 h-3 animate-pulse shrink-0" />
                  <span>{isCoexistence ? 'WA Coexistência' : 'Cloud API'}</span>
                </span>
              )
            )}
          </div>

          {/* Centro: Workspaces Principais (WhatsApp | Instagram | Projetos | Financeiro | Contas) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-2xl text-xs shrink-0">
            {canAccessWhatsapp && (
              <button
                type="button"
                onClick={() => setCurrentView('chat')}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentView === 'chat'
                    ? 'bg-emerald-600/25 text-emerald-200 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>
            )}

            {canAccessInstagram && (
              <button
                type="button"
                onClick={() => setCurrentView('instagram')}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentView === 'instagram'
                    ? 'bg-fuchsia-600/25 text-fuchsia-200 border border-fuchsia-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Instagram className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Instagram</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentView('projects')}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'projects'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {authMode === 'client'
                  ? 'Meu Projeto'
                  : authMode === 'agency'
                    ? 'Meus Projetos'
                    : 'Projetos'}
              </span>
            </button>

            {(isAdmin || isPreviewingClient || authMode === 'agency' || authMode === 'client') && (
              <button
                type="button"
                onClick={() => setCurrentView('finance')}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentView === 'finance'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Financeiro</span>
              </button>
            )}

            {(isPreviewingClient || authMode === 'agency' || authMode === 'client') && (
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentView === 'profile'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Minha Conta</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setCurrentView('users')}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentView === 'users'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Contas</span>
              </button>
            )}
          </nav>

          {/* Direita: Ação Rápida + Menu Compacto + Sair */}
          <div className="flex items-center gap-2 shrink-0 relative">
            {/* Atalho rápido para retornar ao Modo Admin quando o Admin está simulando visão de Atendente */}
            {authMode === 'admin' && userRole === 'user' && (
              <button
                type="button"
                onClick={toggleRoleView}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold transition-all cursor-pointer"
                title="Você está pré-visualizando como Atendente. Clique para voltar à visão de Administrador."
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Voltar p/ Admin</span>
              </button>
            )}

            {currentView === 'chat' && (
              <button
                type="button"
                onClick={() => handleLaunchEmbeddedSignup()}
                disabled={isEmbeddedSigningUp}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-blue-300 transition-all cursor-pointer font-medium"
                title="Conectar WhatsApp Business via Embedded Signup (Coexistência)"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>{isEmbeddedSigningUp ? 'Conectando...' : '+ Conectar WhatsApp'}</span>
              </button>
            )}

            {/* Dropdown "Mais" agrupando Configurações Meta, Auditoria, Privacidade e Legal */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setShowMoreMenu((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Opções</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showMoreMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-2 space-y-1 z-50 text-xs">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowMetaSettingsModal(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-blue-400" />
                          <span>Configurações Meta &amp; Webhooks</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toggleAuditorMode();
                            setShowMoreMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-900 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Modo Auditoria Meta</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {isAuditorMode ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </>
                    )}

                    {/* Sempre visível para conta Admin mesmo quando simulando visão de Atendente */}
                    {authMode === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          toggleRoleView();
                          setShowMoreMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                          userRole === 'user'
                            ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 border border-amber-500/30 font-semibold'
                            : 'text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <span>Visão: {userRole === 'admin' ? 'Admin' : 'Cliente'}</span>
                        <span className="text-[10px] text-blue-400">
                          {userRole === 'admin' ? 'Simular Cliente' : 'Voltar p/ Admin'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setPrivacyMode(!privacyMode);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-900 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {privacyMode ? (
                          <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Ocultar Dados (Gravação)</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {privacyMode ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <Link
                      href="/privacidade"
                      onClick={() => setShowMoreMenu(false)}
                      className="w-full px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Política de Privacidade</span>
                    </Link>
                    <Link
                      href="/termos"
                      onClick={() => setShowMoreMenu(false)}
                      className="w-full px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Termos de Serviço</span>
                    </Link>
                    <Link
                      href="/exclusao-dados"
                      onClick={() => setShowMoreMenu(false)}
                      className="w-full px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Exclusão de Dados (LGPD)</span>
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setShowMoreMenu(false)}
                      className="w-full px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Site Principal</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Menu de navegação"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800/80 px-4 pb-2 space-y-1 bg-slate-950 animate-in fade-in slide-in-from-top-2">
            <button
              type="button"
              onClick={() => {
                setCurrentView('chat');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                currentView === 'chat' ? 'bg-emerald-600/25 text-emerald-200 font-semibold' : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Business</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('instagram');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                currentView === 'instagram' ? 'bg-fuchsia-600/25 text-fuchsia-200 font-semibold' : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Instagram className="w-4 h-4 text-fuchsia-400" />
              <span>Instagram API</span>
            </button>

            {(isAdmin || authMode === 'agency' || authMode === 'client') && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('projects');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                  currentView === 'projects' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>
                  {authMode === 'client'
                    ? 'Meu Projeto & Webhooks'
                    : authMode === 'agency'
                      ? 'Meus Projetos'
                      : 'Hub & Projetos'}
                </span>
              </button>
            )}

            {(isAdmin || isPreviewingClient || authMode === 'agency' || authMode === 'client') && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('finance');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                  currentView === 'finance' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Financeiro &amp; Planos (Asaas)</span>
              </button>
            )}

            {(isPreviewingClient || authMode === 'agency' || authMode === 'client') && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                  currentView === 'profile' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>Minha Conta &amp; Dados</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLaunchEmbeddedSignup();
              }}
              disabled={isEmbeddedSigningUp}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-blue-300 bg-[#1877F2]/10 border border-[#1877F2]/30 hover:bg-[#1877F2]/20 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>+ Conectar WhatsApp (Embedded Signup)</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('users');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                    currentView === 'users' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Gerenciar Contas &amp; Usuários</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMetaSettingsModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span>Configurações Meta &amp; Webhooks</span>
                </button>
              </>
            )}

            <Link
              href="/exclusao-dados"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Instruções de Exclusão de Dados (LGPD)</span>
            </Link>
            <Link
              href="/privacidade"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Política de Privacidade</span>
            </Link>
            <Link
              href="/termos"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Termos de Serviço</span>
            </Link>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Voltar ao Site Principal</span>
            </Link>
          </div>
        )}
      </header>

      {/* Banner Informativo do Modo Auditoria Meta */}
      {isAuditorMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-6 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>Ambiente de Homologação Meta (App Review Sandbox):</strong> Exibindo exclusivamente contatos e histórico de teste. Conversas e dados de clientes reais estão isolados e protegidos.
            </span>
          </div>
          <button
            type="button"
            onClick={toggleAuditorMode}
            className="text-[11px] px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-100 transition-colors cursor-pointer"
          >
            Alternar para Produção Real
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="container mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col space-y-4 max-w-7xl">
        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="underline ml-4 hover:opacity-80">
              Fechar
            </button>
          </div>
        )}



        {/* RENDERIZAÇÃO CONDICIONAL: GERENCIAMENTO DE CONTAS OU CHAT */}
        {currentView === 'users' && isAdmin ? (
          /* ======================================================== */
          /* TELA EXCLUSIVA DE ADMIN: CLIENTES DO HUB + LEADS LGPD    */
          /* ======================================================== */
          <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 self-start text-xs">
              <button
                type="button"
                onClick={() => setAdminAccountsSubTab('clients')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminAccountsSubTab === 'clients'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Clientes do Hub (Planos &amp; Projetos)</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminAccountsSubTab('leads')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminAccountsSubTab === 'leads'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contatos &amp; Leads (LGPD / WhatsApp)</span>
              </button>
            </div>

            {adminAccountsSubTab === 'clients' ? (
              <HubClientsDirectoryPanel />
            ) : (
              <div className="flex-1 flex flex-col space-y-5">
            {/* Header da Tela de Usuários */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-100">Gerenciamento de Contas e Usuários</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhe contatos originados via WhatsApp Cloud API, leads do site e controle solicitações de exclusão LGPD.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAdminUsers}
                  disabled={isLoadingUsers}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/30"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Novo Usuário / Lead</span>
                </button>
              </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Total de Cadastros</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 font-mono">{userStats.total}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Todos os registros no banco</div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Contas Ativas</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">{userStats.active}</div>
                <div className="text-[10px] text-emerald-500/70 mt-0.5">Comunicação liberada</div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>WhatsApp Bot</span>
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">{userStats.whatsapp}</div>
                <div className="text-[10px] text-cyan-500/70 mt-0.5">Iniciados pelo WhatsApp</div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Solicitações LGPD</span>
                  <Trash2 className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{userStats.deletions}</div>
                <div className="text-[10px] text-amber-500/70 mt-0.5">Expurgos pendentes/efetuados</div>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Abas de Filtro */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'active', label: 'Ativos' },
                    { id: 'whatsapp', label: 'WhatsApp Bot' },
                    { id: 'leads', label: 'Leads do Site' },
                    { id: 'deleted', label: 'Exclusão LGPD' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUserFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                      userFilter === tab.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Input de Busca */}
              <div className="relative min-w-[260px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Usuário / Nome</th>
                      <th className="px-5 py-3.5">Contato (WhatsApp / E-mail)</th>
                      <th className="px-5 py-3.5">Origem</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Data Registro</th>
                      <th className="px-5 py-3.5 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-xs">
                          {isLoadingUsers ? 'Carregando usuários...' : 'Nenhum usuário encontrado para este filtro.'}
                        </td>
                      </tr>
                    ) : (
                      adminUsers.map((user) => {
                        const initials = user.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                            {/* Nome e ID */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-slate-200 text-xs shrink-0">
                                  {initials || <User className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{user.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Contato */}
                            <td className="px-5 py-3.5">
                              <div className="space-y-0.5">
                                {user.phone ? (
                                  <div className="font-mono text-slate-300 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    <span>{user.phone}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic">Sem telefone</span>
                                )}
                                {user.email && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                                    <Mail className="w-3 h-3 text-slate-500" />
                                    <span>{user.email}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Origem */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                  user.source === 'whatsapp_bot'
                                    ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                                    : user.source === 'whatsapp_coexistence'
                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                    : user.source === 'whatsapp_embedded_signup'
                                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                    : user.source === 'lead_form'
                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                    : user.source === 'meta_app'
                                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                {user.source === 'whatsapp_bot'
                                  ? 'WhatsApp Bot'
                                  : user.source === 'whatsapp_coexistence'
                                  ? 'Coexistência WA'
                                  : user.source === 'whatsapp_embedded_signup'
                                  ? 'Embedded Signup'
                                  : user.source === 'lead_form'
                                  ? 'Formulário Lead'
                                  : user.source === 'meta_app'
                                  ? 'Meta App'
                                  : 'Manual Admin'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                  user.status === 'active'
                                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                    : user.status === 'blocked'
                                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    user.status === 'active'
                                      ? 'bg-emerald-400 animate-pulse'
                                      : user.status === 'blocked'
                                      ? 'bg-amber-400'
                                      : 'bg-red-400'
                                  }`}
                                />
                                <span className="capitalize">
                                  {user.status === 'active'
                                    ? 'Ativo'
                                    : user.status === 'blocked'
                                    ? 'Bloqueado'
                                    : user.status === 'pending_deletion'
                                    ? 'Pendente Exclusão'
                                    : 'Excluído'}
                                </span>
                              </span>
                            </td>

                            {/* Data */}
                            <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(user.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Ações */}
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {user.phone && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenChatWithUser(user.phone, user.name)}
                                    className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors"
                                    title="Abrir Conversa WhatsApp com este cliente"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateUserStatus(user.id, user.status === 'active' ? 'blocked' : 'active')
                                  }
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                  title={user.status === 'active' ? 'Bloquear usuário' : 'Reativar usuário'}
                                >
                                  {user.status === 'active' ? (
                                    <Ban className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/40 transition-colors"
                                  title="Expurgar dados permanentemente (LGPD)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}
          </div>
        ) : currentView === 'profile' && (isPreviewingClient || authMode === 'agency' || authMode === 'client') ? (
          <ClientProfilePanel
            mode={authMode === 'client' ? 'client' : 'agency'}
            accountJwt={accountJwt}
            projectJwt={projectJwt}
            previewAsClient={isPreviewingClient}
            onAccountUpdated={setAgencyAccount}
            onGoToFinance={() => setCurrentView('finance')}
          />
        ) : currentView === 'finance' ? (
          <FinancialDashboardPanel
            mode={isPreviewingClient ? 'agency' : authMode}
            accountJwt={accountJwt}
            projectJwt={projectJwt}
            previewAsClient={isPreviewingClient}
            onAccountUpdated={setAgencyAccount}
          />
        ) : currentView === 'instagram' ? (
          <InstagramWorkspacePanel
            mode={authMode}
            projectJwt={projectJwt}
            accountJwt={accountJwt}
            metaAppId={metaAppId}
            onRefreshParent={fetchMessagesAndContacts}
          />
        ) : currentView === 'projects' ? (
          <HubProjectsPanel
            mode={authMode}
            projectJwt={projectJwt}
            accountJwt={accountJwt}
            onAccountUpdated={setAgencyAccount}
          />
        ) : (
          /* ======================================================== */
          /* TELA PADRÃO: CHAT & ATENDIMENTO WHATSAPP (2 COLUNAS)     */
          /* ======================================================== */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl min-h-[620px]">
          {/* COLUNA ESQUERDA: LISTA DE CONTATOS (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/50">
            {/* Header da lista de contatos */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-slate-100">Conversas</h2>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {contacts.length}
                </span>
              </div>
              <button
                onClick={() => setShowNewContactModal(true)}
                className="text-xs text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1"
                title="Iniciar conversa com novo número"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Novo</span>
              </button>
            </div>

            {/* Seletor de Números WhatsApp Conectados */}
            {connectedAccounts.length > 0 && (
              <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  <span>Números Conectados ({connectedAccounts.length})</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowMetaSettingsModal(true)}
                      className="text-blue-400 hover:text-blue-300 normal-case cursor-pointer"
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {connectedAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleSelectChannel('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                        activeChannelId === 'all'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Todos ({connectedAccounts.length})
                    </button>
                  )}
                  {connectedAccounts.map((acc) => {
                    const isActive = activeChannelId === acc.phoneNumberId;
                    const shortLabel =
                      acc.displayPhoneNumber ||
                      (privacyMode
                        ? `••••${acc.phoneNumberId.slice(-4)}`
                        : acc.phoneNumberId);
                    return (
                      <button
                        key={acc.phoneNumberId}
                        type="button"
                        onClick={() => handleSelectChannel(acc.phoneNumberId)}
                        title={`${acc.verifiedName || acc.userName || 'WhatsApp'} • ID: ${acc.phoneNumberId}`}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{shortLabel}</span>
                        {acc.isCoexistence && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Coex
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Barra de Pesquisa */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar por nome ou número..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Lista com Scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <p>Nenhuma conversa ativa no momento.</p>
                  <button
                    type="button"
                    onClick={() => setShowNewContactModal(true)}
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar conversa</span>
                  </button>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = contact.phone === selectedContactPhone;
                  const initials = contact.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactPhone(contact.phone)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/10 border-l-4 border-l-blue-500 text-slate-100'
                          : 'hover:bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {initials || <User className="w-4 h-4" />}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-xs truncate text-slate-200">
                            {contact.name}
                          </span>
                          {contact.lastTimestamp && (
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(contact.lastTimestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mb-1 truncate">
                          {contact.phone}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate leading-snug">
                          {contact.lastMessage || 'Clique para abrir a conversa'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {/* Rodapé da Coluna de Conversas com Links de Conformidade */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Meta Compliant</span>
              </span>
              <div className="flex items-center gap-2">
                <Link href="/exclusao-dados" className="hover:text-red-400 transition-colors" title="Exclusão de Dados LGPD">
                  Exclusão
                </Link>
                <span>•</span>
                <Link href="/privacidade" className="hover:text-blue-400 transition-colors" title="Política de Privacidade">
                  Privacidade
                </Link>
                <span>•</span>
                <Link href="/termos" className="hover:text-amber-400 transition-colors" title="Termos de Serviço">
                  Termos
                </Link>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: JANELA DO CHAT ATIVO (8 cols) */}
          <div className="md:col-span-8 flex flex-col bg-slate-950/80">
            {/* Header do Chat Ativo */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                  {selectedContact.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{selectedContact.name}</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      WhatsApp Ativo
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{selectedContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Chat */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchMessagesAndContacts}
                  disabled={isLoadingMessages}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  title="Atualizar mensagens"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Corpo de Mensagens (Thread) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-[400px] max-h-[520px]">
              {!selectedContactPhone ? (
                <div className="py-20 text-center text-slate-500 text-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-300 text-sm">Nenhuma conversa selecionada</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Selecione uma conversa ou inicie um chat com qualquer número de WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNewContactModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-md shadow-blue-900/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar Nova Conversa</span>
                  </button>
                </div>
              ) : activeChatMessages.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="font-semibold text-slate-400">Nenhuma mensagem com este contato ainda.</p>
                  <p className="text-[11px] text-slate-600">
                    Digite uma mensagem abaixo no campo de envio para disparar via WhatsApp Cloud API.
                  </p>
                </div>
              ) : (
                activeChatMessages.map((msg) => {
                  const isInbound = msg.direction === 'inbound';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                          isInbound
                            ? 'bg-slate-900 text-slate-100 rounded-bl-sm border border-slate-800'
                            : 'bg-blue-600 text-white rounded-br-sm'
                        }`}
                      >
                        <div className="text-[10px] font-semibold opacity-75 mb-1 flex items-center justify-between gap-3">
                          <span>{isInbound ? msg.senderName || selectedContact.name : 'Bot automatas.tech'}</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                          {!isInbound && <CheckCheck className="w-3 h-3 text-blue-200" />}
                          <span className="capitalize">{msg.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar do Chat */}
            <div className="border-t border-slate-800 bg-slate-950">
              {connectedAccounts.length > 1 && (
                <div className="px-4 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>
                    Canal de envio:{' '}
                    <strong className="text-slate-300 font-mono">
                      {(() => {
                        const targetId = activeChannelId !== 'all' ? activeChannelId : phoneId;
                        const found = connectedAccounts.find((a) => a.phoneNumberId === targetId);
                        return found?.displayPhoneNumber || `ID ••••${targetId.slice(-4)}`;
                      })()}
                    </strong>
                  </span>
                  {activeChannelId === 'all' && (
                    <span className="text-amber-400/80">
                      Selecione um número específico acima para alternar o remetente
                    </span>
                  )}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="p-3.5 flex items-center gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Digite uma mensagem para ${selectedContact.name}...`}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isSending || !chatInputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Modal: Cadastro Manual de Novo Usuário (Admin) */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Cadastrar Novo Usuário / Lead</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={createUserName}
                  onChange={(e) => setCreateUserName(e.target.value)}
                  placeholder="Ex: Carlos Oliveira"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp (com DDI e DDD)</label>
                <input
                  type="text"
                  value={createUserPhone}
                  onChange={(e) => setCreateUserPhone(e.target.value)}
                  placeholder="Ex: 5511999998888"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={createUserEmail}
                  onChange={(e) => setCreateUserEmail(e.target.value)}
                  placeholder="Ex: carlos@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Origem do Cadastro</label>
                <select
                  value={createUserSource}
                  onChange={(e) => setCreateUserSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="manual_admin">Cadastro Manual pelo Painel</option>
                  <option value="whatsapp_bot">Contato de WhatsApp</option>
                  <option value="lead_form">Lead de Formulário do Site</option>
                  <option value="meta_app">Homologação Meta App</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser || !createUserName.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Salvar Usuário</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Contato */}
      {showNewContactModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Iniciar Conversa com Número</h3>
            <form onSubmit={handleCreateNewContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Contato</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Ex: João Cliente"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone WhatsApp (com DDI e DDD)</label>
                <input
                  type="text"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="Ex: 5575999070840"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Abrir Conversa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configurações Meta & Telas Exigidas */}
      {showMetaSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Configurações de Produção & Meta Webhooks</h3>
                  <p className="text-xs text-slate-400">Dados técnicos de integração e links de conformidade exigidos pela Meta</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    privacyMode
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={privacyMode ? 'Modo Gravação ativo: dados mascarados' : 'Clique para ocultar dados para gravação'}
                >
                  {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{privacyMode ? 'Modo Gravação: Ativo' : 'Ocultar Dados'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMetaSettingsModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Aviso de Proteção de Dados para Gravação */}
            {privacyMode && (
              <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span><strong>Modo de Gravação Seguro:</strong> Tokens e identificadores sensíveis foram mascarados para demonstração e análise da Meta.</span>
                </div>
              </div>
            )}

            {/* Status da Conexão */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-emerald-300">WhatsApp Cloud API Conectada & Operacional</div>
                  <div className="text-[11px] text-emerald-400/80">Recebendo e enviando mensagens em tempo real</div>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                SLA: Ativo
              </span>
            </div>

            {/* Endpoints e Tokens */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  URL de Callback do Webhook WhatsApp (Produção)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://api.automatas.tech/webhook"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('https://api.automatas.tech/webhook', 'webhook')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'webhook' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fuchsia-300/90 mb-1">
                  URL de Callback do Webhook Instagram (Produção)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://api.automatas.tech/webhook/instagram"
                    className="flex-1 bg-slate-950 border border-fuchsia-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-fuchsia-200 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('https://api.automatas.tech/webhook/instagram', 'webhook_ig')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedField === 'webhook_ig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'webhook_ig' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Token de Verificação (Verify Token)</span>
                    </label>
                    <span className="text-[10px] text-amber-400/80">Segredo Técnico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={privacyMode && !showVerifyToken ? 'password' : 'text'}
                        readOnly
                        value="automatas_meta_verify_2026"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 select-all pr-9 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVerifyToken(!showVerifyToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title={showVerifyToken ? 'Ocultar token' : 'Visualizar token'}
                      >
                        {showVerifyToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('automatas_meta_verify_2026', 'token')}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar token"
                    >
                      {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-400">
                      ID do Telefone (Phone Number ID)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={privacyMode && !showPhoneId ? 'password' : 'text'}
                        readOnly
                        value={phoneId}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 select-all pr-9 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPhoneId(!showPhoneId)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title={showPhoneId ? 'Ocultar ID' : 'Visualizar ID'}
                      >
                        {showPhoneId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(phoneId, 'phoneId')}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar ID do Telefone"
                    >
                      {copiedField === 'phoneId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Conexão Facebook SDK & Meta App</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempAppId(metaAppId);
                    setTempConfigId(metaConfigId);
                    setShowAppIdModal(true);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Alterar Credenciais
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Meta App ID</span>
                    <span className="text-slate-200">
                      {privacyMode && !showMetaAppId && metaAppId
                        ? `••••••••${metaAppId.slice(-4)}`
                        : metaAppId || 'Não configurado'}
                    </span>
                  </div>
                  {metaAppId && (
                    <button
                      type="button"
                      onClick={() => setShowMetaAppId(!showMetaAppId)}
                      className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      title={showMetaAppId ? 'Ocultar ID' : 'Visualizar ID'}
                    >
                      {showMetaAppId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Config ID (Embedded)</span>
                    <span className="text-slate-200">
                      {privacyMode && !showMetaConfigId && metaConfigId
                        ? `••••••••${metaConfigId.slice(-4)}`
                        : metaConfigId || 'Não configurado'}
                    </span>
                  </div>
                  {metaConfigId && (
                    <button
                      type="button"
                      onClick={() => setShowMetaConfigId(!showMetaConfigId)}
                      className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      title={showMetaConfigId ? 'Ocultar ID' : 'Visualizar ID'}
                    >
                      {showMetaConfigId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {wabaId && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">WhatsApp Business Account (WABA ID)</span>
                    <span className="text-emerald-400">
                      {privacyMode && !showWabaId ? `••••••••${wabaId.slice(-4)}` : wabaId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWabaId(!showWabaId)}
                    className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    title={showWabaId ? 'Ocultar ID' : 'Visualizar ID'}
                  >
                    {showWabaId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {businessId && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Business Portfolio ID</span>
                    <span className="text-slate-200">
                      {privacyMode ? `••••••••${businessId.slice(-4)}` : businessId}
                    </span>
                  </div>
                </div>
              )}

              {connectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Números WhatsApp Conectados ({connectedAccounts.length})</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      Clique para alternar o canal ativo no Chat
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {connectedAccounts.map((acc) => {
                      const isChannelActive = activeChannelId === acc.phoneNumberId;
                      return (
                        <div
                          key={acc.phoneNumberId}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                            isChannelActive
                              ? 'bg-blue-950/30 border-blue-500/40'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-mono font-semibold text-slate-100 truncate">
                                {acc.displayPhoneNumber || `ID: ${acc.phoneNumberId}`}
                              </span>
                              {acc.verifiedName && (
                                <span className="text-[11px] text-slate-400 truncate">
                                  ({acc.verifiedName})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {acc.isDefaultEnv && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                                  Principal
                                </span>
                              )}
                              {acc.isCoexistence ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                                  Coexistência
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                  Cloud API
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                            <span>
                              Phone ID:{' '}
                              {privacyMode ? `••••${acc.phoneNumberId.slice(-4)}` : acc.phoneNumberId}
                              {acc.wabaId
                                ? ` • WABA: ${privacyMode ? `••••${acc.wabaId.slice(-4)}` : acc.wabaId}`
                                : ''}
                            </span>
                            <div className="flex items-center gap-1.5 font-sans">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectChannel(acc.phoneNumberId);
                                  setShowMetaSettingsModal(false);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
                                  isChannelActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                              >
                                {isChannelActive ? 'Ativo no Chat' : 'Usar no Chat'}
                              </button>
                              {acc.isCoexistence && (
                                <button
                                  type="button"
                                  onClick={() => handleManualCoexistenceSync(acc.phoneNumberId)}
                                  disabled={isSyncingCoexistence}
                                  className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                                >
                                  Sincronizar (24h)
                                </button>
                              )}
                            </div>
                          </div>

                          {acc.syncWarnings && acc.syncWarnings.length > 0 && (
                            <div className="text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg px-2 py-1">
                              {acc.syncWarnings.join(' | ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status do modo atual & Toggle Coexistência */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Modo da Conexão Selecionada:</span>
                  {isCoexistence ? (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-[11px]">
                      Coexistência Ativa
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[11px]">
                      Cloud API Padrão
                    </span>
                  )}
                </div>
                {displayPhoneNumber && (
                  <span className="text-[11px] font-mono text-slate-400">{displayPhoneNumber}</span>
                )}
              </div>

              <label className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:border-blue-500/40 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                    <span>Habilitar Coexistência — WhatsApp Business App + Cloud API</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-normal">
                      v4
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Envia <code className="text-blue-300">featureType: &quot;whatsapp_business_app_onboarding&quot;</code> no Embedded Signup para exibir a opção de conectar um número já ativo no WhatsApp Business App.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={coexistenceEnabled}
                  onChange={(e) => setCoexistenceEnabled(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                />
              </label>

              {isCoexistence && (
                <button
                  type="button"
                  onClick={() => handleManualCoexistenceSync()}
                  disabled={isSyncingCoexistence}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCoexistence ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingCoexistence
                      ? 'Solicitando Sincronização à Meta...'
                      : 'Sincronizar Contatos e Histórico (24h)'}
                  </span>
                </button>
              )}

              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-blue-300">
                  Campos de Webhook exigidos no Meta App Dashboard (Coexistência):
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  messages • smb_message_echoes • smb_app_state_sync • history • account_update
                </div>
              </div>

              {/* Gatilhos de Demonstração / Onboarding Meta */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMetaSettingsModal(false);
                    setCurrentView('instagram');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Abrir Workspace Instagram (Unified Login)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchEmbeddedSignup()}
                  disabled={isEmbeddedSigningUp}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>
                    {isEmbeddedSigningUp
                      ? 'Abrindo Onboarding...'
                      : coexistenceEnabled
                        ? 'Abrir Embedded Signup (Coexistência)'
                        : 'Testar Embedded Signup'}
                  </span>
                </button>
              </div>
            </div>

            {/* Telas Obrigatórias Exigidas pela Meta */}
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Páginas de Auditoria & Conformidade Exigidas pela Meta</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Link
                  href="/exclusao-dados"
                  target="_blank"
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/40 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Exclusão de Dados</div>
                    <div className="text-[10px] text-slate-500">LGPD & Meta Callback</div>
                  </div>
                </Link>

                <Link
                  href="/privacidade"
                  target="_blank"
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Privacidade</div>
                    <div className="text-[10px] text-slate-500">Política Oficial</div>
                  </div>
                </Link>

                <Link
                  href="/termos"
                  target="_blank"
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Termos de Serviço</div>
                    <div className="text-[10px] text-slate-500">Uso da Plataforma</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMetaSettingsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configurar Meta App ID & Config ID */}
      {showAppIdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Credenciais Meta App</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAppIdModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Informe o <strong>App ID</strong> obtido no painel de desenvolvedores da Meta (<strong>developers.facebook.com</strong>). Ele será salvo localmente para inicializar o pop-up do Facebook Login no seu navegador.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meta App ID (Obrigatório)
                </label>
                <input
                  type="text"
                  value={tempAppId}
                  onChange={(e) => setTempAppId(e.target.value.trim())}
                  placeholder="ex: 1319012711295096"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Embedded Signup Config ID (Obrigatório p/ Embedded Signup e Coexistência)
                </label>
                <input
                  type="text"
                  value={tempConfigId}
                  onChange={(e) => setTempConfigId(e.target.value.trim())}
                  placeholder="ex: 987654321098765"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Obtido em <strong>Meta App Dashboard &gt; Facebook Login for Business &gt; Configurações</strong> (template Embedded Signup do WhatsApp).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAppIdModal(false)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveAppCredentials(tempAppId, tempConfigId)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-900/30"
              >
                Salvar & Inicializar SDK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500 bg-slate-950">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} automatas.tech • Solução Integrada WhatsApp Business Cloud API</p>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <Link href="/exclusao-dados" className="hover:text-white transition-colors">Exclusão de Dados</Link>
            <span>•</span>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <span>•</span>
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Serviço</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
