import Link from 'next/link';
import { Bot, ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

export const metadata = {
  title: 'Termos de Serviço | automatas.tech',
  description: 'Termos de Serviço e Condições de Uso da plataforma e soluções da automatas.tech para integração com WhatsApp Business Platform.',
};

export default function TermosDeServico() {
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
              href="/privacidade"
              className="text-xs md:text-sm text-slate-400 hover:text-blue-400 transition-colors hidden sm:inline-block"
            >
              Política de Privacidade
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <Scale className="w-3.5 h-3.5" />
          Termos e Condições Oficiais
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Termos de Serviço
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-8">
          Vigência a partir de: 28 de Setembro de 2026 • Versão 2.0
        </p>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 mb-12">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Estes Termos de Serviço regulam o acesso e o uso dos softwares, agentes cognitivos, automações, APIs e interfaces disponibilizados pela <strong>automatas.tech</strong>, incluindo as ferramentas de integração com a <strong>WhatsApp Business Platform (Meta Platforms, Inc.)</strong>. Ao contratar, acessar ou utilizar nossos serviços, o Usuário ou Empresa concorda integralmente com as disposições aqui estabelecidas.
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
                Objeto e Escopo dos Serviços
              </h2>
            </div>
            <p>
              A <strong>automatas.tech</strong> fornece infraestrutura tecnológica de ponta a ponta para automação de processos, atendimento empresarial com inteligência artificial generativa, integração via webhooks e intermediação técnica como Provedor de Soluções de Tecnologia (Tech Provider) conectado à Cloud API da Meta.
            </p>
            <p>
              Nossos serviços destinam-se precipuamente a pessoas jurídicas e profissionais para otimização de fluxos operacionais, vendas e pós-venda.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                2
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Uso Aceitável e Políticas da Meta / WhatsApp
              </h2>
            </div>
            <p>
              O contratante declara ter ciência e se compromete expressamente a cumprir todas as normas e exigências da <strong>Meta Platforms, Inc.</strong>, incluindo a Política Comercial do WhatsApp e a Política de Mensagens do WhatsApp Business. É terminantemente proibido:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-200 text-xs md:text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Prática de SPAM:</strong> Envio de mensagens em massa não solicitadas a contatos que não forneceram consentimento prévio e explícito (Opt-in).
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-200 text-xs md:text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Conteúdo Ilícito ou Restrito:</strong> Divulgação de produtos não autorizados pela Meta (drogas, armas, esquemas piramidais, apostas não reguladas ou conteúdo de ódio).
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-200 text-xs md:text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Desrespeito ao Opt-out:</strong> Não disponibilizar mecanismo imediato de descadastramento (ex: comandos como &quot;PARAR&quot; ou &quot;SAIR&quot;) aos destinatários finais.
                </span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              A automatas.tech reserva-se o direito de suspender ou rescindir imediatamente o acesso à plataforma e às credenciais de API em caso de infração comprovada às políticas da Meta ou à legislação em vigor.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                3
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Onboarding e Cadastro Embutido (Embedded Signup)
              </h2>
            </div>
            <p>
              Para utilizar a integração com o WhatsApp, o cliente vinculará sua Conta do Gerenciador de Negócios da Meta (Meta Business Manager) através do fluxo oficial de <strong>Embedded Signup</strong>. O cliente permanece como titular exclusivo de sua conta WABA e número de telefone, sendo o único responsável pela verificação da sua empresa perante a Meta.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                4
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Disponibilidade, Suporte e Níveis de Serviço (SLA)
              </h2>
            </div>
            <p>
              A automatas.tech emprega os melhores esforços técnicos para manter a disponibilidade contínua da plataforma (meta de 99.5% de uptime). Não respondemos, contudo, por indisponibilidades decorrentes de:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-400 text-xs md:text-sm">
              <li>Interrupções ou instabilidades nos servidores da Meta / WhatsApp Cloud API;</li>
              <li>Falhas na conexão de internet do cliente ou em provedores de telecomunicações de terceiros;</li>
              <li>Manutenções programadas devidamente comunicadas aos usuários.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                5
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Privacidade e Proteção de Dados
              </h2>
            </div>
            <p>
              O tratamento de dados pessoais em conexão com estes serviços está pormenorizado em nossa{' '}
              <Link href="/privacidade" className="text-blue-400 underline font-semibold">
                Política de Privacidade
              </Link>{' '}
              e na seção de{' '}
              <Link href="/exclusao-dados" className="text-blue-400 underline font-semibold">
                Instruções de Exclusão de Dados
              </Link>
              , partes integrantes e indissociáveis destes Termos.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                6
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Legislação Aplicável e Foro
              </h2>
            </div>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o Código Civil Brasileiro, o Marco Civil da Internet (Lei nº 12.965/2014) e a LGPD (Lei nº 13.709/2018). As partes elegem o foro da comarca da sede da contratada para dirimir quaisquer litígios oriundos deste instrumento.
            </p>
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
            <Link href="/privacidade" className="hover:text-blue-400">Política de Privacidade</Link>
            <Link href="/termos" className="text-blue-400">Termos de Serviço</Link>
            <Link href="/exclusao-dados" className="hover:text-blue-400">Exclusão de Dados</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
