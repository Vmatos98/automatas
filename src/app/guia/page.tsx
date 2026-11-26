'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Instagram,
  KeyRound,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Webhook,
} from 'lucide-react';

const WHATSAPP_LLM_PROMPT_MD = `# Integração Automatas Bridge API — WhatsApp Cloud API

Você é um agente de desenvolvimento integrando o nosso sistema com a **Automatas Bridge API** (\`automatas.tech\`), que atua como ponte oficial entre a nossa aplicação e a Meta WhatsApp Cloud API.

## 1. Resumo da Arquitetura da Ponte
1. **Login JWT (Conexão / Embedded Signup):** Valida o projeto e abre a mini-tela oficial \`https://automatas.tech/conectar?token=SEU_LOGIN_JWT&channel=whatsapp\` para o cliente final conectar o número do WhatsApp. Quando conclui, o popup dispara \`window.postMessage\` com \`type: "AUTOMATAS_HUB_CONNECTED"\`.
2. **API Key (\`aut_live_...\`):** Usada no backend da nossa aplicação no header \`x-api-key: aut_live_SUA_API_KEY\` para enviar mensagens, mídias e templates.
3. **Webhook + HMAC-SHA256:** Toda mensagem recebida ou status (\`sent\`, \`delivered\`, \`read\`, \`failed\`) é enviado via \`POST\` para a \`webhookUrl\` configurada no projeto com o header \`X-Automatas-Signature: sha256=HMAC_HEX\` (assinado com o \`AUTOMATAS_WEBHOOK_SECRET\` do projeto) e \`X-Automatas-Channel: whatsapp\`.

## 2. Base URL e Autenticação
- **Base URL:** \`https://api.automatas.tech/api/hub\`
- **Headers obrigatórios:**
  - \`Content-Type: application/json\`
  - \`x-api-key: aut_live_SUA_API_KEY\`

## 3. Endpoints WhatsApp

### 3.1 Conectar Número (Frontend Popup)
\`\`\`js
const popupUrl = \`https://automatas.tech/conectar?token=\${encodeURIComponent(LOGIN_JWT)}&channel=whatsapp\`;
window.open(popupUrl, 'automatas_connect', 'width=540,height=740,scrollbars=yes');
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://automatas.tech') return;
  if (event.data?.type === 'AUTOMATAS_HUB_CONNECTED') {
    console.log('Conectado:', event.data.payload);
  }
});
\`\`\`

### 3.2 Enviar Mensagem de Texto — \`POST /api/hub/messages/send\`
\`\`\`json
{
  "to": "5511999999999",
  "text": "Olá! Mensagem enviada via Automatas.",
  "replyToMessageId": "wamid.opcional",
  "phoneNumberId": "opcional_se_tiver_1_numero"
}
\`\`\`

### 3.3 Enviar Mídia — \`POST /api/hub/messages/media\` (ou \`/messages/send\`)
- **Tipos (\`type\`):** \`image\` | \`video\` | \`audio\` | \`document\` | \`sticker\`
- **Regra de tamanho:**
  - **Até 5 MB:** pode enviar direto via \`mediaBase64\` + \`mimeType\` (ou fazer upload antes em \`POST /api/hub/media/upload\` para obter \`mediaId\`).
  - **Acima de 5 MB:** retorna HTTP \`413\`; hospede o arquivo em servidor/bucket HTTPS próprio e envie apenas o link em \`mediaUrl\`.
\`\`\`json
// Via Link (sem limite local):
{
  "to": "5511999999999",
  "type": "image",
  "mediaUrl": "https://seu-dominio.com/imagem.jpg",
  "caption": "Legenda opcional"
}

// Via Upload Direto Base64 (máx. 5 MB):
{
  "to": "5511999999999",
  "type": "document",
  "mediaBase64": "JVBERi0xLjQKJ...",
  "mimeType": "application/pdf",
  "filename": "contrato.pdf",
  "caption": "Segue o PDF."
}
\`\`\`

### 3.4 Upload Reutilizável (até 5 MB) — \`POST /api/hub/media/upload\`
\`\`\`json
{
  "mediaBase64": "JVBERi0xLjQKJ...",
  "mimeType": "application/pdf",
  "filename": "catalogo.pdf"
}
\`\`\`
Retorno: \`{ "success": true, "mediaId": "1234567890", "sizeBytes": 245120, "maxBytes": 5242880 }\`.

### 3.5 Template, Leitura e Download de Mídia
- **Enviar Template:** \`POST /api/hub/messages/template\` -> \`{ "to": "5511999999999", "templateName": "hello_world", "languageCode": "pt_BR", "components": [] }\`
- **Marcar como lida:** \`POST /api/hub/messages/read\` -> \`{ "messageId": "wamid..." }\`
- **Baixar mídia recebida:** \`GET /api/hub/media/:mediaId\` (com header \`x-api-key\`)

## 4. Receber Webhook no Backend (Node.js + Express)
\`\`\`js
import crypto from 'crypto';

app.post('/api/webhook/whatsapp', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-automatas-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.AUTOMATAS_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (sig !== expected) return res.status(401).send('Assinatura inválida');

  const payload = JSON.parse(req.body.toString('utf8'));
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  for (const msg of value?.messages || []) {
    console.log({ from: msg.from, id: msg.id, type: msg.type, text: msg.text?.body });
  }
  for (const st of value?.statuses || []) {
    console.log('Status:', st.id, st.status);
  }
  return res.sendStatus(200);
});
\`\`\`

Implemente os serviços de envio, upload/link de mídia e receptor de webhook na nossa aplicação seguindo exatamente este contrato.`;

