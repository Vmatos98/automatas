import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | automatas.tech',
  description: 'Política de privacidade da automatas.tech.',
};

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 py-5">
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <Bot className="w-7 h-7 text-blue-500" />
            <span>automatas<span className="text-blue-500">.tech</span></span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 md:px-12 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-10">Política de Privacidade</h1>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <p>
            A sua privacidade é importante para nós. É política do automatas tech respeitar a sua privacidade em
            relação a qualquer informação sua que possamos coletar no site automatas tech, e outros sites que
            possuímos e operamos.
          </p>

          <p>
            Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço.
            Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que
            estamos coletando e como será usado.
          </p>

          <p>
            Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando
            armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem
            como acesso, divulgação, cópia, uso ou modificação não autorizados.
          </p>

          <p>
            Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando
            exigido por lei.
          </p>

          <p>
            O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não
            temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas
            respectivas políticas de privacidade.
          </p>

          <p>
            Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos
            fornecer alguns dos serviços desejados.
          </p>

          <p>
            O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade
            e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações
            pessoais, entre em contacto connosco.
          </p>

          <h2 className="text-xl font-bold text-slate-50 pt-4">Compromisso do Usuário</h2>

          <p>
            O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o automatas tech oferece
            no site e com caráter enunciativo, mas não limitativo:
          </p>

          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-3">
              <span className="text-blue-400 font-semibold shrink-0">A)</span>
              <span>
                Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-semibold shrink-0">B)</span>
              <span>
                Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar,
                qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-semibold shrink-0">C)</span>
              <span>
                Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do automatas tech, de seus
                fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros
                sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.
              </span>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-50 pt-4">Mais informações</h2>

          <p>
            Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem
            certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos
            recursos que você usa em nosso site.
          </p>

          <p className="text-slate-500 text-sm pt-4 border-t border-slate-800">
            Esta política é efetiva a partir de 01 Janeiro 2026 00:01
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 text-center mt-8">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} automatas.tech. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
