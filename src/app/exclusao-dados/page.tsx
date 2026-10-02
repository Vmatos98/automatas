'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  Lock,
  FileCheck2,
} from 'lucide-react';

type FlowStep = 'INPUT' | 'OTP' | 'CONFIRMED';

export default function ExclusaoDados() {
  const [step, setStep] = useState<FlowStep>('INPUT');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [reason, setReason] = useState('Revogação de consentimento / Exclusão total');
  const [otpCode, setOtpCode] = useState('');

  // Estados de Carregamento e Mensagens
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [protocol, setProtocol] = useState('');
  const [confirmedAt, setConfirmedAt] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Timer para expiração do OTP (10 minutos)
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'OTP' && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, secondsLeft]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Etapa 1: Validar no cadastro e solicitar envio de OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phoneOrEmail.trim()) {
      setErrorMessage('Por favor, informe seu telefone com DDD ou e-mail.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/exclusao-dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_OTP',
          phoneOrEmail: phoneOrEmail.trim(),
          userName: userName.trim(),
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (!data.userFound) {
          setErrorMessage(
            'Nenhum dado pessoal ou registro ativo foi localizado para este telefone/e-mail em nossos sistemas. Seus dados não constam em nossa base, portanto não há dados a serem expurgados.'
          );
        } else {
          setErrorMessage(data.message || 'Não foi possível processar a solicitação no momento.');
        }
        setLoading(false);
        return;
      }

      // Sucesso na localização: transitar para a etapa de validação de titularidade
      setMaskedTarget(data.maskedTarget || phoneOrEmail);
      setProtocol(data.protocol || '');
      setDebugOtp(data.debugCode || null);
      setSecondsLeft(data.expiresInSeconds || 600);
      setOtpCode('');
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage('Erro de conexão ao verificar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: Validar OTP e autenticar a exclusão
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = otpCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('O código de verificação deve conter exatamente 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/exclusao-dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          phoneOrEmail: phoneOrEmail.trim(),
          code: cleanCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Código de verificação incorreto ou expirado.');
        setLoading(false);
        return;
      }

      setProtocol(data.protocol);
      setConfirmedAt(data.confirmedAt || new Date().toISOString());
      setStep('CONFIRMED');
    } catch (err: any) {
      setErrorMessage('Falha ao autenticar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('INPUT');
    setPhoneOrEmail('');
    setUserName('');
    setOtpCode('');
    setErrorMessage('');
    setDebugOtp(null);
    setProtocol('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 py-4">
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <span>
              automatas<span className="text-blue-500">.tech</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/privacidade"
              className="text-xs md:text-sm text-slate-400 hover:text-blue-400 transition-colors hidden sm:inline-block"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/termos"
              className="text-xs md:text-sm text-slate-400 hover:text-blue-400 transition-colors hidden sm:inline-block"
            >
              Termos de Serviço
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-6">
          <Trash2 className="w-3.5 h-3.5" />
          Rito Formal de Exclusão de Dados • Meta Platforms & LGPD
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Solicitação e Expurgo de Dados do Usuário
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed">
          Em conformidade estrita com o Artigo 18 da Lei Geral de Proteção de Dados (LGPD) e com as políticas para desenvolvedores da Meta Platforms (WhatsApp Business Cloud API).
        </p>

        {/* Security & Anti-Fraud Notice */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 mb-10 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-100 mb-1.5 flex items-center gap-2">
                <span>Protocolo de Segurança e Proteção Anti-Fraude</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Dupla Validação
                </span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Para impedir que terceiros solicitem indevidamente a exclusão ou expurgo de dados alheios, o envio do formulário <strong>abre um pedido formal</strong> que passa por duas verificações obrigatórias:
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-200">Verificação de Existência:</strong> O sistema checa se os dados realmente existem em nossos cadastros ou interações via WhatsApp.</li>
                <li><strong className="text-slate-200">Validação de Titularidade (OTP):</strong> Um código de uso único (6 dígitos) é enviado diretamente ao canal informado para comprovar que o solicitante é o legítimo proprietário da conta.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Instructions and Guidelines */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Como funciona o fluxo de exclusão:
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex gap-3">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${step === 'INPUT' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  1
                </span>
                <div className="text-sm">
                  <strong className="text-slate-200 block mb-1">Abertura de Pedido & Checagem Cadastral</strong>
                  <span className="text-slate-400 text-xs">
                    Informe seu telefone ou e-mail. Se nenhum registro for encontrado, nenhuma informação sua está retida.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex gap-3">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${step === 'OTP' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  2
                </span>
                <div className="text-sm">
                  <strong className="text-slate-200 block mb-1">Confirmação de Posse via Código OTP</strong>
                  <span className="text-slate-400 text-xs">
                    Receba o código temporário de 6 dígitos no canal cadastrado para autenticar que você é o titular legítimo.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex gap-3">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${step === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  3
                </span>
                <div className="text-sm">
                  <strong className="text-slate-200 block mb-1">Emissão de Protocolo e Agendamento de Expurgo</strong>
                  <span className="text-slate-400 text-xs">
                    Com a titularidade autenticada, um protocolo oficial é gerado e o expurgo definitivo é processado conforme a LGPD.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-slate-300 space-y-1.5">
              <strong className="text-blue-300 block">Prazos e Tipos de Dados Excluídos:</strong>
              <p>• <strong>Prazo legal:</strong> Até 15 dias úteis, conforme estipulado pela LGPD.</p>
              <p>• <strong>Escopo do expurgo:</strong> Histórico de mensagens do WhatsApp, metadados da Meta Graph API, identificadores de usuário e cadastros vinculados.</p>
            </div>
          </div>

          {/* Interactive Request Form with 3-Step Wizard */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* ETAPA 1: SOLICITAÇÃO & VERIFICAÇÃO CADASTRAL */}
            {step === 'INPUT' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    Abrir Pedido de Exclusão
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Passo 1 de 2: Informe os dados para validação cadastral prévia.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold mb-1">Aviso do Sistema</p>
                      <p className="text-slate-300 leading-relaxed">{errorMessage}</p>
                      <p className="text-[11px] text-amber-400/80 mt-2 font-mono">
                        💡 Dica de teste: Utilize o número demonstrativo <strong>5511999998888</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Completo ou Razão Social
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Número de WhatsApp (com DDD) ou E-mail cadastrado
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="Ex: 5511999998888 ou seu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Motivo da Solicitação
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Revogação de consentimento / Exclusão total">Revogação de consentimento / Exclusão total</option>
                    <option value="Encerramento de conta no automatas.tech">Encerramento de conta no automatas.tech</option>
                    <option value="Desconexão da conta de WhatsApp Business">Desconexão da conta de WhatsApp Business</option>
                    <option value="Outro motivo">Outro motivo</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verificando cadastro...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Verificar Cadastro & Solicitar Código OTP
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-center leading-normal">
                  Uma confirmação posterior via código de segurança será necessária antes do agendamento definitivo do expurgo.
                </p>
              </form>
            )}

            {/* ETAPA 2: VALIDAÇÃO DE TITULARIDADE (CÓDIGO OTP) */}
            {step === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    Passo 2 de 2: Validação de Titularidade
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">
                    Confirme o Código de Segurança
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Identificamos seu registro no sistema! Um código de 6 dígitos foi enviado para:{' '}
                    <strong className="text-slate-200">{maskedTarget}</strong>.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Badge com código gerado para testes locais e auditoria */}
                {debugOtp && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Código de Simulação Local: <span className="font-mono text-sm font-bold tracking-widest text-emerald-200">{debugOtp}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Disponibilizado para fins de auditoria e testes do ambiente de homologação.
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Código de Verificação (6 dígitos)
                    </label>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Expira em: <strong className="text-blue-400">{formatTimer(secondsLeft)}</strong>
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-3 text-center text-xl tracking-[0.5em] font-mono text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6 || secondsLeft === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm transition-all shadow-lg shadow-red-900/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Validando código...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Confirmar Titularidade & Exclusão
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('INPUT')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ← Alterar dados
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reenviar código
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ETAPA 3: PROTOCOLO EMITIDO & CONFIRMAÇÃO OFICIAL */}
            {step === 'CONFIRMED' && (
              <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-900/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Titularidade Autenticada
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 mt-2">
                    Solicitação Registrada com Sucesso!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                    Sua identidade e posse do canal foram comprovadas via código OTP. O pedido de expurgo foi agendado em nossa fila definitiva de segurança.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Protocolo Oficial:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{protocol}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-blue-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Agendado para Expurgo
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Titular Validado:</span>
                    <span className="text-slate-200 font-medium">{userName || maskedTarget}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Autenticado em:</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {new Date(confirmedAt || Date.now()).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal">
                  Guarde este número de protocolo. Todos os dados vinculados serão purgados no prazo de até 15 dias úteis, em conformidade com o Artigo 18 da LGPD.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Iniciar nova consulta ou solicitação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 text-center mt-12 bg-slate-950">
        <div className="container mx-auto px-6">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} automatas.tech. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-6 mt-3 text-xs text-slate-400">
            <Link href="/privacidade" className="hover:text-blue-400">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-blue-400">
              Termos de Serviço
            </Link>
            <Link href="/exclusao-dados" className="text-blue-400">
              Exclusão de Dados
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