const INSTAGRAM_LLM_PROMPT_MD = `# Integração Automatas Bridge API — Instagram API

Você é um agente de desenvolvimento integrando o nosso sistema com a **Automatas Bridge API** (\`automatas.tech\`), que atua como ponte oficial entre a nossa aplicação e a Meta Instagram API.

## 1. Resumo da Arquitetura da Ponte
1. **Login JWT (Conexão / Login Unificado):** Valida o projeto e abre a mini-tela oficial \`https://automatas.tech/conectar?token=SEU_LOGIN_JWT&channel=instagram\` para o cliente final autorizar a conta Instagram Business. Quando conclui, o popup dispara \`window.postMessage\` com \`type: "AUTOMATAS_HUB_CONNECTED"\`.
2. **API Key (\`aut_live_...\`):** Usada no backend da nossa aplicação no header \`x-api-key: aut_live_SUA_API_KEY\` para enviar DMs, responder comentários, publicar Reels e consultar Insights.
3. **Webhook + HMAC-SHA256:** Toda DM, comentário ou menção recebida é enviada via \`POST\` para a \`instagramWebhookUrl\` configurada no projeto com o header \`X-Automatas-Signature: sha256=HMAC_HEX\` (assinado com o \`AUTOMATAS_WEBHOOK_SECRET\` do projeto) e \`X-Automatas-Channel: instagram\`.

## 2. Base URL e Autenticação
- **Base URL:** \`https://api.automatas.tech/api/hub\`
- **Headers obrigatórios:**
  - \`Content-Type: application/json\`
  - \`x-api-key: aut_live_SUA_API_KEY\`

## 3. Endpoints Instagram

### 3.1 Conectar Conta Instagram (Frontend Popup)
\`\`\`js
const popupUrl = \`https://automatas.tech/conectar?token=\${encodeURIComponent(LOGIN_JWT)}&channel=instagram\`;
window.open(popupUrl, 'automatas_connect_ig', 'width=540,height=740,scrollbars=yes');
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://automatas.tech') return;
  if (event.data?.type === 'AUTOMATAS_HUB_CONNECTED') {
    console.log('Instagram conectado:', event.data.payload);
  }
});
\`\`\`

### 3.2 Enviar Direct (DM) ou Private Reply — \`POST /api/hub/instagram/dm\`
\`\`\`json
{
  "recipientId": "IGSID_DO_USUARIO",
  "text": "Olá! Obrigado pelo contato no Instagram.",
  "igUserId": "opcional_se_tiver_1_conta"
}
\`\`\`
*(Para responder um comentário no privado via Private Reply, envie \`"commentId": "ID_DO_COMENTARIO"\` no lugar de \`recipientId\`.)*

### 3.3 Responder Comentário — \`POST /api/hub/instagram/comments/reply\`
\`\`\`json
{
  "commentId": "ID_DO_COMENTARIO",
  "message": "Oi! Te enviamos uma mensagem no Direct."
}
\`\`\`

### 3.4 Publicar Reel — \`POST /api/hub/instagram/reels/publish\`
\`\`\`json
{
  "videoUrl": "https://seu-dominio.com/reel-vertical.mp4",
  "caption": "Novo vídeo publicado via Automatas Hub!",
  "igUserId": "opcional_se_tiver_1_conta"
}
\`\`\`

### 3.5 Consultar Insights — \`GET /api/hub/instagram/insights\`
Header obrigatório: \`x-api-key: aut_live_SUA_API_KEY\` (opcional: \`?igUserId=...\`).

## 4. Receber Webhook no Backend (Node.js + Express)
\`\`\`js
import crypto from 'crypto';

app.post('/api/webhook/instagram', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-automatas-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.AUTOMATAS_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (sig !== expected) return res.status(401).send('Assinatura inválida');

  const payload = JSON.parse(req.body.toString('utf8'));
  for (const entry of payload?.entry || []) {
    for (const msgEvent of entry.messaging || []) {
      console.log('DM de:', msgEvent.sender?.id, 'Texto:', msgEvent.message?.text);
    }
    for (const change of entry.changes || []) {
      console.log('Evento IG:', change.field, change.value);
    }
  }
  return res.sendStatus(200);
});
\`\`\`

Implemente os serviços do Instagram e o receptor de webhook na nossa aplicação seguindo exatamente este contrato.`;

