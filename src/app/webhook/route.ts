import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getMetaConfig,
  messagesStore,
  sendWhatsAppTextMessage,
  WhatsAppMessageItem,
} from '@/lib/whatsapp';

const VALID_MESSAGE_STATUSES = new Set<WhatsAppMessageItem['status']>([
  'received',
  'sent',
  'delivered',
  'read',
  'failed',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessageText(message: any): string {
  const type = message?.type;
  if (type === 'text') {
    return message.text?.body || '';
  }
  if (type === 'button') {
    return message.button?.text || '';
  }
  if (type === 'interactive') {
    return (
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      '[Interação interativa]'
    );
  }
  return `[Mensagem tipo: ${type || 'desconhecido'}]`;
}

function parseMetaTimestamp(rawTimestamp: unknown): string {
  if (rawTimestamp === undefined || rawTimestamp === null) {
    return new Date().toISOString();
  }
  const parsed = parseInt(String(rawTimestamp), 10);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }
  return new Date(parsed * 1000).toISOString();
}

function resolveHistoryStatus(
  rawStatus: unknown,
  direction: 'inbound' | 'outbound'
): WhatsAppMessageItem['status'] {
  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.toLowerCase() as WhatsAppMessageItem['status'];
    if (VALID_MESSAGE_STATUSES.has(normalized)) {
      return normalized;
    }
  }
  return direction === 'outbound' ? 'sent' : 'received';
}

