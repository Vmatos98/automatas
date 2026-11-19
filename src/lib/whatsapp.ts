// WhatsApp Cloud API & In-Memory Message Store for automatas.tech

export interface WhatsAppMessageItem {
  id: string;
  from: string;
  to?: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  status: 'received' | 'sent' | 'delivered' | 'read' | 'failed';
  senderName?: string;
  phoneNumberId?: string;
}

import { db } from './db';

export const messagesStore = {
  getAll: (phoneNumberId?: string): WhatsAppMessageItem[] => {
    try {
      const cleanId = phoneNumberId && phoneNumberId !== 'all' ? phoneNumberId.trim() : '';
      const defaultEnvId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID || '';
      let rows: any[] = [];

      if (cleanId) {
        if (defaultEnvId && cleanId === defaultEnvId) {
          rows = db
            .prepare(
              'SELECT * FROM whatsapp_messages WHERE phone_number_id = ? OR phone_number_id IS NULL ORDER BY timestamp DESC LIMIT 250'
            )
            .all(cleanId) as any[];
        } else {
          rows = db
            .prepare(
              'SELECT * FROM whatsapp_messages WHERE phone_number_id = ? ORDER BY timestamp DESC LIMIT 250'
            )
            .all(cleanId) as any[];
        }
      } else {
        rows = db
          .prepare('SELECT * FROM whatsapp_messages ORDER BY timestamp DESC LIMIT 250')
          .all() as any[];
      }

      return rows.map((r) => ({
        id: r.id,
        from: r.from_phone,
        to: r.to_phone || undefined,
        direction: r.direction as any,
        text: r.text,
        timestamp: r.timestamp,
        status: r.status as any,
        senderName: r.sender_name || undefined,
        phoneNumberId: r.phone_number_id || undefined,
      }));
    } catch (e) {
      console.warn('Falha ao ler mensagens do SQLite:', e);
      return [];
    }
  },
  add: (message: WhatsAppMessageItem) => {
    try {
      db.prepare(`
        INSERT INTO whatsapp_messages (id, from_phone, to_phone, direction, text, status, sender_name, phone_number_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          phone_number_id = COALESCE(excluded.phone_number_id, whatsapp_messages.phone_number_id)
      `).run(
        message.id,
        message.from,
        message.to || null,
        message.direction,
        message.text,
        message.status,
        message.senderName || null,
        message.phoneNumberId || null,
        message.timestamp || new Date().toISOString()
      );
    } catch (e) {
      console.warn('Erro ao salvar mensagem no SQLite:', e);
    }
  },
  updateStatus: (id: string, status: WhatsAppMessageItem['status']) => {
    try {
      db.prepare('UPDATE whatsapp_messages SET status = ? WHERE id = ?').run(status, id);
    } catch (e) {
      console.warn('Erro ao atualizar status da mensagem no SQLite:', e);
    }
  },
};

export const getMetaConfig = () => {
  return {
    verifyToken: process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'automatas_meta_verify_2026',
    accessToken: process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID || '',
    apiVersion: process.env.META_API_VERSION || 'v24.0',
    appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
    configId: process.env.NEXT_PUBLIC_META_CONFIG_ID || '',
  };
};

export interface SendMessageOptions {
  to: string;
  text: string;
  replyToMessageId?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

/**
 * Envia mensagem de texto via WhatsApp Cloud API
 * Endpoint: POST https://graph.facebook.com/{API_VERSION}/{PHONE_ID}/messages
 */
export async function sendWhatsAppTextMessage({
  to,
  text,
  replyToMessageId,
  phoneNumberId: requestedPhoneNumberId,
  accessToken: overrideToken,
}: SendMessageOptions) {
  const { accessToken: envToken, phoneNumberId: envPhoneId, apiVersion } = getMetaConfig();
  const phoneNumberId = requestedPhoneNumberId?.trim() || envPhoneId;
  let accessToken = overrideToken?.trim() || '';

  if (!accessToken && phoneNumberId) {
    try {
      const row = db
        .prepare('SELECT access_token FROM whatsapp_accounts WHERE phone_number_id = ? LIMIT 1')
        .get(phoneNumberId) as { access_token?: string | null } | undefined;
      if (row?.access_token) accessToken = row.access_token;
    } catch {
      // ignora
    }
  }
  if (!accessToken) accessToken = envToken;

  // Se as chaves não estiverem configuradas, simular com log informativo
  if (!accessToken || !phoneNumberId) {
    console.warn(
      `[WhatsApp Cloud API] Variáveis META_ACCESS_TOKEN ou META_PHONE_NUMBER_ID não configuradas no .env.local. Simulando envio para ${to}: "${text}"`
    );

    const simulatedId = `sim_${Date.now()}`;
    messagesStore.add({
      id: simulatedId,
      to,
      from: 'automatas.tech Bot',
      direction: 'outbound',
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      phoneNumberId: phoneNumberId || undefined,
    });

    return {
      success: true,
      simulated: true,
      messages: [{ id: simulatedId }],
    };
  }

  const cleanPhone = to.replace(/\D/g, '');
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: {
      preview_url: true,
      body: text,
    },
  };

  if (replyToMessageId) {
    payload.context = {
      message_id: replyToMessageId,
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Cloud API] Erro ao enviar mensagem:', data);
      throw new Error(data.error?.message || 'Erro ao enviar mensagem via WhatsApp Graph API');
    }

    const messageId = data.messages?.[0]?.id || `out_${Date.now()}`;

    // Registrar no histórico de mensagens
    messagesStore.add({
      id: messageId,
      to: cleanPhone,
      from: 'automatas.tech Bot',
      direction: 'outbound',
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      phoneNumberId,
    });

    return {
      success: true,
      simulated: false,
      data,
    };
  } catch (error) {
    console.error('[WhatsApp Cloud API] Falha na requisição de envio:', error);
    throw error;
  }
}
