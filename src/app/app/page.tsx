'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  initFacebookSdk,
  loginWithFacebook,
  launchWhatsAppEmbeddedSignup,
  getFacebookUserProfile,
  FacebookUserProfile,
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
} from 'lucide-react';

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

interface MetaStatus {
  configured: boolean;
  phoneNumberId: string | null;
  verifyTokenConfigured: boolean;
  apiVersion: string;
  appId: string;
  totalMessages: number;
  messages: MessageItem[];
  contacts?: ContactItem[];
}

export default function AppPage() {
  // Estado de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estado da Conexão WhatsApp & Meta
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [phoneId, setPhoneId] = useState<string>('1275823778955658');
  const [wabaId, setWabaId] = useState<string>('');
  const [metaAppId, setMetaAppId] = useState<string>(process.env.NEXT_PUBLIC_META_APP_ID || '');
  const [metaConfigId, setMetaConfigId] = useState<string>(process.env.NEXT_PUBLIC_META_CONFIG_ID || '');
  const [fbUserProfile, setFbUserProfile] = useState<FacebookUserProfile | null>(null);
  const [isFbLoggingIn, setIsFbLoggingIn] = useState<boolean>(false);
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

  // Controle de Visualização e Papel de Acesso (Admin vs Atendente)
  const [currentView, setCurrentView] = useState<'chat' | 'users'>('chat');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');
  const isAdmin = userRole === 'admin';

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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Inicializar autenticação e papel salvos + Meta credentials
  useEffect(() => {
    const savedAuth = localStorage.getItem('automatas_app_auth');
    const savedRole = localStorage.getItem('automatas_app_role') as 'admin' | 'user' | null;
    const savedEmail = localStorage.getItem('automatas_app_email');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      if (savedRole) setUserRole(savedRole);
      if (savedEmail) setEmail(savedEmail);
    }

    const savedAppId = localStorage.getItem('automatas_meta_app_id') || process.env.NEXT_PUBLIC_META_APP_ID || '';
    const savedConfigId = localStorage.getItem('automatas_meta_config_id') || process.env.NEXT_PUBLIC_META_CONFIG_ID || '';
    const savedPhoneId = localStorage.getItem('automatas_meta_phone_id');
    const savedWabaId = localStorage.getItem('automatas_meta_waba_id');
    const savedUser = localStorage.getItem('automatas_meta_user');

    if (savedAppId) setMetaAppId(savedAppId);
    if (savedConfigId) setMetaConfigId(savedConfigId);
    if (savedPhoneId) {
      setPhoneId(savedPhoneId);
      setDisplayPhoneNumber(`+${savedPhoneId}`);
    }
    if (savedWabaId) setWabaId(savedWabaId);
    if (savedUser) {
      try {
        setFbUserProfile(JSON.parse(savedUser));
      } catch {}
    }

    // Inicializa SDK do Facebook
    if (savedAppId) {
      initFacebookSdk(savedAppId);
    }

    // Consultar sessão ativa no backend
    fetch('/api/meta/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          if (data.session.phoneNumberId) {
            setPhoneId(data.session.phoneNumberId);
            setDisplayPhoneNumber(`+${data.session.phoneNumberId}`);
          }
          if (data.session.wabaId) setWabaId(data.session.wabaId);
          if (data.session.userName && !savedUser) {
            setFbUserProfile({
              id: data.session.userId || 'meta-user',
              name: data.session.userName,
              email: data.session.userEmail,
              pictureUrl: data.session.userPicture,
            });
          }
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

  const handleFacebookLogin = async () => {
    setLoginError('');
    if (!metaAppId) {
      setTempAppId(metaAppId);
      setTempConfigId(metaConfigId);
      setShowAppIdModal(true);
      return;
    }

    setIsFbLoggingIn(true);
    try {
      await initFacebookSdk(metaAppId);
      const res = await loginWithFacebook();

      if (res.status === 'connected' && res.authResponse) {
        const profile = await getFacebookUserProfile();
        if (profile) {
          setFbUserProfile(profile);
          localStorage.setItem('automatas_meta_user', JSON.stringify(profile));
          setEmail(profile.email || `${profile.id}@facebook.user`);
        }

        // Registrar sessão no backend
        await fetch('/api/meta/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authType: 'facebook_login',
            userId: profile?.id || res.authResponse.userID,
            userName: profile?.name || 'Usuário Facebook Login',
            userEmail: profile?.email || null,
            userPicture: profile?.pictureUrl || null,
            accessToken: res.authResponse.accessToken,
          }),
        });

        setIsAuthenticated(true);
        setUserRole('admin');
        localStorage.setItem('automatas_app_auth', 'true');
        localStorage.setItem('automatas_app_role', 'admin');
        localStorage.setItem('automatas_app_email', profile?.email || `${profile?.id || 'admin'}@facebook.user`);
        setFeedbackMessage({
          text: `Autenticado com sucesso via Facebook como ${profile?.name || 'Administrador'}!`,
          type: 'success',
        });
      } else {
        setLoginError(res.error || 'Não foi possível concluir o Login com o Facebook. Verifique as permissões.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(msg);
    } finally {
      setIsFbLoggingIn(false);
    }
  };

  const handleLaunchEmbeddedSignup = async () => {
    if (!metaAppId) {
      setTempAppId(metaAppId);
      setTempConfigId(metaConfigId);
      setShowAppIdModal(true);
      return;
    }

    setIsEmbeddedSigningUp(true);
    setFeedbackMessage(null);

    try {
      await initFacebookSdk(metaAppId);

      const res = await launchWhatsAppEmbeddedSignup({
        configId: metaConfigId,
        onEmbeddedEvent: (evt) => {
          if (evt.phone_number_id) {
            setPhoneId(evt.phone_number_id);
            setDisplayPhoneNumber(`+${evt.phone_number_id}`);
            localStorage.setItem('automatas_meta_phone_id', evt.phone_number_id);
          }
          if (evt.waba_id) {
            setWabaId(evt.waba_id);
            localStorage.setItem('automatas_meta_waba_id', evt.waba_id);
          }
        },
      });

      if (res.status === 'connected' && res.authResponse) {
        const profile = await getFacebookUserProfile();
        if (profile) setFbUserProfile(profile);

        await fetch('/api/meta/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authType: 'embedded_signup',
            userId: profile?.id || res.authResponse.userID,
            userName: profile?.name || 'WhatsApp Business Integrado',
            userEmail: profile?.email || null,
            code: res.authResponse.code,
            accessToken: res.authResponse.accessToken,
            phoneNumberId: phoneId,
            wabaId: wabaId,
          }),
        });

        setIsConnected(true);
        setFeedbackMessage({
          text: 'Conta de WhatsApp Business vinculada com sucesso via Embedded Signup!',
          type: 'success',
        });
        fetchMessagesAndContacts();
      } else if (res.error) {
        setFeedbackMessage({ text: res.error, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro durante o Onboarding Embutido da Meta';
      setFeedbackMessage({ text: msg, type: 'error' });
    } finally {
      setIsEmbeddedSigningUp(false);
    }
  };

  // Buscar usuários para a tela de admin
  const fetchAdminUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userFilter !== 'all') params.append('filter', userFilter);
      if (userSearch.trim()) params.append('q', userSearch.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
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
  }, [userFilter, userSearch]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && currentView === 'users') {
      fetchAdminUsers();
    }
  }, [isAuthenticated, isAdmin, currentView, fetchAdminUsers]);

  // Buscar dados e mensagens
  const fetchMessagesAndContacts = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data: MetaStatus = await res.json();
        setMetaInfo(data);
        setMessages(data.messages || []);

        const contactList = data.contacts || [];
        setContacts(contactList);

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
  }, []);

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

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Preencha o e-mail e a senha para acessar.');
      return;
    }

    if (email.trim().length > 3 && password.trim().length >= 4) {
      setIsAuthenticated(true);
      const isAdm =
        email.toLowerCase().includes('admin') ||
        email.toLowerCase().includes('meta') ||
        email.toLowerCase().includes('automatas');
      const role: 'admin' | 'user' = isAdm ? 'admin' : 'user';
      setUserRole(role);
      localStorage.setItem('automatas_app_auth', 'true');
      localStorage.setItem('automatas_app_role', role);
      localStorage.setItem('automatas_app_email', email);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Use a senha de demonstração.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('automatas_app_auth');
    localStorage.removeItem('automatas_app_role');
    localStorage.removeItem('automatas_app_email');
    localStorage.removeItem('automatas_meta_user');
    setFbUserProfile(null);
  };

  // Alternador rápido de visão para testes de auditoria
  const toggleRoleView = () => {
    const nextRole = userRole === 'admin' ? 'user' : 'admin';
    setUserRole(nextRole);
    localStorage.setItem('automatas_app_role', nextRole);
    if (nextRole === 'user' && currentView === 'users') {
      setCurrentView('chat');
    }
    setFeedbackMessage({
      text: `Visão alternada para: ${nextRole === 'admin' ? 'Administrador (Visão Completa)' : 'Atendente (Visão Segura Sem Configurações Meta)'}`,
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
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbackMessage({ text: `Dados de "${name}" expurgados com sucesso!`, type: 'success' });
        fetchAdminUsers();
        fetchMessagesAndContacts();
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

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContactPhone,
          text: messageText,
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
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-blue-400">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Acesso ao CRM & Chat
              </h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Painel Integrado WhatsApp Business Cloud API
              </p>
            </div>

            {loginError && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* BOTÃO OFICIAL: LOGIN COM O FACEBOOK */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={isFbLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.99]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>{isFbLoggingIn ? 'Autenticando com a Meta...' : 'Entrar com o Facebook'}</span>
              </button>
            </div>

            <div className="relative my-5 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                ou credenciais corporativas
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: contato@automatas.tech"
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
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
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
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 py-3">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <span>
                automatas<span className="text-blue-500">.tech</span>
              </span>
            </Link>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              <Radio className="w-3 h-3 animate-pulse" />
              WhatsApp Cloud API Conectada
            </span>
            <button
              type="button"
              onClick={handleLaunchEmbeddedSignup}
              disabled={isEmbeddedSigningUp}
              className="hidden lg:inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-blue-300 transition-all cursor-pointer font-medium"
              title="Iniciar fluxo oficial de Onboarding Embutido da Meta (Facebook Login for Business)"
            >
              <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{isEmbeddedSigningUp ? 'Conectando à Meta...' : 'Embedded Signup (Meta)'}</span>
            </button>
          </div>

          {/* Menu Central: Exibição Condicional para Admin vs Usuário Comum */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 border border-slate-800 px-2 py-1 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => setCurrentView('chat')}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
                currentView === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Conversas</span>
            </button>

            {/* ABAS EXCLUSIVAS DE ADMINISTRADOR */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentView('users')}
                  className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
                    currentView === 'users'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Gerenciamento de contas de usuários e leads"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gerenciar Contas</span>
                  {userStats.total > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      {userStats.total}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMetaSettingsModal(true)}
                  className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  title="Visualizar credenciais de webhook e endpoints Meta (Exclusivo Administrador)"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-400" />
                  <span>Configurações Meta</span>
                </button>
              </>
            )}

            {/* LINKS PÚBLICOS DE CONFORMIDADE PARA TODOS */}
            <Link
              href="/exclusao-dados"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Instruções de Exclusão de Dados exigidas pela Meta / LGPD"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Exclusão de Dados</span>
            </Link>
            <Link
              href="/privacidade"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Política de Privacidade Oficial"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacidade</span>
            </Link>
            <Link
              href="/termos"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Termos de Serviço da Plataforma"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Termos</span>
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Página Inicial do Site"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Site</span>
            </Link>
          </nav>

          {/* Lado Direito: Alternador de Perfil, Phone ID, Logout e Menu Mobile */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Botão de Alternar Visão (Teste de Perfil Admin vs Atendente) */}
            <button
              type="button"
              onClick={toggleRoleView}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAdmin
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-300 hover:bg-blue-600/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
              title="Clique para alternar entre perfil Administrador e Atendente"
            >
              <span>{isAdmin ? '👑 Admin' : '👤 Atendente'}</span>
            </button>

            {fbUserProfile && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200">
                {fbUserProfile.pictureUrl ? (
                  <img src={fbUserProfile.pictureUrl} alt={fbUserProfile.name} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="max-w-[120px] truncate font-medium">{fbUserProfile.name}</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>ID: {phoneId}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sair</span>
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
                currentView === 'chat' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversas WhatsApp</span>
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
                  <span>Gerenciar Contas & Usuários</span>
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
                  <span>Configurações Meta & Webhooks</span>
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

        {/* Webhook Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong className="text-blue-300">Sobre mensagens recebidas do seu celular:</strong> A Meta entrega mensagens externas via Webhook HTTPS público. Em ambiente local, você pode testar respostas instantâneas usando o botão <em>&quot;⚡ Simular Recebimento&quot;</em> dentro da conversa!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/exclusao-dados" className="text-slate-400 hover:text-white underline">
              Exclusão LGPD
            </Link>
          </div>
        </div>

        {/* RENDERIZAÇÃO CONDICIONAL: GERENCIAMENTO DE CONTAS OU CHAT */}
        {currentView === 'users' && isAdmin ? (
          /* ======================================================== */
          /* TELA EXCLUSIVA DE ADMIN: GERENCIAMENTO DE CONTAS E USUÁRIOS */
          /* ======================================================== */
          <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-300">
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
                                    : user.source === 'lead_form'
                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                    : user.source === 'meta_app'
                                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                {user.source === 'whatsapp_bot'
                                  ? 'WhatsApp Bot'
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
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum contato encontrado.
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
                  onClick={() => handleSimulateInboundFromContact('Olá! Como funciona a automação?')}
                  disabled={isSending}
                  className="px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Simula o cliente enviando uma mensagem para o número da Meta e acionando o bot"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span className="hidden sm:inline">Simular Recebimento (&quot;Oi&quot;)</span>
                </button>
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
              {activeChatMessages.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="font-semibold text-slate-400">Nenhuma mensagem com este contato ainda.</p>
                  <p className="text-[11px] text-slate-600">
                    Digite uma mensagem abaixo para disparar via WhatsApp Cloud API ou clique em &quot;Simular Recebimento&quot;.
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
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl space-y-6 relative overflow-hidden">
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
              <button
                type="button"
                onClick={() => setShowMetaSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  URL de Callback do Webhook (Produção)
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
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'webhook' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Token de Verificação (Verify Token)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="automatas_meta_verify_2026"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy('automatas_meta_verify_2026', 'token')}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                    >
                      {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    ID do Telefone (Phone Number ID)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={phoneId}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(phoneId, 'phoneId')}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
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
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Meta App ID</span>
                    <span className="text-slate-200">{metaAppId || 'Não configurado'}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Config ID (Embedded)</span>
                    <span className="text-slate-200">{metaConfigId || 'Não configurado'}</span>
                  </div>
                </div>

                {wabaId && (
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">WhatsApp Business Account (WABA ID)</span>
                    <span className="text-emerald-400">{wabaId}</span>
                  </div>
                )}

                {/* Gatilhos de Demonstração para Gravação de Vídeo */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    disabled={isFbLoggingIn}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>{isFbLoggingIn ? 'Abrindo Pop-up...' : 'Testar Login com Facebook'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchEmbeddedSignup}
                    disabled={isEmbeddedSigningUp}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span>{isEmbeddedSigningUp ? 'Abrindo Onboarding...' : 'Testar Embedded Signup'}</span>
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
                  Embedded Signup Config ID (Opcional)
                </label>
                <input
                  type="text"
                  value={tempConfigId}
                  onChange={(e) => setTempConfigId(e.target.value.trim())}
                  placeholder="ex: 987654321098765"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
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