/**
 * Validação do Webhook pela Meta (GET /webhook)
 * A Meta envia parâmetros de consulta:
 * - hub.mode: Deve ser 'subscribe'
 * - hub.verify_token: Token de verificação configurado no painel da Meta
 * - hub.challenge: Sequência que deve ser retornada intacta como resposta
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const { verifyToken } = getMetaConfig();

  console.log('[Meta Webhook GET] Requisição de verificação recebida:', {
    mode,
    tokenReceived: token,
    expectedToken: verifyToken,
    challenge,
  });

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Webhook GET] Webhook validado com sucesso pela Meta!');
    return new Response(challenge || '', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  console.warn('[Meta Webhook GET] Falha na validação do webhook: token incorreto ou modo inválido.');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * Recepção de Mensagens e Eventos do WhatsApp (POST /webhook)
 * Suporta eventos padrão (`messages`) e eventos de Coexistência
 * (`smb_message_echoes`, `history`, `smb_app_state_sync`, `account_update`).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Meta Webhook POST] Payload recebido da Meta:');
    console.log(JSON.stringify(body, null, 2));

    // Verificar se é um evento do WhatsApp Business Cloud API
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          const field = change.field as string | undefined;
          const value = change.value;

          if (!value) continue;

          const metadataPhoneNumberId = value.metadata?.phone_number_id
            ? String(value.metadata.phone_number_id)
            : undefined;

          // 1. Ecos de mensagens enviadas pelo WhatsApp Business App (Coexistência)
          if (field === 'smb_message_echoes') {
            const echoes = Array.isArray(value.message_echoes) ? value.message_echoes : [];
            const fallbackBizPhone = String(value.metadata?.display_phone_number || '').replace(/\D/g, '');

            for (const echo of echoes) {
              const fromDigits = String(echo.from || fallbackBizPhone).replace(/\D/g, '');
              const toDigits = String(echo.to || '').replace(/\D/g, '');
              const textContent = extractMessageText(echo);
              const timestamp = parseMetaTimestamp(echo.timestamp);

              messagesStore.add({
                id: echo.id || `echo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                from: fromDigits || 'WhatsApp Business App',
                to: toDigits || undefined,
                direction: 'outbound',
                text: textContent,
                timestamp,
                status: 'sent',
                phoneNumberId: metadataPhoneNumberId,
              });
            }
            continue;
          }

          // 2. Sincronização de histórico de mensagens até 6 meses (Coexistência)
          if (field === 'history') {
            const historyChunks = Array.isArray(value.history) ? value.history : [];
            const businessPhone = String(value.metadata?.display_phone_number || '').replace(/\D/g, '');

            for (const chunk of historyChunks) {
              console.log('[Meta Webhook History Sync]', {
                phase: chunk.metadata?.phase,
                chunk_order: chunk.metadata?.chunk_order,
                progress: chunk.metadata?.progress,
                errors: chunk.errors,
              });

              const threads = Array.isArray(chunk.threads) ? chunk.threads : [];
              for (const thread of threads) {
                const threadPhone = String(thread.id || '').replace(/\D/g, '');
                const threadMessages = Array.isArray(thread.messages) ? thread.messages : [];

                for (const msg of threadMessages) {
                  const msgFrom = String(msg.from || '').replace(/\D/g, '');
                  const direction: 'inbound' | 'outbound' =
                    businessPhone && msgFrom === businessPhone ? 'outbound' : 'inbound';
                  const textContent = extractMessageText(msg);
                  const timestamp = parseMetaTimestamp(msg.timestamp);
                  const status = resolveHistoryStatus(msg.history_context?.status, direction);

                  messagesStore.add({
                    id: msg.id || `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    from:
                      direction === 'outbound'
                        ? msgFrom || businessPhone || 'WhatsApp Business App'
                        : msgFrom || threadPhone || 'Usuário WhatsApp',
                    to:
                      direction === 'outbound'
                        ? String(msg.to || threadPhone || '').replace(/\D/g, '') || undefined
                        : businessPhone || undefined,
                    direction,
                    text: textContent,
                    timestamp,
                    status,
                    phoneNumberId: metadataPhoneNumberId,
                  });
                }
              }
            }
            continue;
          }

          // 3. Sincronização de contatos do WhatsApp Business App (Coexistência)
          if (field === 'smb_app_state_sync') {
            const stateItems = Array.isArray(value.state_sync) ? value.state_sync : [];
            for (const item of stateItems) {
              console.log('[Meta Webhook State Sync]', item);
              if (
                item?.type === 'contact' &&
                item?.contact?.phone_number &&
                item?.action !== 'remove'
              ) {
                const cleanPhone = String(item.contact.phone_number).replace(/\D/g, '');
                if (!cleanPhone) continue;

                const contactName =
                  item.contact.full_name ||
                  item.contact.first_name ||
                  item.contact.username ||
                  `WhatsApp +${cleanPhone}`;
                const now = new Date().toISOString();

                try {
                  db.prepare(`
                    INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
                    VALUES (?, ?, ?, NULL, 'whatsapp_coexistence', 'active', ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      name = COALESCE(NULLIF(excluded.name, ''), registered_users.name),
                      phone = excluded.phone,
                      status = 'active',
                      updated_at = excluded.updated_at
                  `).run(`wa_coex_${cleanPhone}`, contactName, cleanPhone, now, now);
                } catch (dbErr) {
                  console.warn('[Meta Webhook State Sync] Aviso ao salvar contato no SQLite:', dbErr);
                }
              }
            }
            continue;
          }

          // 4. Eventos de ciclo de vida da conta / coexistência
          if (field === 'account_update') {
            console.log('[Meta Webhook Account Update]', value);
            continue;
          }

          // 5. Mensagens e status padrão (`messages` ou payload legado sem `field`)
          if (!field || field === 'messages') {
            // Processar status de mensagens enviadas (delivered, read, failed, sent)
            if (value.statuses && Array.isArray(value.statuses)) {
              for (const statusObj of value.statuses) {
                const msgId = statusObj.id;
                const status = statusObj.status; // 'delivered' | 'read' | 'sent' | 'failed'
                console.log(`[Meta Webhook] Status update para msg ${msgId}: ${status}`);
                messagesStore.updateStatus(msgId, status);
              }
            }

            // Processar mensagens recebidas
            if (value.messages && Array.isArray(value.messages)) {
              const contactName = value.contacts?.[0]?.profile?.name || 'Usuário WhatsApp';

              for (const message of value.messages) {
                const from = message.from; // Número do remetente (ex: 5511999998888)
                const messageId = message.id;
                const timestamp = parseMetaTimestamp(message.timestamp);
                const textContent = extractMessageText(message);

                console.log('==============================================');
                console.log('📱 [WHATSAPP RECEBIDO] Nova mensagem de texto:');
                console.log(`De: ${contactName} (${from})`);
                console.log(`Mensagem: "${textContent}"`);
                console.log(`ID: ${messageId}`);
                console.log(`Horário: ${timestamp}`);
                console.log('==============================================');

                // Salvar no histórico da plataforma
                messagesStore.add({
                  id: messageId,
                  from,
                  direction: 'inbound',
                  text: textContent,
                  timestamp,
                  status: 'received',
                  senderName: contactName,
                  phoneNumberId: metadataPhoneNumberId,
                });

                // Montar resposta automática inteligente
                const lowerText = textContent.toLowerCase().trim();
                let botReplyText = '';

                if (lowerText === 'oi' || lowerText === 'olá' || lowerText === 'ola' || lowerText === 'bom dia' || lowerText === 'boa tarde' || lowerText === 'boa noite') {
                  botReplyText = `Olá, ${contactName}! 👋 Seja bem-vindo à automatas.tech.\n\nRecebi sua mensagem com sucesso! Somos especialistas em automações inteligentes, agentes de IA e integração oficial com a API do WhatsApp.\n\nComo posso ajudar o seu negócio hoje?`;
                } else {
                  botReplyText = `Olá, ${contactName}! Obrigado pela sua mensagem: "${textContent}".\n\nNossos robôs da automatas.tech já registraram o seu contato e um de nossos especialistas entrará em contato em breve! 🤖✨`;
                }

                // Enviar resposta automática chamando a Graph API da Meta
                try {
                  console.log(`[Meta Webhook] Enviando resposta automática para ${from}...`);
                  const sendResult = await sendWhatsAppTextMessage({
                    to: from,
                    text: botReplyText,
                    replyToMessageId: messageId,
                    phoneNumberId: metadataPhoneNumberId,
                  });
                  console.log('[Meta Webhook] Resposta automática enviada com sucesso:', sendResult);
                } catch (sendError) {
                  console.error('[Meta Webhook] Erro ao enviar resposta automática via WhatsApp Graph API:', sendError);
                }
              }
            }
          }
        }
      }

      // Responder 200 OK rapidamente para a Meta (exigência da Cloud API)
      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    }

    // Se não for whatsapp_business_account
    return NextResponse.json({ status: 'IGNORED' }, { status: 200 });
  } catch (error) {
    console.error('[Meta Webhook POST] Erro ao processar requisição webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
