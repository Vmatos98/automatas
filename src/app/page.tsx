'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  CreditCard,
  Database,
  Globe,
  Instagram,
  KeyRound,
  Layers,
  Loader2,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Monitor,
  Palette,
  Scale,
  Server,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Trello,
  Truck,
  Webhook,
  Workflow,
  X,
} from 'lucide-react';

type HubChannelTab = 'whatsapp' | 'instagram';
type BillingCycle = 'MONTHLY' | 'YEARLY';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroChannel, setHeroChannel] = useState<HubChannelTab>('whatsapp');
  const [activeTemplateId, setActiveTemplateId] = useState<string>('medico');
  const [templateViewport, setTemplateViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [activeN8nTab, setActiveN8nTab] = useState(0);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    preferencia: 'WhatsApp',
    servico: 'Desenvolvimento de Site / Sistema',
    motivo: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);

    let formatted = '';
    if (v.length === 0) formatted = '';
    else if (v.length <= 2) formatted = `(${v}`;
    else if (v.length <= 3) formatted = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    else if (v.length <= 7) formatted = `(${v.substring(0, 2)}) ${v.substring(2, 3)} ${v.substring(3)}`;
    else formatted = `(${v.substring(0, 2)}) ${v.substring(2, 3)} ${v.substring(3, 7)}-${v.substring(7)}`;

    setFormData((prev) => ({ ...prev, telefone: formatted }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Erro na resposta do servidor (${response.status})`);
      }
      setSubmitStatus('success');
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        preferencia: 'WhatsApp',
        servico: 'Desenvolvimento de Site / Sistema',
        motivo: '',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar sua solicitação no momento. Tente novamente ou fale via WhatsApp.';
      setSubmitStatus('error');
      setErrorMessage(msg);
    }
  };

  const templatesSites = [
    {
      id: 'medico',
      title: 'Clínicas & Saúde',
      tag: 'Agendamento & Corpo Clínico',
      description:
        'Estrutura orientada a agendamentos, apresentação de especialidades, convênios e captação direta via WhatsApp.',
      icon: Stethoscope,
      src: '/templates/clinica_medica.html',
    },
    {
      id: 'advogado',
      title: 'Escritórios de Advocacia',
      tag: 'Autoridade Jurídica',
      description:
        'Design sóbrio com foco em áreas de atuação, publicações técnicas e triagem qualificada de atendimentos.',
      icon: Scale,
      src: '/templates/escritorio_advocacia.html',
    },
    {
      id: 'institucional',
      title: 'Empresarial & B2B',
      tag: 'Institucional de Alta Performance',
      description:
        'Apresentação clara de serviços, indicadores operacionais e funil comercial integrado ao CRM.',
      icon: Building2,
      src: '/templates/empresarial_institucional.html',
    },
    {
      id: 'portfolio',
      title: 'Portfólio Criativo',
      tag: 'Arquitetura, Design & Vídeo',
      description:
        'Vitrine editorial para exibir projetos visuais, galerias de alta resolução e pedidos de orçamento.',
      icon: Palette,
      src: '/templates/portifolio_criativo.html',
    },
    {
      id: 'loja',
      title: 'E-commerce & Catálogo',
      tag: 'Venda Direta Online',
      description:
        'Loja responsiva com carrinho dinâmico, gestão de catálogo e checkout integrado.',
      icon: ShoppingCart,
      src: '/templates/ecommerce.html',
    },
  ];

  const activeTemplate =
    templatesSites.find((t) => t.id === activeTemplateId) || templatesSites[0];

  const n8nUseCases = [
    {
      id: 'orcamento',
      tabTitle: 'Orçamentos',
      title: 'Captação e Triagem Comercial',
      description:
        'Recebe pedidos do site, classifica a urgência com IA e notifica o time comercial no WhatsApp e CRM.',
      step1: {
        icon: Globe,
        title: 'Entrada: Site',
        desc: 'Cliente preenche o formulário de orçamento no site.',
      },
      aiDesc: 'Analisa o pedido, estima complexidade e gera um resumo executivo para vendas.',
      step3: [
        { icon: Mail, title: 'E-mail ao Cliente', desc: 'Confirmação automática imediata.' },
        { icon: Trello, title: 'Card no CRM / Kanban', desc: 'Registro estruturado sem digitação.' },
        { icon: MessageSquare, title: 'Alerta WhatsApp', desc: 'Notificação instantânea para o vendedor.' },
      ],
    },
    {
      id: 'sistema_custom',
      tabTitle: 'Sistemas Próprios',
      title: 'Integração entre ERP, CRM e APIs',
      description:
        'Conectamos o software exclusivo da sua operação com bancos de dados, emissores fiscais e mensageria.',
      step1: {
        icon: Code2,
        title: 'Entrada: Evento Interno',
        desc: 'Uma ação relevante dispara um webhook no seu sistema.',
      },
      aiDesc: 'Normaliza payloads heterogêneos e aplica regras de negócio antes de rotear.',
      step3: [
        { icon: Database, title: 'Sincronização SQL', desc: 'Atualiza cadastros em tempo real.' },
        { icon: Mail, title: 'Alertas de Gestão', desc: 'Notifica responsáveis por exceções.' },
        { icon: Workflow, title: 'APIs Externas', desc: 'Executa ações em ERPs e gateways.' },
      ],
    },
    {
      id: 'leads',
      tabTitle: 'Leads Ads',
      title: 'Qualificação Imediata de Anúncios',
      description:
        'Leads do Meta Ads entram no funil em segundos com abordagem personalizada no WhatsApp.',
      step1: {
        icon: Megaphone,
        title: 'Entrada: Meta Ads',
        desc: 'Lead preenche o formulário nativo no Instagram ou Facebook.',
      },
      aiDesc: 'Avalia o perfil do lead e redige a primeira abordagem alinhada à campanha.',
      step3: [
        { icon: Database, title: 'CRM / Planilha', desc: 'Lead salvo e tagueado por origem.' },
        { icon: Mail, title: 'Sequência de E-mail', desc: 'Material institucional enviado.' },
        { icon: MessageSquare, title: 'WhatsApp Oficial', desc: 'Primeiro contato automático.' },
      ],
    },
    {
      id: 'cobranca',
      tabTitle: 'Cobranças',
      title: 'Régua Financeira Automatizada',
      description:
        'Lembretes inteligentes de vencimento com envio de Pix/Boleto e baixa automática após compensação.',
      step1: {
        icon: Database,
        title: 'Entrada: Fatura Aberta',
        desc: 'ERP ou gateway identifica título próximo do vencimento.',
      },
      aiDesc: 'Ajusta o tom da mensagem conforme histórico de relacionamento do cliente.',
      step3: [
        { icon: Mail, title: '2ª Via por E-mail', desc: 'Boleto ou código Pix anexo.' },
        { icon: MessageSquare, title: 'Lembrete WhatsApp', desc: 'Mensagem direta com link de pagamento.' },
        { icon: CreditCard, title: 'Conciliação', desc: 'Baixa automática no financeiro.' },
      ],
    },
    {
      id: 'powerbi',
      tabTitle: 'BI & Relatórios',
      title: 'Consolidação Executiva & Power BI',
      description:
        'Extração diária de múltiplas fontes, limpeza de dados e atualização automática de dashboards.',
      step1: {
        icon: Database,
        title: 'Entrada: Fontes de Dados',
        desc: 'Extração agendada de ERP, planilhas e APIs.',
      },
      aiDesc: 'Gera resumos executivos apontando desvios de meta e gargalos operacionais.',
      step3: [
        { icon: Server, title: 'ETL & Limpeza', desc: 'Padronização e cruzamento de métricas.' },
        { icon: BarChart, title: 'Power BI', desc: 'Datasets atualizados para a diretoria.' },
        { icon: Mail, title: 'Resumo em PDF', desc: 'Envio diário para os sócios.' },
      ],
    },
  ];

  const hubPlans = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Cloud',
      monthly: 20,
      yearly: 16,
      projects: 3,
      extraMonthly: 10,
      extraYearly: 8,
      features: [
        'Embedded Signup oficial no seu domínio',
        'Envio de texto, mídia e templates via API Key',
        'Webhook assinado (HMAC-SHA256) em tempo real',
      ],
    },
    {
      id: 'instagram',
      name: 'Instagram API',
      monthly: 20,
      yearly: 16,
      projects: 3,
      extraMonthly: 10,
      extraYearly: 8,
      features: [
        'Login Unificado oficial para contas Business',
        'Direct (DM), resposta a comentários e Reels',
        'Consulta de Insights e Webhook de eventos',
      ],
    },
    {
      id: 'omnichannel',
      name: 'Omnichannel (Ambos)',
      badge: 'Mais completo',
      monthly: 35,
      yearly: 28,
      projects: 5,
      extraMonthly: 10,
      extraYearly: 8,
      highlight: true,
      features: [
        'WhatsApp Cloud API + Instagram API integrados',
        'Até 5 projetos independentes inclusos',
        'Painel multi-projetos para agências e SaaS',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled
            ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-500" />
            </div>
            <span>
              automatas<span className="text-blue-500">.tech</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <button
              type="button"
              onClick={() => scrollToSection('portfolio')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Portfólio
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('hub')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Hub WhatsApp &amp; Instagram
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('possibilidades')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Possibilidades &amp; Modelos
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('automacao')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Automação n8n
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contato')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contato
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/guia"
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all duration-150 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span>Docs API</span>
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all duration-150 active:scale-[0.98]"
            >
              Acessar Hub
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-5 space-y-4">
            <div className="flex flex-col gap-3 text-sm font-medium text-zinc-300">
              <button
                type="button"
                onClick={() => scrollToSection('portfolio')}
                className="text-left py-1 hover:text-white"
              >
                Portfólio
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('possibilidades')}
                className="text-left py-1 hover:text-white"
              >
                Possibilidades &amp; Modelos
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('hub')}
                className="text-left py-1 hover:text-white"
              >
                Hub WhatsApp &amp; Instagram
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('automacao')}
                className="text-left py-1 hover:text-white"
              >
                Automação n8n
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contato')}
                className="text-left py-1 hover:text-white"
              >
                Contato
              </button>
            </div>
            <div className="pt-3 border-t border-zinc-800 flex gap-2">
              <Link
                href="/guia"
                className="flex-1 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-center text-xs font-semibold text-zinc-200"
              >
                Docs API
              </Link>
              <Link
                href="/app"
                className="flex-1 py-2.5 rounded-lg bg-white text-center text-xs font-semibold text-zinc-950"
              >
                Acessar Hub
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Editorial Assimétrico */}
      <section id="home" className="pt-32 pb-20 md:pt-40 md:pb-28 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Engenharia Web • SaaS • Meta Cloud Bridge</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-[-0.03em] text-white leading-[1.08]">
                Sistemas sob medida e infraestrutura oficial para WhatsApp &amp; Instagram.
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
                Projetamos sites de alta conversão, plataformas SaaS completas e uma ponte oficial (Bridge API) para você ou sua agência conectar clientes à Meta sem burocracia.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => scrollToSection('contato')}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <span>Negociar Projeto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('portfolio')}
                  className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer"
                >
                  Ver Portfólio
                </button>
                <Link
                  href="/app"
                  className="px-4 py-3.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Testar Hub WhatsApp/IG</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Métricas / Credenciais reais e diretas */}
              <div className="pt-6 border-t border-zinc-900 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-lg font-bold text-white font-mono tabular-nums">100%</div>
                  <div className="text-xs text-zinc-500 mt-0.5">API Oficial Meta</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono tabular-nums">R$ 20</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Hub a partir de /mês</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono tabular-nums">n8n + IA</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Automação dedicada</div>
                </div>
              </div>
            </div>

            {/* Hero Right: Preview técnico limpo da Bridge API */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2 bg-zinc-900">
                  <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setHeroChannel('whatsapp')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        heroChannel === 'whatsapp'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      WhatsApp API
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroChannel('instagram')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        heroChannel === 'instagram'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Instagram API
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">api.automatas.tech</span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>1. Onboarding Cliente</span>
                      <span className="font-mono text-zinc-300">JWT + Embedded Signup</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>2. Envio pelo seu Sistema</span>
                      <span className="font-mono text-zinc-300">x-api-key: aut_live_...</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>3. Retorno em Tempo Real</span>
                      <span className="font-mono text-zinc-300">Webhook HMAC-SHA256</span>
                    </div>
                  </div>

                  <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                    {heroChannel === 'whatsapp'
                      ? `POST /api/hub/messages/media
x-api-key: aut_live_9f3a...

{
  "to": "5511999999999",
  "type": "document",
  "mediaUrl": "https://.../proposta.pdf",
  "filename": "proposta-comercial.pdf"
}`
                      : `POST /api/hub/instagram/dm
x-api-key: aut_live_9f3a...

{
  "recipientId": "IGSID_DO_CLIENTE",
  "text": "Olá! Recebemos seu comentário."
}`}
                  </pre>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Link
                      href="/guia"
                      className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Ler documentação completa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/app"
                      className="text-zinc-300 hover:text-white font-mono text-[11px]"
                    >
                      Abrir painel →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 1: Portfólio em Produção */}
      <section id="portfolio" className="py-24 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Portfólio &amp; Produtos Próprios
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Projetos reais em operação
              </h2>
              <p className="text-zinc-400 text-sm md:text-base">
                De sites institucionais de posicionamento a plataformas SaaS com cobrança recorrente e controle operacional.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('contato')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <span>Solicitar orçamento para seu projeto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid 2 projetos web reais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="group rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden flex flex-col">
              <div className="h-64 bg-zinc-900 relative overflow-hidden border-b border-zinc-800">
                <img
                  src="/assets/AlthairSanto.png"
                  alt="Althair Santo"
                  className="w-full h-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between gap-5">
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Moda &amp; Posicionamento
                  </div>
                  <h3 className="text-xl font-bold text-white">Althair Santo</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Site institucional e vitrine digital para estilista, com foco em direção estética, leveza de carregamento e apresentação de coleções.
                  </p>
                </div>
                <a
                  href="https://www.althairsanto.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-blue-400 transition-colors w-fit"
                >
                  <span>Visitar althairsanto.com.br</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>

            <article className="group rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden flex flex-col">
              <div className="h-64 bg-zinc-900 relative overflow-hidden border-b border-zinc-800">
                <img
                  src="/assets/Nardelli.png"
                  alt="Nardelli Usinagem"
                  className="w-full h-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between gap-5">
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Indústria B2B
                  </div>
                  <h3 className="text-xl font-bold text-white">Nardelli Usinagem</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Plataforma B2B para usinagem de precisão, catálogo técnico de maquinário e fluxo estruturado de solicitação de orçamento.
                  </p>
                </div>
                <a
                  href="https://www.nardelliusinagem.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-blue-400 transition-colors w-fit"
                >
                  <span>Visitar nardelliusinagem.com.br</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          </div>

          {/* Destaque SaaS Proprietário: Sistema M.O.V.E */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-7 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>SaaS Proprietário • sistemamove.com</span>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Sistema M.O.V.E
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Motor de Operação e Visão de Equipamentos para Locadoras
                </p>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Plataforma completa que unifica controle de pátio e horímetro, oficina mecânica com Kanban de O.S., cobrança automatizada via Mercado Pago e portal exclusivo do cliente para 2ª via.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Controle de Frota &amp; PAT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Oficina &amp; Kanban de O.S.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Pix, Boleto e Cartão automático</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Gestão de Obras &amp; Portal</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="https://sistemamove.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
                >
                  <span>Conhecer sistemamove.com</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => scrollToSection('contato')}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                >
                  Solicitar Demonstração
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 text-xs">
                  <span className="font-mono text-zinc-400">M.O.V.E — Painel Operacional</span>
                  <span className="text-[11px] font-mono text-emerald-400">Frota Ativa</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { label: 'Frota', value: '245', tone: 'text-white' },
                    { label: 'Disponível', value: '82', tone: 'text-emerald-400' },
                    { label: 'Locados', value: '148', tone: 'text-blue-400' },
                    { label: 'Oficina', value: '7', tone: 'text-amber-400' },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80"
                    >
                      <div className="text-[10px] font-mono uppercase text-zinc-500">{kpi.label}</div>
                      <div className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${kpi.tone}`}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-300">PAT-1048 Escavadeira</span>
                    <span className="font-mono text-[10px] text-amber-400">Em Reparo</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-300">PAT-2031 Gerador</span>
                    <span className="font-mono text-[10px] text-emerald-400">Liberado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2: Hub Oficial WhatsApp & Instagram (Bridge API) */}
      <section id="hub" className="py-24 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                Automatas Omnichannel Hub
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Use nosso sistema oficial de WhatsApp &amp; Instagram
              </h2>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Conecte o número do seu cliente ou conta Instagram em segundos via Embedded Signup oficial da Meta, envie texto e mídias pela nossa API Key e receba tudo em tempo real no seu Webhook.
              </p>
            </div>

            {/* Toggle Mensal / Anual */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'YEARLY'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Anual</span>
                <span className="text-[10px] font-mono opacity-90">-20%</span>
              </button>
            </div>
          </div>

          {/* Como funciona em 3 passos técnicos claros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] font-mono text-zinc-500">01 / TOKEN JWT</span>
              </div>
              <h3 className="text-base font-bold text-white">Onboarding Embedded Signup</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cada projeto possui um <strong className="text-zinc-200">Login JWT</strong> que abre o popup oficial (<code className="text-blue-300">/conectar</code>) para o cliente autorizar o WhatsApp Business ou Instagram sem compartilhar senhas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-mono text-zinc-500">02 / API KEY</span>
              </div>
              <h3 className="text-base font-bold text-white">Envio Unificado (Texto &amp; Mídia)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Seu backend envia requisições autenticadas com <code className="text-emerald-300">x-api-key</code> para disparar mensagens, imagens, PDFs, áudios, templates, DMs e Reels.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <Webhook className="w-5 h-5 text-amber-400" />
                <span className="text-[11px] font-mono text-zinc-500">03 / WEBHOOK</span>
              </div>
              <h3 className="text-base font-bold text-white">Ponte em Tempo Real Assinada</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mensagens recebidas, confirmações de leitura e comentários do Instagram são encaminhados para a sua URL com assinatura <code className="text-amber-300">HMAC-SHA256</code>.
              </p>
            </div>
          </div>

          {/* Planos transparentes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {hubPlans.map((plan) => {
              const price = billingCycle === 'YEARLY' ? plan.yearly : plan.monthly;
              const extra = billingCycle === 'YEARLY' ? plan.extraYearly : plan.extraMonthly;
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between gap-6 ${
                    plan.highlight
                      ? 'bg-zinc-900 border-blue-500/50'
                      : 'bg-zinc-900/40 border-zinc-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-white">{plan.name}</h3>
                      {plan.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                        R$ {price}
                      </span>
                      <span className="text-xs text-zinc-400">/mês</span>
                    </div>

                    <div className="text-xs text-zinc-400">
                      Inclui <strong className="text-zinc-200">{plan.projects} projetos</strong> • projeto extra +R$ {extra}/mês
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-zinc-800/80 text-xs text-zinc-300">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/app"
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-all active:scale-[0.98] ${
                      plan.highlight
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    Criar Conta ou Usar Código Promocional
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Barra inferior de acesso técnico */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-zinc-300">
              <strong className="text-white">Desenvolvedor ou Agência?</strong> Consulte todos os payloads de Texto, Mídia, Templates, Instagram DM/Reels e validação de Webhook antes de assinar.
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/guia"
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 inline-flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Abrir Guia Técnico</span>
              </Link>
              <Link
                href="/app"
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Acessar Painel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3: Possibilidades de Projetos & Modelos Interativos */}
      <section id="possibilidades" className="py-24 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Possibilidades &amp; Modelos Interativos
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              O que construímos para o seu negócio
            </h2>
            <p className="text-zinc-400 text-sm md:text-base">
              Desenvolvimento 100% sob medida ou a partir de estruturas validadas por nicho. Selecione um modelo abaixo para testar ao vivo.
            </p>
          </div>

          {/* 4 frentes de possibilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Layers,
                title: 'SaaS & Sistemas Web',
                desc: 'Painéis administrativos, multi-tenant, cobrança Asaas/Mercado Pago e controle de acesso.',
              },
              {
                icon: Monitor,
                title: 'Sites de Alta Conversão',
                desc: 'Institucionais, landing pages e portfólios rápidos com SEO técnico e captação integrada.',
              },
              {
                icon: Briefcase,
                title: 'Portais B2B & Jurídico',
                desc: 'Áreas do cliente, orçamentos complexos, triagem de leads e fluxos de aprovação.',
              },
              {
                icon: Workflow,
                title: 'APIs & Mensageria',
                desc: 'Integração nativa com WhatsApp Cloud API, Instagram API, ERPs, CRMs e automações n8n.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5"
                >
                  <Icon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Visualizador Interativo de Templates */}
          <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 space-y-2">
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Selecione um modelo
              </div>
              {templatesSites.map((tpl) => {
                const Icon = tpl.icon;
                const active = tpl.id === activeTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActiveTemplateId(tpl.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-3 ${
                      active
                        ? 'bg-zinc-800/90 border-zinc-700 text-white'
                        : 'bg-transparent border-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        active ? 'text-blue-400' : 'text-zinc-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{tpl.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                        {tpl.description}
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="pt-3 border-t border-zinc-800/80 px-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      servico: 'Desenvolvimento de Site / Sistema',
                      motivo: `Tenho interesse em um projeto baseado no modelo "${activeTemplate.title}".`,
                    }));
                    scrollToSection('contato');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Personalizar este modelo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 p-4 md:p-5 bg-zinc-950/60 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 truncate ml-2">
                    preview://automatas.tech/modelos/{activeTemplate.id}
                  </span>
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setTemplateViewport('desktop')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      templateViewport === 'desktop'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Visualização Desktop"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateViewport('mobile')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      templateViewport === 'mobile'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Visualização Mobile"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden h-[440px]">
                <iframe
                  key={activeTemplate.id}
                  src={activeTemplate.src}
                  title={`Modelo ${activeTemplate.title}`}
                  className={`h-full border-0 transition-all duration-300 ${
                    templateViewport === 'mobile' ? 'w-[375px] border-x border-zinc-800' : 'w-full'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 4: Automação n8n & IA */}
      <section id="automacao" className="py-24 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Orquestração &amp; Workflows
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Automação sob medida com n8n e IA
            </h2>
            <p className="text-zinc-400 text-sm md:text-base">
              Implantamos servidores locais ou em nuvem conectando seu site, ERP, WhatsApp e planilhas sem depender de planilhas manuais.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 space-y-8">
            <div className="flex flex-wrap gap-2">
              {n8nUseCases.map((useCase, index) => (
                <button
                  key={useCase.id}
                  type="button"
                  onClick={() => setActiveN8nTab(index)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeN8nTab === index
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {useCase.tabTitle}
                </button>
              ))}
            </div>

            <div key={activeN8nTab} className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
              <div>
                <h3 className="text-lg font-bold text-white">{n8nUseCases[activeN8nTab].title}</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  {n8nUseCases[activeN8nTab].description}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* Etapa 1: Entrada */}
                <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                  <div className="text-[11px] font-mono text-zinc-500">01 / GATILHO</div>
                  {(() => {
                    const Step1Icon = n8nUseCases[activeN8nTab].step1.icon;
                    return <Step1Icon className="w-6 h-6 text-blue-400" />;
                  })()}
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {n8nUseCases[activeN8nTab].step1.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {n8nUseCases[activeN8nTab].step1.desc}
                    </p>
                  </div>
                </div>

                {/* Etapa 2: n8n + IA */}
                <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                  <div className="text-[11px] font-mono text-zinc-500">02 / ORQUESTRAÇÃO n8n + IA</div>
                  <Workflow className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Processamento &amp; Decisão</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {n8nUseCases[activeN8nTab].aiDesc}
                    </p>
                  </div>
                </div>

                {/* Etapa 3: Ações */}
                <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-[11px] font-mono text-zinc-500">03 / SAÍDAS INTEGRADAS</div>
                  <div className="space-y-2.5">
                    {n8nUseCases[activeN8nTab].step3.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <div key={action.title} className="flex items-start gap-2.5">
                          <ActionIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-zinc-200">{action.title}</div>
                            <div className="text-[11px] text-zinc-500">{action.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 5: Contato & Negociação */}
      <section id="contato" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-7 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  Contato Comercial
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Vamos tirar seu projeto do papel
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Conte o que sua empresa precisa — desenvolvimento web, sistema sob medida, automação n8n ou integração com nosso Hub WhatsApp &amp; Instagram.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-800 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>contato@automatas.tech</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Atendimento direto via WhatsApp</span>
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="w-4 h-4 text-fuchsia-400 shrink-0" />
                  <span>Onboarding oficial Meta Tech Provider</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              {submitStatus === 'success' ? (
                <div className="rounded-2xl bg-zinc-950 border border-emerald-500/30 p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Solicitação recebida</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-sm">
                    Recebemos seus dados com sucesso. Em breve retornaremos pelo canal escolhido.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitStatus('idle')}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 cursor-pointer"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="website_url"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  {submitStatus === 'error' && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Nome completo *
                      </label>
                      <input
                        required
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        placeholder="João Silva"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        E-mail profissional *
                      </label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="joao@empresa.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        WhatsApp / Telefone *
                      </label>
                      <input
                        required
                        type="text"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleTelefoneChange}
                        placeholder="(11) 9 9999-9999"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Preferência de retorno
                      </label>
                      <select
                        name="preferencia"
                        value={formData.preferencia}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="E-mail">E-mail</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Objetivo principal
                    </label>
                    <select
                      name="servico"
                      value={formData.servico}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Desenvolvimento de Site / Sistema">
                        Desenvolvimento de Site / Sistema Sob Medida
                      </option>
                      <option value="Hub WhatsApp & Instagram API">
                        Hub WhatsApp &amp; Instagram API (Bridge / Agência)
                      </option>
                      <option value="Sistema M.O.V.E">
                        Sistema M.O.V.E (Locadoras de Equipamentos)
                      </option>
                      <option value="Automação">Automação de Processos / n8n + IA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Detalhes do projeto (opcional)
                    </label>
                    <textarea
                      rows={3}
                      name="motivo"
                      value={formData.motivo}
                      onChange={handleInputChange}
                      placeholder="Conte brevemente o escopo, prazo ou integrações desejadas..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitStatus === 'loading'}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Solicitação</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2 font-semibold text-zinc-300">
            <Bot className="w-4 h-4 text-blue-500" />
            <span>automatas.tech</span>
            <span className="text-zinc-600 font-normal">
              © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/privacidade" className="hover:text-zinc-300 transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-zinc-300 transition-colors">
              Termos
            </Link>
            <Link href="/exclusao-dados" className="hover:text-zinc-300 transition-colors">
              Exclusão de Dados
            </Link>
            <Link href="/guia" className="hover:text-zinc-300 transition-colors">
              Guia API
            </Link>
            <Link href="/app" className="text-blue-400 hover:text-blue-300 font-semibold">
              Painel do Cliente
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
