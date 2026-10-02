import Link from 'next/link';
import { Bot, ArrowLeft, ShieldCheck, Lock, Database, UserCheck, Mail, FileText } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | automatas.tech',
  description: 'Política de Privacidade e Proteção de Dados da automatas.tech para uso da plataforma e integrações WhatsApp Business Cloud API.',
};

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 py-4">
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <span>automatas<span className="text-blue-500">.tech</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/termos"
              className="text-xs md:text-sm text-slate-400 hover:text-blue-400 transition-colors hidden sm:inline-block"
            >
              Termos de Serviço
            </Link>
            <Link
              href="/exclusao-dados"
              className="text-xs md:text-sm text-slate-400 hover:text-blue-400 transition-colors hidden sm:inline-block"
            >
              Exclusão de Dados
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs md:text-sm text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 md:px-12 py-12 md:py-16 max-w-4xl">
        {/* Title Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          Conformidade LGPD & Meta Tech Provider
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Política de Privacidade
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-8">
          Última atualização: 28 de Setembro de 2026 • Versão 2.1
        </p>

        {/* Highlight Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40 border border-blue-900/40 mb-12">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            A <strong>automatas.tech</strong> tem o compromisso inabalável de resguardar a privacidade e proteger os dados pessoais de seus clientes, usuários e contatos. Esta Política descreve de forma clara e transparente como tratamos, armazenamos e protegemos as informações coletadas em nossas plataformas de automação inteligente e integrações com a <strong>Meta Cloud API (WhatsApp Business Platform)</strong>, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e com as políticas para desenvolvedores da Meta Platforms, Inc.
          </p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed text-sm md:text-base">
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                1
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Identificação do Controlador
              </h2>
            </div>
            <p>
              O controlador dos dados para os efeitos desta política é a <strong>automatas.tech Soluções em Tecnologia e Automação</strong>, doravante denominada simplesmente como &quot;automatas.tech&quot;, responsável pelo desenvolvimento de software, integração de agentes cognitivos, automação de processos empresariais e atuação como Provedor de Tecnologia (Tech Provider) no ecossistema da Meta.
            </p>
            <p>
              Canal de comunicação do Encarregado de Proteção de Dados (DPO):{' '}
              <a href="mailto:contato@automatas.tech" className="text-blue-400 hover:underline">
                contato@automatas.tech
              </a>
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                2
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Dados Coletados e Finalidade do Tratamento
              </h2>
            </div>
            <p>
              Coletamos apenas os dados estritamente necessários para a prestação dos serviços contratados e funcionamento de nossas integrações:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-slate-100 mb-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Dados de Cadastro e Conta
                </div>
                <p className="text-slate-400 text-xs md:text-sm">
                  Nome, e-mail comercial, número de telefone corporativo, CNPJ e dados de faturamento utilizados para autenticação no portal, gestão de contas e suporte técnico.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-slate-100 mb-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Dados do WhatsApp Business API
                </div>
                <p className="text-slate-400 text-xs md:text-sm">
                  Identificador de Conta do WhatsApp Business (WABA ID), Phone Number ID, número de telefone do remetente/destinatário, carimbos de data/hora (timestamps), identificadores de mensagem (message ID) e o conteúdo textual das mensagens para execução dos fluxos automatizados.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              <strong>Finalidades:</strong> (a) Roteamento e envio de mensagens bidirecionais entre clientes e robôs de atendimento; (b) Processamento de consultas e ordens de automação via agentes inteligentes; (c) Monitoramento técnico de disponibilidade, entrega de mensagens e prevenção a fraudes; (d) Cumprimento de obrigações legais e regulatórias.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                3
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Integração com a Meta Platforms e WhatsApp Cloud API
              </h2>
            </div>
            <p>
              Ao utilizar os recursos de mensageria da automatas.tech com a tecnologia oficial do WhatsApp, as mensagens trafegam através dos servidores seguros da <strong>Meta Platforms, Inc.</strong> utilizando as APIs oficiais (Graph API v20.0+ e WhatsApp Business Platform).
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-400 text-sm md:text-base">
              <li>
                <strong>Não comercialização:</strong> A automatas.tech <strong>nunca comercializa, aluga ou compartilha</strong> dados de contatos, números de telefone ou teores de conversas com corretores de dados ou terceiros não autorizados.
              </li>
              <li>
                <strong>Conformidade com a Política da Meta:</strong> Nossas operações obedecem rigorosamente à Política Comercial do WhatsApp e às Diretrizes de Uso da Meta Cloud API.
              </li>
              <li>
                <strong>Embedded Signup:</strong> A vinculação da conta de WhatsApp Business do cliente é realizada através do fluxo oficial de onboarding embutido (Facebook Login for Business & Embedded Signup), garantindo que as permissões sejam expressamente outorgadas pelo proprietário do negócio.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                4
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Segurança da Informação e Armazenamento
              </h2>
            </div>
            <p>
              Empregamos padrões internacionais de segurança para preservar a integridade e confidencialidade de todos os dados:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-400 text-sm md:text-base">
              <li>Criptografia ponta a ponta e em trânsito (HTTPS / TLS 1.3) para todas as requisições de API e Webhooks;</li>
              <li>Criptografia de dados em repouso (AES-256) em bancos de dados e ambientes de computação em nuvem com conformidade SOC 2 e ISO 27001;</li>
              <li>Políticas estritas de controle de acesso fundamentadas no princípio do privilégio mínimo (least privilege);</li>
              <li>Logs de auditoria e monitoramento contínuo contra acessos não autorizados.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                5
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Retenção e Exclusão de Dados (Direito do Titular)
              </h2>
            </div>
            <p>
              Os dados de mensagens são armazenados temporariamente apenas pelo período necessário para viabilizar as interações e análises de desempenho do cliente.
            </p>
            <p>
              Em conformidade com a LGPD e as normas da Meta, qualquer usuário ou cliente pode solicitar a confirmação da existência de tratamento, correção de dados incompletos ou a <strong>exclusão total e definitiva</strong> de suas informações a qualquer momento.
            </p>
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-100">Instruções de Exclusão de Dados</h3>
                <p className="text-xs md:text-sm text-slate-400">
                  Consulte nossa página dedicada ou envie sua solicitação direta de expurgo de dados.
                </p>
              </div>
              <Link
                href="/exclusao-dados"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-semibold transition-all shrink-0"
              >
                Acessar Exclusão de Dados
              </Link>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                6
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Contato e Encarregado de Dados
              </h2>
            </div>
            <p>
              Caso tenha dúvidas sobre esta Política de Privacidade ou deseje exercer seus direitos de titular, entre em contato através dos canais oficiais:
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>E-mail: <strong>contato@automatas.tech</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Atendimento: Departamento de Privacidade e Compliance</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Plataforma: automatas.tech (Brasil)</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 text-center mt-12 bg-slate-950">
        <div className="container mx-auto px-6">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} automatas.tech. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-6 mt-3 text-xs text-slate-400">
            <Link href="/privacidade" className="text-blue-400">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-blue-400">Termos de Serviço</Link>
            <Link href="/exclusao-dados" className="hover:text-blue-400">Exclusão de Dados</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