function CodeBlock({
  id,
  title,
  code,
  copiedId,
  onCopy,
}: {
  id: string;
  title: string;
  code: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/50">
        <span className="text-[11px] font-semibold text-slate-300 font-mono">{title}</span>
        <button
          type="button"
          onClick={() => onCopy(code, id)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          {copiedId === id ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copiedId === id ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <pre className="p-4 text-[11px] text-slate-200 font-mono overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export default function GuiaImplementacaoPage() {
  const [channel, setChannel] = useState<'whatsapp' | 'instagram'>('whatsapp');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-900 py-4 px-6 md:px-10 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/app" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <span>
              automatas<span className="text-blue-500">.tech</span>
            </span>
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-semibold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Guia de Implementação Bridge API
          </span>
        </div>

        <Link
          href="/app"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para o Painel</span>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Intro + Arquitetura da Ponte */}
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Como integrar seu sistema com a Automatas
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              A Automatas funciona como uma ponte segura entre o sistema do cliente e as APIs oficiais da Meta (WhatsApp Cloud API e Instagram API).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                1. Token JWT (Conexão / Embedded Signup)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Valida que o projeto existe e permite abrir a mini-tela oficial de{' '}
                <strong className="text-slate-200">Embedded Signup</strong> (<code className="text-blue-300">/conectar</code>) para o cliente conectar seu número WhatsApp ou conta Instagram.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <KeyRound className="w-4 h-4" />
                2. API Key (Enviar Mensagens)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Usada pelo backend do cliente no header{' '}
                <code className="text-emerald-300">x-api-key: aut_live_...</code> para enviar mensagens de texto, mídias, templates e ações no Instagram.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Webhook className="w-4 h-4" />
                3. Webhook (Receber Eventos)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sempre que chegar uma mensagem, status ou comentário da Meta, a Automatas envia um{' '}
                <code className="text-amber-300">POST</code> assinado com{' '}
                <code className="text-amber-300">X-Automatas-Signature</code> para a URL configurada no projeto.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Base URL da API: </span>
              <code className="text-blue-300 font-mono font-semibold">
                https://api.automatas.tech/api/hub
              </code>
            </div>
            <div>
              <span className="text-slate-400">Header de Autenticação: </span>
              <code className="text-emerald-300 font-mono font-semibold">
                x-api-key: aut_live_SUA_API_KEY
              </code>
            </div>
          </div>
        </section>

        {/* Resumo para LLM / Agente de IA (.md) */}
        <section className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Resumo para LLM / Agente de IA (.md)
            </div>
            <p className="text-xs text-slate-300">
              Copie um prompt em Markdown com o resumo da arquitetura (Token, API Key, Webhook) e todos os endpoints prontos para colar no seu agente de IA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => copyText(WHATSAPP_LLM_PROMPT_MD, 'llm_whatsapp_md')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedId === 'llm_whatsapp_md' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>
                {copiedId === 'llm_whatsapp_md'
                  ? 'Markdown WhatsApp Copiado!'
                  : 'Copiar Resumo LLM — WhatsApp (.md)'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => copyText(INSTAGRAM_LLM_PROMPT_MD, 'llm_instagram_md')}
              className="px-3.5 py-2 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/40 text-xs font-semibold text-fuchsia-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedId === 'llm_instagram_md' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>
                {copiedId === 'llm_instagram_md'
                  ? 'Markdown Instagram Copiado!'
                  : 'Copiar Resumo LLM — Instagram (.md)'}
              </span>
            </button>
          </div>
        </section>

        {/* Seletor WhatsApp / Instagram */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              channel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Guia WhatsApp Cloud API</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel('instagram')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              channel === 'instagram'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>Guia Instagram API</span>
          </button>
        </div>

        {/* ===================== WHATSAPP ===================== */}
        {channel === 'whatsapp' && (
          <div className="space-y-6">
            {/* Step 1: Config + Embedded Signup */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <ExternalLink className="w-4 h-4" />
                Passo 1 — Conectar o Número WhatsApp (Token JWT + Embedded Signup)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Na aba <strong>Projetos</strong>, copie o <strong>Login JWT</strong> do projeto e abra a mini-tela popup no seu sistema. Quando o cliente concluir o Embedded Signup da Meta, o popup envia um evento <code className="text-blue-300">postMessage</code> com o <code className="text-emerald-300">phoneNumberId</code> conectado.
              </p>
              <CodeBlock
                id="wa_popup"
                title="JS — Abrir Popup Embedded Signup WhatsApp e capturar retorno"
                copiedId={copiedId}
                onCopy={copyText}
                code={`const loginJwt = 'SEU_LOGIN_JWT_DO_PROJETO';
const popupUrl = \`https://automatas.tech/conectar?token=\${encodeURIComponent(loginJwt)}&channel=whatsapp\`;

window.open(popupUrl, 'automatas_connect', 'width=540,height=740,scrollbars=yes');

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://automatas.tech') return;
  if (event.data?.type === 'AUTOMATAS_HUB_CONNECTED') {
    console.log('WhatsApp conectado com sucesso!', event.data.payload);
    // payload.accounts contém phoneNumberId, wabaId e displayPhoneNumber
  }
});`}
              />
            </section>

            {/* Step 2: Enviar Texto */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                Passo 2 — Enviar Mensagem de Texto (POST /api/hub/messages/send)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-white">Campos obrigatórios:</strong>
                  <ul className="mt-1 space-y-1 text-slate-400">
                    <li>• <code className="text-emerald-300">to</code>: número com DDI + DDD (ex: <code className="text-slate-200">5511999999999</code>)</li>
                    <li>• <code className="text-emerald-300">text</code>: texto da mensagem</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-white">Campos opcionais:</strong>
                  <ul className="mt-1 space-y-1 text-slate-400">
                    <li>• <code className="text-blue-300">replyToMessageId</code>: <code className="text-slate-200">wamid...</code> para responder mensagem</li>
                    <li>• <code className="text-blue-300">phoneNumberId</code>: obrigatório apenas se tiver +1 número no projeto</li>
                  </ul>
                </div>
              </div>
              <CodeBlock
                id="wa_send_text"
                title="cURL — Enviar Texto WhatsApp"
                copiedId={copiedId}
                onCopy={copyText}
                code={`curl -X POST https://api.automatas.tech/api/hub/messages/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: aut_live_SUA_API_KEY" \\
  -d '{
    "to": "5511999999999",
    "text": "Olá! Esta é uma mensagem enviada pela ponte Automatas."
  }'`}
              />
            </section>

            {/* Step 3: Enviar Mídia */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                Passo 3 — Enviar Mídia: Imagem, Vídeo, Áudio, Documento ou Sticker (POST /api/hub/messages/media)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você pode enviar para <code className="text-blue-300">POST /api/hub/messages/media</code> (ou direto para <code className="text-blue-300">/messages/send</code> informando <code className="text-blue-300">type</code>). Tipos aceitos: <code className="text-emerald-300">image</code>, <code className="text-emerald-300">video</code>, <code className="text-emerald-300">audio</code>, <code className="text-emerald-300">document</code>, <code className="text-emerald-300">sticker</code>.
              </p>
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>Regra de Tamanho e Upload Direto:</strong> Você pode enviar o arquivo em si usando{' '}
                <code className="text-amber-300">mediaBase64</code> + <code className="text-amber-300">mimeType</code>{' '}
                (ou subir antes em <code className="text-amber-300">POST /api/hub/media/upload</code> para reutilizar o{' '}
                <code className="text-amber-300">mediaId</code>) até o limite máximo de <strong>5 MB</strong> por arquivo.{' '}
                <strong>Acima de 5 MB</strong>, hospede o arquivo em seu próprio servidor/bucket (S3, R2, etc.) e envie apenas o link HTTPS em{' '}
                <code className="text-emerald-300">mediaUrl</code>.
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeBlock
                  id="wa_media_img"
                  title="JSON — Enviar via Link (mediaUrl, sem limite local)"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`{
  "to": "5511999999999",
  "type": "image",
  "mediaUrl": "https://seu-dominio.com/banner.jpg",
  "caption": "Confira a novidade!"
}`}
                />
                <CodeBlock
                  id="wa_media_base64"
                  title="JSON — Upload Direto em Base64 (máx. 5 MB)"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`{
  "to": "5511999999999",
  "type": "document",
  "mediaBase64": "JVBERi0xLjQKJ...",
  "mimeType": "application/pdf",
  "filename": "fatura-novembro.pdf",
  "caption": "Segue sua fatura em PDF."
}`}
                />
              </div>
              <CodeBlock
                id="wa_media_upload_only"
                title="Opcional — Subir mídia para obter mediaId reutilizável (POST /api/hub/media/upload, máx. 5 MB)"
                copiedId={copiedId}
                onCopy={copyText}
                code={`curl -X POST https://api.automatas.tech/api/hub/media/upload \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: aut_live_SUA_API_KEY" \\
  -d '{
    "mediaBase64": "JVBERi0xLjQKJ...",
    "mimeType": "application/pdf",
    "filename": "catalogo.pdf"
  }'
// Retorno: { "success": true, "mediaId": "1234567890", "sizeBytes": 245120, "maxBytes": 5242880 }`}
              />
            </section>

            {/* Step 4: Template, Read & Download Media */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                Passo 4 — Templates, Confirmação de Leitura e Download de Mídia Recebida
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeBlock
                  id="wa_template"
                  title="POST /api/hub/messages/template"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`{
  "to": "5511999999999",
  "templateName": "hello_world",
  "languageCode": "pt_BR",
  "components": []
}`}
                />
                <CodeBlock
                  id="wa_read_dl"
                  title="Marcar Lida & Baixar Mídia"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`// 1) Marcar mensagem como lida:
POST /api/hub/messages/read
{ "messageId": "wamid.HBgM..." }

// 2) Baixar áudio/imagem/documento recebido no webhook:
GET /api/hub/media/MEDIA_ID_RECEBIDO
Header: x-api-key: aut_live_SUA_API_KEY`}
                />
              </div>
            </section>

            {/* Step 5: Webhook WhatsApp */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Webhook className="w-4 h-4" />
                Passo 5 — Receber Mensagens e Status no seu Webhook WhatsApp
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cadastre a URL do seu sistema no campo <strong>Webhook WhatsApp Destino</strong> do projeto. A Automatas encaminha o payload oficial da Meta via <code className="text-amber-300">POST</code> com assinatura HMAC-SHA256 em <code className="text-amber-300">X-Automatas-Signature</code> e <code className="text-amber-300">X-Automatas-Channel: whatsapp</code>.
              </p>
              <CodeBlock
                id="wa_webhook_node"
                title="Node.js / Express — Validar assinatura e ler mensagem/mídia recebida"
                copiedId={copiedId}
                onCopy={copyText}
                code={`import crypto from 'crypto';
import express from 'express';

const app = express();

app.post('/api/webhook/whatsapp', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-automatas-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.AUTOMATAS_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (sig !== expected) {
    return res.status(401).send('Assinatura inválida');
  }

  const payload = JSON.parse(req.body.toString('utf8'));
  const value = payload?.entry?.[0]?.changes?.[0]?.value;

  // 1. Mensagens recebidas do cliente final
  for (const msg of value?.messages || []) {
    console.log({
      from: msg.from,
      id: msg.id,
      type: msg.type, // text, image, audio, video, document...
      text: msg.text?.body,
      mediaId: msg.image?.id || msg.audio?.id || msg.document?.id,
    });
  }

  // 2. Status de envio (sent, delivered, read, failed)
  for (const st of value?.statuses || []) {
    console.log('Status:', st.id, st.status);
  }

  return res.sendStatus(200);
});`}
              />
            </section>
          </div>
        )}

        {/* ===================== INSTAGRAM ===================== */}
        {channel === 'instagram' && (
          <div className="space-y-6">
            {/* Step 1: Onboarding Instagram */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-fuchsia-300 font-bold text-sm">
                <ExternalLink className="w-4 h-4" />
                Passo 1 — Conectar Conta Instagram Business (Token JWT + Login Unificado)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abra a mini-tela popup com <code className="text-fuchsia-300">channel=instagram</code> e o <strong>Login JWT</strong> do projeto. Após o usuário autorizar no Instagram/Facebook, o <code className="text-fuchsia-300">igUserId</code> fica vinculado ao projeto.
              </p>
              <CodeBlock
                id="ig_popup"
                title="JS — Abrir Popup de Conexão Instagram"
                copiedId={copiedId}
                onCopy={copyText}
                code={`const loginJwt = 'SEU_LOGIN_JWT_DO_PROJETO';
const popupUrl = \`https://automatas.tech/conectar?token=\${encodeURIComponent(loginJwt)}&channel=instagram\`;

window.open(popupUrl, 'automatas_connect_ig', 'width=540,height=740,scrollbars=yes');

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://automatas.tech') return;
  if (event.data?.type === 'AUTOMATAS_HUB_CONNECTED') {
    console.log('Instagram conectado!', event.data.payload);
  }
});`}
              />
            </section>

            {/* Step 2: DM & Comentários */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-fuchsia-300 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                Passo 2 — Enviar DM e Responder Comentários
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeBlock
                  id="ig_dm"
                  title="POST /api/hub/instagram/dm (Direct ou Private Reply)"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`curl -X POST https://api.automatas.tech/api/hub/instagram/dm \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: aut_live_SUA_API_KEY" \\
  -d '{
    "recipientId": "IGSID_DO_USUARIO",
    "text": "Olá! Obrigado pelo contato no Instagram."
  }'
// Dica: para responder um comentário no privado, troque "recipientId" por "commentId".`}
                />
                <CodeBlock
                  id="ig_comment"
                  title="POST /api/hub/instagram/comments/reply"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`curl -X POST https://api.automatas.tech/api/hub/instagram/comments/reply \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: aut_live_SUA_API_KEY" \\
  -d '{
    "commentId": "ID_DO_COMENTARIO",
    "message": "Oi! Te enviamos uma mensagem no Direct."
  }'`}
                />
              </div>
            </section>

            {/* Step 3: Reels & Insights */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                Passo 3 — Publicar Reel e Consultar Insights
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeBlock
                  id="ig_reel"
                  title="POST /api/hub/instagram/reels/publish"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`{
  "videoUrl": "https://seu-dominio.com/reel-vertical.mp4",
  "caption": "Novo vídeo publicado via Automatas Hub!",
  "igUserId": "opcional_se_tiver_1_conta"
}`}
                />
                <CodeBlock
                  id="ig_insights"
                  title="GET /api/hub/instagram/insights"
                  copiedId={copiedId}
                  onCopy={copyText}
                  code={`curl -X GET "https://api.automatas.tech/api/hub/instagram/insights" \\
  -H "x-api-key: aut_live_SUA_API_KEY"`}
                />
              </div>
            </section>

            {/* Step 4: Webhook Instagram */}
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Webhook className="w-4 h-4" />
                Passo 4 — Receber DMs, Comentários e Menções no Webhook Instagram
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cadastre a URL no campo <strong>Webhook Instagram Destino</strong> do projeto. Os eventos chegam via <code className="text-amber-300">POST</code> com <code className="text-amber-300">X-Automatas-Channel: instagram</code> e assinatura <code className="text-amber-300">X-Automatas-Signature</code>.
              </p>
              <CodeBlock
                id="ig_webhook_node"
                title="Node.js / Express — Processar Webhook do Instagram"
                copiedId={copiedId}
                onCopy={copyText}
                code={`app.post('/api/webhook/instagram', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-automatas-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.AUTOMATAS_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (sig !== expected) return res.status(401).send('Assinatura inválida');

  const payload = JSON.parse(req.body.toString('utf8'));
  for (const entry of payload?.entry || []) {
    // 1. Mensagens Direct (DM)
    for (const msgEvent of entry.messaging || []) {
      console.log('DM de:', msgEvent.sender?.id, 'Texto:', msgEvent.message?.text);
    }
    // 2. Comentários e Menções
    for (const change of entry.changes || []) {
      console.log('Evento IG:', change.field, change.value);
    }
  }
  return res.sendStatus(200);
});`}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
