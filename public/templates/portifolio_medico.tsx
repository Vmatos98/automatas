import React, { useState } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  Activity, 
  Clock, 
  MapPin, 
  Phone, 
  Menu, 
  X, 
  Award, 
  ShieldCheck,
  ChevronRight,
  Instagram,
  Linkedin,
  Mail
} from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (id:any) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="font-sans text-slate-800 bg-slate-50 min-h-screen">
      
      {/* Header & Navigation */}
      <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollToSection('home')}>
              <HeartPulse className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-xl text-slate-900 leading-tight">Dr. Carlos Eduardo</h1>
                <p className="text-xs text-blue-600 font-medium">Cardiologista • CRM-SP 123456</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Início</button>
              <button onClick={() => scrollToSection('especialidades')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Especialidades</button>
              <button onClick={() => scrollToSection('sobre')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Sobre Mim</button>
              <button onClick={() => scrollToSection('contato')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Contato</button>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Agendar Consulta
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={toggleMenu} className="text-slate-600 hover:text-blue-600 focus:outline-none">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg absolute w-full left-0">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <button onClick={() => scrollToSection('home')} className="block w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium">Início</button>
              <button onClick={() => scrollToSection('especialidades')} className="block w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium">Especialidades</button>
              <button onClick={() => scrollToSection('sobre')} className="block w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium">Sobre Mim</button>
              <button onClick={() => scrollToSection('contato')} className="block w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium">Contato</button>
              <div className="pt-4">
                <button className="w-full bg-blue-600 text-white px-3 py-3 rounded-md font-medium flex justify-center items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Agendar Agora
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            
            <div className="w-full md:w-1/2 space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-2">
                <Activity className="w-4 h-4 mr-2" />
                Cuidando do seu coração
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                Sua saúde <span className="text-blue-600">cardiovascular</span> em boas mãos.
              </h2>
              <p className="text-lg text-slate-600 md:pr-10 leading-relaxed">
                Atendimento humanizado, diagnóstico preciso e tratamentos modernos para garantir que seu coração bata no ritmo certo por muitos anos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl flex justify-center items-center group">
                  Agendar Consulta
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => scrollToSection('especialidades')} className="bg-white border-2 border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 px-8 py-3.5 rounded-full font-semibold transition-all flex justify-center items-center">
                  Conhecer Serviços
                </button>
              </div>

              <div className="flex items-center gap-6 pt-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Atendimento Particular</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <span>Membro SBC</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1612531386530-972844b3c413?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="[Imagem de um médico cardiologista homem experiente sorrindo]" 
                  className="w-full h-[500px] object-cover object-top"
                />
                {/* Floating Badge */}
                <div className="absolute bottom-6 -left-6 md:-left-8 bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <HeartPulse className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Mais de</p>
                    <p className="font-bold text-slate-900 leading-none">10.000 pacientes</p>
                    <p className="text-xs text-slate-500">atendidos</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services / Especialidades Section */}
      <section id="especialidades" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-2">Áreas de Atuação</h3>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Especialidades e Exames</h2>
            <p className="text-slate-600 text-lg">
              Prevenção, diagnóstico e tratamento de doenças cardiovasculares com tecnologia de ponta e acompanhamento contínuo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-blue-100 transition-all group">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <HeartPulse className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Check-up Cardiológico</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Avaliação completa para prevenção de doenças do coração. Ideal para quem busca longevidade com qualidade de vida.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-blue-100 transition-all group">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Activity className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Hipertensão Arterial</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Diagnóstico e controle da pressão alta, ajustando medicações e hábitos para evitar complicações futuras.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-blue-100 transition-all group">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Stethoscope className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Arritmias Cardíacas</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Investigação de palpitações e batimentos irregulares através de Holter e Eletrocardiograma detalhado.
              </p>
            </div>

             {/* Service 4 */}
             <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-blue-100 transition-all group">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <svg className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Risco Cirúrgico</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Avaliação pré-operatória minuciosa para garantir a segurança cardiovascular do paciente antes de procedimentos cirúrgicos.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-blue-100 transition-all group lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="bg-teal-100 w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                  <HeartPulse className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Exames no Consultório</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Realizamos Eletrocardiograma (ECG), Ecocardiograma com Doppler e MAPA 24h com laudos rápidos e precisos, otimizando seu tempo e facilitando o início do tratamento adequado.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="w-full lg:w-5/12">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1612531386530-972844b3c413?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="[Imagem de um médico cardiologista homem experiente]" 
                  className="rounded-2xl shadow-xl w-full object-cover h-[600px]"
                />
                <div className="absolute -bottom-8 -right-8 bg-blue-600 text-white p-8 rounded-2xl shadow-xl hidden md:block">
                  <p className="text-4xl font-bold mb-1">15+</p>
                  <p className="text-blue-100 font-medium">Anos de<br/>Experiência</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-7/12 space-y-6">
              <h3 className="text-blue-600 font-semibold tracking-wide uppercase text-sm">Conheça o Especialista</h3>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Dr. Carlos Eduardo da Silva</h2>
              <p className="text-xl text-slate-600 italic border-l-4 border-blue-600 pl-4 py-1">
                "Meu compromisso é tratar o paciente, não apenas a doença. Ouvir, entender e propor o melhor cuidado possível."
              </p>
              
              <div className="text-slate-600 space-y-4 leading-relaxed">
                <p>
                  Sou médico formado pela Universidade Federal de Sergipe (UFS), com residência médica em Cardiologia Clínica pelo Instituto do Coração (InCor - HC/FMUSP) e especialização em Ecocardiografia.
                </p>
                <p>
                  Acredito em uma medicina baseada em evidências científicas, mas entregue com profunda empatia e clareza. Meu objetivo é desmistificar as doenças do coração, ajudando você a tomar as rédeas da sua saúde cardiovascular de forma preventiva e inteligente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-bold text-slate-900">Título de Especialista</h5>
                    <p className="text-sm text-slate-500">Pela Sociedade Brasileira de Cardiologia (SBC).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-bold text-slate-900">Membro Titular</h5>
                    <p className="text-sm text-slate-500">Departamento de Imagem Cardiovascular (DIC).</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Não deixe a saúde do seu coração para depois.
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Agende seu check-up hoje mesmo. Um diagnóstico precoce é o primeiro passo para uma vida longa e saudável.
          </p>
          <button className="bg-white text-blue-700 hover:bg-slate-50 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl inline-flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Fale com a Recepção no WhatsApp
          </button>
        </div>
      </section>

      {/* Contact & Location Section */}
      <section id="contato" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-2">Informações</h3>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Agende sua Consulta</h2>
                <p className="text-slate-600">
                  Estamos prontos para receber você com conforto e pontualidade. Entre em contato pelos canais abaixo ou visite nosso consultório.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Endereço</h4>
                    <p className="text-slate-600 mt-1">Av. Paulista, 1000<br/>Edifício Paulista Medical, Sala 120<br/>Bela Vista, São Paulo - SP, 01310-100</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Telefone & WhatsApp</h4>
                    <p className="text-slate-600 mt-1">(11) 3210-0000</p>
                    <p className="text-slate-600">(11) 99999-0000 <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">WhatsApp</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Horário de Funcionamento</h4>
                    <p className="text-slate-600 mt-1">Segunda a Sexta: 08:00 às 18:00<br/>Sábado e Domingo: Fechado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-full min-h-[400px] bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner flex items-center justify-center">
              {/* This is a visual placeholder for a Google Maps iframe */}
              <div className="text-center p-6">
                <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">Mapa Interativo</h3>
                <p className="text-slate-500 text-sm mb-4">
                  (Para uso real, substitua este contêiner por um iframe do Google Maps da sua clínica)
                </p>
                <button className="bg-blue-100 text-blue-700 px-6 py-2 rounded-full text-sm font-semibold">
                  Abrir no Google Maps
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <HeartPulse className="h-6 w-6 text-blue-500" />
                <h1 className="font-bold text-lg text-white">Dr. Carlos Eduardo</h1>
              </div>
              <p className="text-sm text-slate-400 mb-4 max-w-xs">
                Cardiologia integrada, focada na prevenção e no bem-estar integral do paciente.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Acesso Rápido</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-blue-400 transition-colors">Início</button></li>
                <li><button onClick={() => scrollToSection('especialidades')} className="hover:text-blue-400 transition-colors">Especialidades</button></li>
                <li><button onClick={() => scrollToSection('sobre')} className="hover:text-blue-400 transition-colors">Sobre o Doutor</button></li>
                <li><button onClick={() => scrollToSection('contato')} className="hover:text-blue-400 transition-colors">Contato e Localização</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Informações Legais</h4>
              <p className="text-sm text-slate-400 mb-2">Responsável Técnico:</p>
              <p className="text-sm font-semibold text-slate-300 mb-4">Dr. Carlos Eduardo da Silva<br/>CRM-SP 123456 | RQE 6789</p>
              <p className="text-xs text-slate-500">
                As informações disponíveis neste site têm caráter estritamente educativo, não substituindo a consulta médica.
              </p>
            </div>

          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Dr. Carlos Eduardo. Todos os direitos reservados.</p>
            <p className="mt-2 md:mt-0">Desenvolvido com <HeartPulse className="w-3 h-3 inline text-red-500 mx-1"/> para a área da saúde.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}