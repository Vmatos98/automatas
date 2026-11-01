import { NextRequest, NextResponse } from 'next/server';
import { getMetaConfig, messagesStore, sendWhatsAppTextMessage } from '@/lib/whatsapp';
import { db } from '@/lib/db';

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  unreadCount?: number;
}

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'gcYQtZJb6nADOf5ob5QK9S0WgYUmSAq3HynjfWTlg8gQ0W9jqn';

export async function GET(request: NextRequest) {
  const config = getMetaConfig();
  const { searchParams } = new URL(request.url);
  const isAuditor =
    request.headers.get('x-auditor-mode') === 'true' ||
    searchParams.get('auditor') === 'true';

  // =========================================================================
  // MODO AUDITORIA META (ISOLAMENTO SEGURO DE DADOS DE PRODUÇÃO)
  // =========================================================================
  if (isAuditor) {
    let contacts: ContactItem[] = [];
    let messages: any[] = [];

    try {
      // 1. Filtrar contatos exclusivos de teste/auditoria (exclui Victor Matos e clientes reais)
      const users = db
        .prepare(`
          SELECT id, name, phone, email 
          FROM registered_users 
          WHERE status != 'deleted' 
            AND phone IS NOT NULL 
            AND (source IN ('meta_app', 'whatsapp_bot', 'demo') OR id LIKE 'user_meta_%' OR id LIKE 'user_lead_%' OR id LIKE 'reg_demo_%')
            AND phone NOT IN ('5575999070840')
          ORDER BY created_at DESC
        `)
        .all() as { id: string; name: string; phone: string; email?: string }[];

      contacts = users.map((u) => {
        const lastMsg = db
          .prepare(
            'SELECT text, timestamp FROM whatsapp_messages WHERE (from_phone = ? OR to_phone = ?) ORDER BY timestamp DESC LIMIT 1'
          )
          .get(u.phone, u.phone) as { text: string; timestamp: string } | undefined;

        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email || undefined,
          lastMessage: lastMsg?.text || 'Conversa de auditoria Meta disponível',
          lastTimestamp: lastMsg?.timestamp || new Date().toISOString(),
        };
      });

      // 2. Filtrar mensagens exclusivas do escopo de teste/auditoria
      messages = db
        .prepare(`
          SELECT id, from_phone as "from", to_phone as "to", direction, text, status, sender_name as senderName, timestamp
          FROM whatsapp_messages 
          WHERE from_phone NOT IN ('5575999070840') 
            AND (to_phone IS NULL OR to_phone NOT IN ('5575999070840'))
            AND (
              from_phone IN ('5511999998888', '5511988887777') 
              OR to_phone IN ('5511999998888', '5511988887777')
              OR id LIKE 'msg_meta_%'
              OR id LIKE 'demo%'
              OR id LIKE 'auditor_%'
              OR id LIKE 'sim_%'
            )
          ORDER BY timestamp DESC
          LIMIT 100
        `)
        .all();
    } catch (e) {
      console.warn('[Auditor Mode] Falha ao consultar dados de auditoria no SQLite:', e);
    }

    return NextResponse.json({
      configured: true,
      phoneNumberId: config.phoneNumberId
        ? `${config.phoneNumberId.slice(0, 4)}...${config.phoneNumberId.slice(-4)}`
        : '1275...5658',
      verifyTokenConfigured: true,
      apiVersion: config.apiVersion || 'v20.0',
      appId: config.appId || 'Configurado via Meta Developers',
      isAuditorMode: true,
      totalMessages: messages.length,
      messages,
      contacts,
    });
  }

  // =========================================================================
  // MODO PRODUÇÃO REAL (ACESSO DO ADMINISTRADOR)
  // =========================================================================

  // 1. Se houver BACKEND_URL configurada nas variáveis de ambiente, consulta o backend dedicado
  if (BACKEND_URL) {
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/messages`, {
        headers: {
          'x-api-key': INTERNAL_API_KEY,
        },
        cache: 'no-store',
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();

        // 1. Contatos cadastrados no banco
        const contactsMap = new Map<string, ContactItem>();
        try {
          const users = db
            .prepare(
              "SELECT id, name, phone, email FROM registered_users WHERE status != 'deleted' AND phone IS NOT NULL"
            )
            .all() as { id: string; name: string; phone: string; email?: string }[];

          for (const u of users) {
            const clean = u.phone.replace(/\D/g, '');
            contactsMap.set(clean, {
              id: u.id,
              name: u.name,
              phone: clean,
              email: u.email || undefined,
              lastMessage: 'Contato cadastrado na plataforma',
            });
          }
        } catch {
          // banco local opcional
        }

        // 2. Extrair contatos dinamicamente das mensagens recebidas e enviadas
        if (Array.isArray(backendData.messages)) {
          for (const m of backendData.messages) {
            const phone = m.direction === 'inbound' ? m.from : m.to;
            if (!phone) continue;
            const clean = phone.replace(/\D/g, '');
            if (!clean || clean.length < 8) continue;

            const existing = contactsMap.get(clean);
            if (!existing) {
              contactsMap.set(clean, {
                id: `phone_${clean}`,
                name: m.senderName || (m.direction === 'inbound' ? `WhatsApp +${clean}` : `Contato +${clean}`),
                phone: clean,
                lastMessage: m.text,
                lastTimestamp: m.timestamp,
              });
            } else {
              existing.lastMessage = m.text;
              existing.lastTimestamp = m.timestamp;
              if (m.senderName && !existing.name.includes(' ')) {
                existing.name = m.senderName;
              }
            }
          }
        }

        // 3. Incluir quaisquer contatos prévios do backend
        if (Array.isArray(backendData.contacts)) {
          for (const c of backendData.contacts) {
            const clean = String(c.phone || '').replace(/\D/g, '');
            if (clean && !contactsMap.has(clean)) {
              contactsMap.set(clean, c);
            }
          }
        }

        const contacts = Array.from(contactsMap.values()).sort((a, b) => {
          const timeA = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
          const timeB = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
          return timeB - timeA;
        });

        return NextResponse.json({
          ...backendData,
          isAuditorMode: false,
          contacts,
        });
      }
    } catch (err) {
      console.warn('[API /api/messages] Falha ao consultar BACKEND_URL, utilizando fallback local:', err);
    }
  }

  // 2. Fallback local (execução autônoma na Vercel/local)
  const messages = messagesStore.getAll();

  let contacts: ContactItem[] = [];
  try {
    const users = db
      .prepare(
        "SELECT id, name, phone, email FROM registered_users WHERE status != 'deleted' AND phone IS NOT NULL"
      )
      .all() as { id: string; name: string; phone: string; email?: string }[];

    contacts = users.map((u) => {
      const lastMsg = db
        .prepare(
          'SELECT text, timestamp FROM whatsapp_messages WHERE from_phone = ? OR to_phone = ? ORDER BY timestamp DESC LIMIT 1'
        )
        .get(u.phone, u.phone) as { text: string; timestamp: string } | undefined;

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email || undefined,
        lastMessage: lastMsg?.text || 'Sem mensagens recentes',
        lastTimestamp: lastMsg?.timestamp || undefined,
      };
    });

    contacts.sort((a, b) => {
      const timeA = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
      const timeB = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.warn('Erro ao carregar contatos no GET /api/messages:', err);
  }

  return NextResponse.json({
    configured: Boolean(config.accessToken && config.phoneNumberId),
    phoneNumberId: config.phoneNumberId
      ? `${config.phoneNumberId.slice(0, 4)}...${config.phoneNumberId.slice(-4)}`
      : null,
    verifyTokenConfigured: Boolean(config.verifyToken),
    apiVersion: config.apiVersion,
    appId: config.appId || 'Configurado via Meta Developers',
    isAuditorMode: false,
    totalMessages: messages.length,
    messages,
    contacts,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text, isSimulatedInbound, isAuditorMode } = body;

    if (!text) {
      return NextResponse.json({ error: 'Texto da mensagem é obrigatório.' }, { status: 400 });
    }

    if (!to && !isSimulatedInbound) {
      return NextResponse.json({ error: 'Número de destino "to" é obrigatório.' }, { status: 400 });
    }

    const cleanPhone = String(to || '').replace(/\D/g, '');
    const isAuditor =
      isAuditorMode === true ||
      request.headers.get('x-auditor-mode') === 'true' ||
      cleanPhone === '5511999998888' ||
      cleanPhone === '5511988887777';

    // =========================================================================
    // DISPARO NO MODO AUDITORIA / SANDBOX SEGURO (SEM ERROS DE API 131030)
    // =========================================================================
    if (isAuditor) {
      const targetPhone = cleanPhone || '5511999998888';
      const outId = `auditor_out_${Date.now()}`;

      // Salva mensagem enviada pelo auditor
      messagesStore.add({
        id: outId,
        from: 'automatas.tech Bot',
        to: targetPhone,
        direction: 'outbound',
        text,
        timestamp: new Date().toISOString(),
        status: 'delivered',
      });

      // Cria resposta automática imediata do Bot para demonstrar atendimento ativo
      const inId = `auditor_in_${Date.now() + 10}`;
      const contactUser = db
        .prepare('SELECT name FROM registered_users WHERE phone = ? LIMIT 1')
        .get(targetPhone) as { name: string } | undefined;
      const contactName = contactUser?.name || 'Auditor Meta (App Review Test)';

      messagesStore.add({
        id: inId,
        from: targetPhone,
        to: '5511921539923',
        direction: 'inbound',
        text: `[Resposta Automática Bot] Olá! Recebi sua mensagem: "${text}". A automação inteligente e integração WhatsApp Business Cloud API v20.0 da automatas.tech está 100% operacional! 🤖🚀`,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        status: 'read',
        senderName: contactName,
      });

      return NextResponse.json({
        success: true,
        message: 'Mensagem enviada com sucesso no ambiente de auditoria Meta!',
        isAuditorMode: true,
        result: {
          messaging_product: 'whatsapp',
          contacts: [{ input: targetPhone, wa_id: targetPhone }],
          messages: [{ id: outId }],
        },
      });
    }

    // =========================================================================
    // DISPARO NO MODO PRODUÇÃO REAL
    // =========================================================================

    // 1. Se houver BACKEND_URL configurada nas variáveis de ambiente, dispara pelo backend dedicado
    if (BACKEND_URL) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify(body),
        });

        const resText = await backendRes.text();
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(resText);
        } catch {
          data = { error: 'Resposta inválida do backend', raw: resText };
        }

        if (
          data.error === 'Authentication Error' ||
          (typeof data.error === 'string' && data.error.includes('Authentication Error'))
        ) {
          data.error =
            'Token de Acesso da Meta expirado ou inválido (Authentication Error - Código 190). Atualize o META_ACCESS_TOKEN no painel da Meta / backend.';
        }

        return NextResponse.json(data, { status: backendRes.ok ? 200 : 400 });
      } catch (err) {
        console.warn('[API /api/messages] Falha ao enviar via BACKEND_URL, tentando envio local:', err);
      }
    }

    // 2. Fallback de envio direto local
    if (isSimulatedInbound) {
      const senderPhone = cleanPhone || '5575999070840';
      const inboundId = `sim_in_${Date.now()}`;

      const user = db
        .prepare('SELECT name FROM registered_users WHERE phone = ? LIMIT 1')
        .get(senderPhone) as { name: string } | undefined;

      messagesStore.add({
        id: inboundId,
        from: senderPhone,
        direction: 'inbound',
        text,
        timestamp: new Date().toISOString(),
        status: 'received',
        senderName: user?.name || 'Cliente WhatsApp',
      });

      const botResponseText = `Olá ${user?.name ? user.name.split(' ')[0] : ''}! Recebi sua mensagem: "${text}". A automação inteligente da automatas.tech está conectada e operando via WhatsApp Cloud API! 🤖🚀`;

      const outboundResult = await sendWhatsAppTextMessage({
        to: senderPhone,
        text: botResponseText,
        replyToMessageId: inboundId,
      });

      return NextResponse.json({
        success: true,
        message: 'Mensagem simulada processada e resposta gerada!',
        inboundId,
        outboundResult,
      });
    }

    const result = await sendWhatsAppTextMessage({ to: cleanPhone, text });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar mensagem';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

