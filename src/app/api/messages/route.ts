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

export async function GET() {
  const config = getMetaConfig();

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
    totalMessages: messages.length,
    messages,
    contacts,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text, isSimulatedInbound } = body;

    if (!text) {
      return NextResponse.json({ error: 'Texto da mensagem é obrigatório.' }, { status: 400 });
    }

    if (!to && !isSimulatedInbound) {
      return NextResponse.json({ error: 'Número de destino "to" é obrigatório.' }, { status: 400 });
    }

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
    const cleanPhone = String(to || '').replace(/\D/g, '');

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

