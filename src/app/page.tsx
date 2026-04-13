"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2,
  Workflow,
  Server,
  Smartphone,
  Monitor,
  Mail,
  MessageSquare,
  Briefcase,
  Scissors,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Bot,
  Trello,
  Globe,
  Database,
  CalendarDays,
  Megaphone,
  CreditCard,
  BarChart,
  BrainCircuit,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  Stethoscope,
  Scale,
  Building2,
  Palette,
  ShoppingCart,
  LayoutTemplate,
  ChevronDown
} from 'lucide-react';


export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeN8nTab, setActiveN8nTab] = useState(0);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [telefone, setTelefone] = useState('');

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    
    let formatted = '';
    if (v.length === 0) formatted = '';
    else if (v.length <= 2) formatted = `(${v}`;
    else if (v.length <= 3) formatted = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    else if (v.length <= 7) formatted = `(${v.substring(0, 2)}) ${v.substring(2, 3)} ${v.substring(3)}`;
    else formatted = `(${v.substring(0, 2)}) ${v.substring(2, 3)} ${v.substring(3, 7)}-${v.substring(7)}`;

    setTelefone(formatted);
  };

  const n8nUseCases = [
    {
      id: 'orcamento',
      tabTitle: 'Orçamentos',
      title: 'Captação de Orçamentos',
      description: 'Automação para receber pedidos do site e notificar a equipe comercial instantaneamente.',
      step1: { icon: Globe, title: '1. O Site', desc: 'Cliente preenche o formulário de orçamento no site que desenvolvemos.' },
      aiAgent: { desc: 'A IA analisa o pedido, classifica o grau de urgência e resume os pontos principais para o time de vendas.' },
      step3: [
        { icon: Mail, title: 'E-mail ao Cliente', desc: 'Confirmação de recebimento automática.', color: 'text-indigo-400' },
        { icon: Trello, title: 'Integração Trello / Kanban / Slack', desc: 'Criação de card com dados do orçamento.', color: 'text-blue-500' },
        { icon: MessageSquare, title: 'Alerta WhatsApp', desc: 'Aviso imediato para sua equipe de vendas.', color: 'text-green-500' }
      ]
    },
    {
      id: 'sistema_custom',
      tabTitle: 'Sistemas Próprios',
      title: 'Integração de Sistemas Sob Medida',
      description: 'Conectamos o sistema exclusivo que desenvolvemos para sua empresa com outras ferramentas do mercado, automatizando o fluxo de dados.',
      step1: { icon: Code2, title: '1. Seu Sistema', desc: 'Uma ação importante ocorre dentro do software da sua empresa.' },
      aiAgent: { desc: 'A IA processa informações não estruturadas e toma decisões lógicas para guiar o fluxo.' },
      step3: [
        { icon: Database, title: 'Banco de Dados', desc: 'Sincroniza as informações centralizadas em tempo real.', color: 'text-purple-500' },
        { icon: Mail, title: 'Notificações', desc: 'Avisa os gestores ou clientes envolvidos no processo.', color: 'text-indigo-400' },
        { icon: Workflow, title: 'APIs Externas', desc: 'Dispara ações em ERPs, CRMs ou softwares de terceiros.', color: 'text-orange-500' }
      ]
    },
    {
      id: 'leads',
      tabTitle: 'Leads Ads',
      title: 'Qualificação de Leads (Marketing)',
      description: 'Integração de campanhas do Facebook/Instagram Ads diretamente para o seu CRM.',
      step1: { icon: Megaphone, title: '1. Anúncio', desc: 'Lead se cadastra no formulário do Facebook Ads ou Instagram.' },
      aiAgent: { desc: 'A IA avalia o perfil do lead e escreve uma mensagem de abordagem 100% personalizada e humana.' },
      step3: [
        { icon: Database, title: 'Planilha / CRM', desc: 'Salva os dados de contato imediatamente.', color: 'text-emerald-500' },
        { icon: Mail, title: 'E-mail Marketing', desc: 'Adiciona na automação de boas-vindas.', color: 'text-orange-500' },
        { icon: MessageSquare, title: 'Abordagem Rápida', desc: 'Dispara uma mensagem inicial no WhatsApp.', color: 'text-green-500' }
      ]
    },
    {
      id: 'cobranca',
      tabTitle: 'Cobranças',
      title: 'Gestão de Inadimplência',
      description: 'Evite esquecimentos cobrando seus clientes automaticamente e integrando ao seu financeiro.',
      step1: { icon: Database, title: '1. Sistema ERP', desc: 'Seu sistema ERP identifica uma fatura vencendo hoje.' },
      aiAgent: { desc: 'A IA analisa o histórico do cliente e adapta o tom de voz da cobrança (amigável, formal, etc).' },
      step3: [
        { icon: Mail, title: 'Fatura por E-mail', desc: 'Envia o boleto ou código Pix atualizado.', color: 'text-indigo-400' },
        { icon: MessageSquare, title: 'Lembrete WhatsApp', desc: 'Aviso amigável com o link de pagamento.', color: 'text-green-500' },
        { icon: CreditCard, title: 'Baixa Automática', desc: 'Após o pagamento, o n8n dá baixa no ERP.', color: 'text-blue-400' }
      ]
    },
    {
      id: 'powerbi',
      tabTitle: 'Power BI & BI',
      title: 'Relatórios e Dashboards Automatizados',
      description: 'Coletamos dados vitais da sua operação e enviamos automaticamente para o Power BI, gerando apresentações atualizadas para a diretoria.',
      step1: { icon: Database, title: '1. Fontes de Dados', desc: 'O n8n extrai informações diárias do seu ERP, planilhas ou banco de dados.' },
      aiAgent: { desc: 'Use a IA para analisar os dados numéricos e gerar parágrafos com resumos executivos e insights estratégicos personalizados.' },
      step3: [
        { icon: Server, title: 'Tratamento', desc: 'Limpeza e consolidação dos dados brutos.', color: 'text-cyan-400' },
        { icon: BarChart, title: 'Power BI', desc: 'Atualiza os dashboards e gráficos da empresa.', color: 'text-yellow-500' },
        { icon: Mail, title: 'Apresentações', desc: 'Dispara um PDF com o relatório gerencial por e-mail.', color: 'text-red-400' }
      ]
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const templatesSites = [
    {
      id: 'medico',
      title: 'Clínicas & Área Médica',
      description: 'Transmita confiança. Site focado em agendamentos, apresentação de especialidades, corpo clínico e convênios.',
      icon: Stethoscope,
      color: 'text-teal-400',
      bgMockup: 'bg-teal-900/20'
    },
    {
      id: 'advogado',
      title: 'Escritórios de Advocacia',
      description: 'Sóbrio e imponente. Destaque suas áreas de atuação, artigos jurídicos e facilite o contato de novos clientes.',
      icon: Scale,
      color: 'text-amber-500',
      bgMockup: 'bg-slate-900'
    },
    {
      id: 'institucional',
      title: 'Empresarial & Institucional',
      description: 'A vitrine perfeita para sua empresa. Apresente seus serviços, história e diferenciais competitivos com alta performance.',
      icon: Building2,
      color: 'text-blue-500',
      bgMockup: 'bg-blue-900/20'
    },
    {
      id: 'portfolio',
      title: 'Portfólio Criativo',
      description: 'Ideal para arquitetos, designers e fotógrafos. Um layout visualmente impactante para destacar seus melhores projetos.',
      icon: Palette,
      color: 'text-pink-500',
      bgMockup: 'bg-pink-900/10'
    },
    {
      id: 'loja',
      title: 'E-commerce & Lojas',
      description: 'Venda mais online. Lojas rápidas, responsivas e otimizadas, com carrinho dinâmico e gestão de produtos.',
      icon: ShoppingCart,
      color: 'text-emerald-500',
      bgMockup: 'bg-emerald-900/20'
    }
  ];

  const toggleTemplate = (id: string) => {
    setExpandedTemplate(expandedTemplate === id ? null : id);
  };

  const renderMockupContent = (id: string) => {
    let iframeSrc = '';
    switch (id) {
      case 'medico':
        iframeSrc = '/templates/clinica_medica.html';
        break;
      case 'advogado':
        iframeSrc = '/templates/escritorio_advocacia.html';
        break;
      case 'institucional':
        iframeSrc = '/templates/empresarial_institucional.html';
        break;
      case 'portfolio':
        iframeSrc = '/templates/portifolio_criativo.html';
        break;
      case 'loja':
        iframeSrc = '/templates/ecommerce.html';
        break;
      default:
        return null;
    }

    return (
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        title={`Template ${id}`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter cursor-pointer" onClick={() => scrollToSection('home')}>
            <Bot className="w-8 h-8 text-blue-500" />
            <span>automatas<span className="text-blue-500">.tech</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-300">
            <button onClick={() => scrollToSection('portfolio')} className="hover:text-blue-400 transition-colors">Portfólio</button>
            <button onClick={() => scrollToSection('modelos')} className="hover:text-blue-400 transition-colors">Modelos</button>
            <button onClick={() => scrollToSection('produtos')} className="hover:text-blue-400 transition-colors">Produtos</button>
            <button onClick={() => scrollToSection('automacao')} className="hover:text-blue-400 transition-colors">Automação (n8n)</button>
            <button onClick={() => scrollToSection('contato')} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              Fale Conosco
            </button>
          </div>

          {/* Mobile Nav Toggle */}
          <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 text-xl border-b border-slate-800 md:hidden">
          <button onClick={() => scrollToSection('portfolio')} className="hover:text-blue-400 transition-colors">Portfólio</button>
          <button onClick={() => scrollToSection('modelos')} className="hover:text-blue-400 transition-colors">Modelos</button>
          <button onClick={() => scrollToSection('produtos')} className="hover:text-blue-400 transition-colors">Produtos</button>
          <button onClick={() => scrollToSection('automacao')} className="hover:text-blue-400 transition-colors">Automação (n8n)</button>
          <button onClick={() => scrollToSection('contato')} className="text-blue-400 font-bold">Contato</button>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm font-medium text-blue-400 mb-8 backdrop-blur-sm">
            <Workflow className="w-4 h-4" />
            Soluções Inteligentes & Automação Local
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Evolua seu negócio com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Tecnologia e Automação</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Desenvolvemos sites de alta performance, produtos digitais e automatizamos processos complexos para você ganhar tempo e escalar sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => scrollToSection('automacao')} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Descubra nossas automações <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => scrollToSection('portfolio')} className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold transition-all duration-300 border border-slate-700">
              Ver Portfólio
            </button>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-16 md:flex justify-between items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Projetos Web de Excelência</h2>
              <p className="text-slate-400 text-lg">Desenvolvemos sites rápidos, responsivos e otimizados para converter visitantes em clientes. Conheça alguns de nossos trabalhos.</p>
            </div>
            <div className="mt-6 md:mt-0 flex gap-2">
              <Monitor className="text-blue-500 w-8 h-8" />
              <Smartphone className="text-slate-600 w-8 h-8" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Portfolio Item 1 */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <div className="h-64 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                <img src="/assets/AlthairSanto.png" alt="Althair Santo" className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-8">
                <div className="text-blue-400 text-sm font-semibold mb-2 tracking-wider">MODA & ESTILO</div>
                <h3 className="text-2xl font-bold mb-3">Althair Santo</h3>
                <p className="text-slate-400 mb-6">Site institucional e portfólio digital desenvolvido para o renomado estilista, destacando coleções e identidade visual elegante.</p>
                <a href="https://www.althairsanto.com.br" className="inline-flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors">Visitar projeto <ArrowRight className="w-4 h-4" /></a>
              </div>
            </div>

            {/* Portfolio Item 2 */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <div className="h-64 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                <img src="/assets/Nardelli.png" alt="Nardelli Usinagem" className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110 z-0" />
                {/* <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-800 to-slate-900 relative z-10"></div>
                <Database className="w-20 h-20 text-slate-600 relative z-20 group-hover:scale-110 transition-transform duration-500" /> */}
              </div>
              <div className="p-8">
                <div className="text-blue-400 text-sm font-semibold mb-2 tracking-wider">INDÚSTRIA</div>
                <h3 className="text-2xl font-bold mb-3">Nardelli Usinagem</h3>
                <p className="text-slate-400 mb-6">Plataforma B2B para apresentação de serviços de usinagem de precisão, maquinário e formulário de orçamento complexo.</p>
                <a href="https://www.nardelliusinagem.com.br" className="inline-flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors">Visitar projeto <ArrowRight className="w-4 h-4" /></a>
              </div>
            </div>

            {/* Portfolio Item 3 */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <div className="h-64 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                {/* <img src="/portfolio/onca.jpg" alt="Onça Filmes" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 z-0" /> */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-800 to-slate-900 relative z-10"></div>
                <Monitor className="w-20 h-20 text-slate-600 relative z-20 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-8">
                <div className="text-blue-400 text-sm font-semibold mb-2 tracking-wider">AUDIOVISUAL</div>
                <h3 className="text-2xl font-bold mb-3">Onça Filmes</h3>
                <p className="text-slate-400 mb-6">Site imersivo e dinâmico focado em exibir o showreel e produções da produtora, com alta performance em carregamento de vídeos.</p>
                <a href="#" className="inline-flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors">Visitar projeto <ArrowRight className="w-4 h-4" /></a>
              </div>
            </div>

            {/* Portfolio Item 4 */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <div className="h-64 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                {/* <img src="/portfolio/advocacia.jpg" alt="Escritório de Advocacia" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 z-0" /> */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-800 to-slate-900 relative z-10"></div>
                <Briefcase className="w-20 h-20 text-slate-600 relative z-20 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-8">
                <div className="text-blue-400 text-sm font-semibold mb-2 tracking-wider">JURÍDICO</div>
                <h3 className="text-2xl font-bold mb-3">Escritório de Advocacia</h3>
                <p className="text-slate-400 mb-6">Presença digital séria e confiável, apresentando áreas de atuação da banca, artigos jurídicos e integração com WhatsApp.</p>
                <a href="#" className="inline-flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors">Visitar projeto <ArrowRight className="w-4 h-4" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOVO: Section Modelos de Sites */}
      <section id="modelos" className="py-24 bg-slate-950 border-t border-slate-800 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-sm font-medium mb-6">
              <LayoutTemplate className="w-4 h-4" />
              Templates Premium
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Modelos de Sites</h2>
            <p className="text-slate-400 text-lg">
              Precisa de agilidade? Temos estruturas de alta conversão prontas para o seu nicho. Clique nos cards abaixo para visualizar a estrutura de cada modelo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templatesSites.map((template) => {
              const Icon = template.icon;
              const isExpanded = expandedTemplate === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => toggleTemplate(template.id)}
                  className={`
                    cursor-pointer transition-all duration-500 ease-in-out border rounded-2xl overflow-hidden
                    ${isExpanded
                      ? 'md:col-span-2 bg-slate-900 border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'}
                  `}
                >
                  {/* Cabeçalho do Card (Sempre visível) */}
                  <div className={`p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors ${isExpanded ? 'border-b border-slate-800' : ''}`}>
                    <div className="flex items-start gap-5">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${template.bgMockup} ${template.color} bg-opacity-20`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-white">{template.title}</h3>
                        <p className={`text-slate-400 text-sm leading-relaxed ${isExpanded ? 'max-w-3xl' : 'max-w-md'}`}>
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'bg-slate-800 rotate-180' : 'bg-slate-800/50'}`}>
                      <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-blue-400' : 'text-slate-400'}`} />
                    </div>
                  </div>

                  {/* Conteúdo Expandido (Mockup do Site) */}
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden`}
                    style={{ maxHeight: isExpanded ? '800px' : '0px', opacity: isExpanded ? 1 : 0 }}
                  >
                    <div className="p-8 pt-6">
                      <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                        {/* Barra do Navegador */}
                        <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                          <div className="ml-4 bg-slate-900 rounded-md h-6 flex-1 max-w-sm flex items-center px-3">
                            <span className="text-slate-500 text-xs font-mono truncate">https://seu-dominio.com.br/{template.id}</span>
                          </div>
                        </div>
                        {/* Corpo do Site (Renderizado por função) */}
                        <div className="h-[400px] md:h-[500px] overflow-hidden relative">
                          {renderMockupContent(template.id)}

                          {/* Gradiente para disfarçar o corte na base */}
                          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Highlight: Tratto */}
      <section id="produtos" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-slate-950 z-0"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 shadow-2xl">

            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 font-semibold mb-6">
                Produto Exclusivo
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Tratto</h2>
              <h3 className="text-xl text-blue-400 mb-6 font-medium">Gestão e Agendamento para Estética</h3>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Uma plataforma 100% online desenvolvida pela automatas.tech. Crie sua conta em minutos e revolucione a gestão do seu salão de beleza, barbearia, esmalteria ou clínica de estética.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                  <span className="text-slate-200">Agendamento online 24/7 integrado com WhatsApp.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                  <span className="text-slate-200">Gerenciamento financeiro completo (caixa, comissões, despesas).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                  <span className="text-slate-200">Histórico de atendimento e prontuário de clientes.</span>
                </li>
              </ul>

              <button className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                Criar Conta no Tratto
              </button>
            </div>

            <div className="lg:w-1/2 w-full relative">
              {/* Abstract Dashboard Representation */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 relative z-10 aspect-video flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-slate-400 font-medium tracking-widest text-sm">TRATTO DASHBOARD</div>
                </div>
                <div className="flex gap-4 flex-1">
                  <div className="w-1/3 flex flex-col gap-4">
                    <div className="bg-slate-700/50 rounded-lg h-24 p-4 border border-slate-600/50">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 mb-2"></div>
                      <div className="h-2 w-16 bg-slate-500 rounded mb-2"></div>
                      <div className="h-4 w-24 bg-slate-400 rounded"></div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg h-24 p-4 border border-slate-600/50">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 mb-2"></div>
                      <div className="h-2 w-16 bg-slate-500 rounded mb-2"></div>
                      <div className="h-4 w-24 bg-slate-400 rounded"></div>
                    </div>
                  </div>
                  <div className="w-2/3 bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 flex flex-col">
                    <div className="h-4 w-32 bg-slate-500 rounded mb-6"></div>
                    <div className="flex-1 flex items-end gap-2">
                      <div className="w-full bg-blue-500/40 rounded-t-md h-1/3"></div>
                      <div className="w-full bg-blue-500/60 rounded-t-md h-2/3"></div>
                      <div className="w-full bg-blue-500/80 rounded-t-md h-1/2"></div>
                      <div className="w-full bg-blue-500 rounded-t-md h-full"></div>
                      <div className="w-full bg-blue-500/90 rounded-t-md h-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements behind dashboard */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-40"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-30"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Automation Flow Section */}
      <section id="automacao" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">O Poder da Automação com n8n</h2>
            <p className="text-lg text-slate-400">
              Desenvolvemos servidores locais ou em nuvem com <span className="text-orange-500 font-bold">n8n</span> para criar fluxos de trabalho personalizados. Chega de tarefas manuais: integramos seus sites, e-mails, WhatsApp e ferramentas de gestão automaticamente.
            </p>
          </div>

          {/* Workflow Graphic */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-10 relative z-20">
              {n8nUseCases.map((useCase, index) => (
                <button
                  key={useCase.id}
                  onClick={() => setActiveN8nTab(index)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeN8nTab === index
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                    }`}
                >
                  {useCase.tabTitle}
                </button>
              ))}
            </div>

            <div key={activeN8nTab} className="animate-[fadeIn_0.5s_ease-out]">
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-center text-white">
                {n8nUseCases[activeN8nTab].title}
              </h3>
              <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
                {n8nUseCases[activeN8nTab].description}
              </p>

              <div className="flex flex-col lg:flex-row items-start justify-center lg:justify-between gap-8 lg:gap-0 relative z-10 pt-4 lg:pt-8">

                {/* Step 1 */}
                <div className="flex flex-col items-center text-center w-full lg:w-[200px] xl:w-[220px] shrink-0 lg:mt-[84px]">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center mb-4 shadow-lg z-10 transition-transform hover:scale-105">
                    {(() => {
                      const Step1Icon = n8nUseCases[activeN8nTab].step1.icon;
                      return <Step1Icon className="w-10 h-10 text-blue-400" />;
                    })()}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{n8nUseCases[activeN8nTab].step1.title}</h4>
                  <p className="text-sm text-slate-400">{n8nUseCases[activeN8nTab].step1.desc}</p>
                </div>

                {/* Arrow 1 */}
                <div className="hidden lg:flex flex-1 items-center px-2 xl:px-4 lg:mt-[124px]">
                  <div className="h-1 w-full bg-slate-700 relative overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 h-full bg-blue-500 w-1/2 animate-[slideRight_2s_infinite]"></div>
                  </div>
                </div>
                <div className="lg:hidden flex justify-center w-full my-6">
                  <div className="w-1 h-12 bg-slate-700 relative overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 w-full bg-blue-500 h-1/2 animate-[slideDown_2s_infinite]"></div>
                  </div>
                </div>

                {/* Step 2 + AI Agent */}
                <div className="flex flex-col items-center text-center w-full lg:w-[220px] xl:w-[240px] shrink-0 relative lg:mt-[76px]">

                  <div className="relative flex justify-center items-center gap-4 lg:gap-0 w-full">

                    {/* n8n core */}
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-orange-500/10 border-2 border-orange-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.2)] relative z-10 shrink-0">
                      <Workflow className="w-10 h-10 lg:w-12 lg:h-12 text-orange-500" />
                      <div className="absolute -bottom-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">n8n core</div>
                    </div>

                    {/* AI Agent Optional Block */}
                    {n8nUseCases[activeN8nTab].aiAgent && (
                      <>
                        {/* Mobile Horizontal Arrows */}
                        <div className="flex lg:hidden flex-col justify-center gap-2">
                          <ArrowRight className="w-4 h-4 text-purple-400 animate-pulse" />
                          <ArrowLeft className="w-4 h-4 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* Mobile AI Icon */}
                        <div className="lg:hidden w-20 h-20 rounded-2xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)] relative shrink-0">
                          <BrainCircuit className="w-8 h-8 text-purple-400" />
                          <div className="absolute -bottom-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">Agente IA</div>
                        </div>

                        {/* Desktop AI Block */}
                        <div className="hidden lg:flex flex-col items-center absolute bottom-[75%] left-[75%] xl:left-[85%] w-[180px] xl:w-[200px] z-20 animate-[fadeIn_0.5s_ease-out_0.3s_both]">
                          {/* Desktop Diagonal Arrows */}
                          <div className="absolute left-[-28px] xl:left-[-32px] bottom-[16px] xl:bottom-[20px] flex flex-col">
                            <ArrowUpRight strokeWidth={2.5} className="w-5 h-5 xl:w-6 xl:h-6 text-purple-400 animate-[pulse_1.5s_infinite] mb-[-4px]" />
                            <ArrowDownLeft strokeWidth={2.5} className="w-5 h-5 xl:w-6 xl:h-6 text-purple-400 animate-[pulse_1.5s_infinite]" style={{ animationDelay: '0.75s' }} />
                          </div>

                          {/* AI Icon */}
                          <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] relative group cursor-default">
                            <BrainCircuit className="w-7 h-7 xl:w-8 xl:h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                            <div className="absolute -bottom-2 bg-purple-600 text-white text-[9px] xl:text-[10px] font-bold px-2 xl:px-3 py-0.5 rounded-full whitespace-nowrap shadow-md">Agente IA</div>
                          </div>

                          {/* AI Text */}
                          <p className="text-[10px] xl:text-[11px] text-purple-200 bg-slate-900/95 backdrop-blur-sm p-2.5 xl:p-3 rounded-xl border border-purple-500/30 text-center leading-relaxed shadow-xl w-full">
                            {n8nUseCases[activeN8nTab].aiAgent.desc}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <h4 className="font-bold text-lg mb-2 mt-6">2. Automação</h4>
                  <p className="text-sm text-slate-400 max-w-[200px] xl:max-w-[220px]">O servidor n8n recebe os dados instantaneamente e inicia o fluxo.</p>

                  {/* AI Text for Mobile */}
                  {n8nUseCases[activeN8nTab].aiAgent && (
                    <div className="flex lg:hidden mt-6 w-full justify-center">
                      <p className="text-xs text-purple-200 bg-slate-900/95 backdrop-blur-sm p-3 rounded-xl border border-purple-500/30 text-center leading-relaxed shadow-xl max-w-[280px]">
                        <strong>Agente IA:</strong> {n8nUseCases[activeN8nTab].aiAgent.desc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Arrow 2 */}
                <div className="hidden lg:flex flex-1 items-center px-2 xl:px-4 lg:mt-[124px]">
                  <div className="h-1 w-full bg-slate-700 relative overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 h-full bg-blue-500 w-1/2 animate-[slideRight_2s_infinite_0.5s]"></div>
                  </div>
                </div>
                <div className="lg:hidden flex justify-center w-full my-6">
                  <div className="w-1 h-12 bg-slate-700 relative overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 w-full bg-blue-500 h-1/2 animate-[slideDown_2s_infinite_0.5s]"></div>
                  </div>
                </div>

                {/* Step 3 (Split) */}
                <div className="flex flex-col gap-4 w-full lg:w-[260px] xl:w-[280px] shrink-0">
                  {n8nUseCases[activeN8nTab].step3.map((action, idx) => {
                    const ActionIcon = action.icon;
                    return (
                      <div key={idx} className="bg-slate-800 border border-slate-600 rounded-xl p-4 flex items-center gap-4 z-10 transition-transform hover:translate-x-2">
                        <ActionIcon className={`w-8 h-8 shrink-0 ${action.color}`} />
                        <div className="text-left">
                          <h5 className="font-bold text-sm">{action.title}</h5>
                          <p className="text-xs text-slate-400">{action.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Background nodes for decoration */}
            <div className="absolute top-10 left-10 text-slate-800/20"><Server size={120} /></div>
            <div className="absolute bottom-10 right-10 text-slate-800/20"><Code2 size={120} /></div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <Server className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Servidores Locais</h3>
              <p className="text-slate-400">Configuramos a infraestrutura de automação dentro da sua empresa, garantindo segurança total dos dados e autonomia sem custos mensais de cloud.</p>
            </div>
            <div className="p-6">
              <MessageSquare className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Bots & WhatsApp</h3>
              <p className="text-slate-400">Automatize o atendimento aos seus clientes, agendamentos, disparo de mensagens e lembretes integrados ao seu sistema de gestão.</p>
            </div>
            <div className="p-6">
              <Workflow className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Processos Sob Medida</h3>
              <p className="text-slate-400">Cada empresa é única. Mapeamos suas tarefas repetitivas e construímos fluxos exclusivos que conectam ERPs, CRMs, planilhas e mais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-slate-700 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para inovar?</h2>
              <p className="text-lg text-slate-400 mb-8">
                Seja para desenvolver o novo site da sua empresa, usar a plataforma Tratto ou automatizar seus processos com n8n, a automatas.tech está pronta para ser sua parceira tecnológica.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-300">
                  <Mail className="w-6 h-6 text-blue-400" />
                  <span>contato@automatas.tech</span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                  <span>Atendimento via WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="md:w-1/2">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo *</label>
                  <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="João Silva" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">E-mail *</label>
                  <input required type="email" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="joao@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Número para contato *</label>
                  <input required type="text" value={telefone} onChange={handleTelefoneChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="(11) 9 9999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Preferência de contato</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none">
                    <option>E-mail</option>
                    <option>WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Do que você precisa?</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none">
                    <option>Desenvolvimento de Site</option>
                    <option>Sistema Tratto</option>
                    <option>Automação com n8n</option>
                    <option>Consultoria em Tecnologia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Motivo do contato (Opcional)</label>
                  <textarea rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="Conte-nos um pouco sobre o que precisa..."></textarea>
                  <p className="text-xs text-slate-500 mt-2">Isso é importante para identificarmos as tecnologias que já usa, o que precisa ser feito e o grau de urgência.</p>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-colors mt-2">
                  Solicitar Contato
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 text-xl font-bold mb-4">
            <Bot className="w-6 h-6 text-blue-500" />
            <span>automatas<span className="text-blue-500">.tech</span></span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} automatas.tech. Todos os direitos reservados. Transformando o futuro com tecnologia e automação.
          </p>
          <div className="mt-3">
            <Link href="/politica-de-privacidade" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
