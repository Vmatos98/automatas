import { NextRequest, NextResponse } from 'next/server';
import { getMetaConfig, messagesStore, sendWhatsAppTextMessage } from '@/lib/whatsapp';

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
 * Captura mensagens de texto, imprime no log e envia resposta automática
 * via POST https://graph.facebook.com/v20.0/{PHONE_ID}/messages
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
          const value = change.value;

          if (!value) continue;

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
              const type = message.type;
              const timestamp = message.timestamp
                ? new Date(parseInt(message.timestamp, 10) * 1000).toISOString()
                : new Date().toISOString();

              let textContent = '';

              if (type === 'text') {
                textContent = message.text?.body || '';
              } else if (type === 'button') {
                textContent = message.button?.text || '';
              } else if (type === 'interactive') {
                textContent =
                  message.interactive?.button_reply?.title ||
                  message.interactive?.list_reply?.title ||
                  '[Interação interativa]';
              } else {
                textContent = `[Mensagem tipo: ${type}]`;
              }

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
              });

              // Montar resposta automática inteligente
              const lowerText = textContent.toLowerCase().trim();
              let botReplyText = '';

              if (lowerText === 'oi' || lowerText === 'olá' || lowerText === 'ola' || lowerText === 'bom dia' || lowerText === 'boa tarde' || lowerText === 'boa noite') {
                botReplyText = `Olá, ${contactName}! 👋 Seja bem-vindo à automatas.tech.\n\nRecebi sua mensagem com sucesso! Somos especialistas em automações inteligentes, agentes de IA e integração oficial com a API do WhatsApp.\n\nComo posso ajudar o seu negócio hoje?`;
              } else {
                botReplyText = `Olá, ${contactName}! Obrigado pela sua mensagem: "${textContent}".\n\nNossos robôs da automatas.tech já registraram o seu contato e um de nossos especialistas entrará em contato em breve! 🤖✨`;
              }

              // Enviar resposta automática chamando a Graph API da Meta v20.0
              try {
                console.log(`[Meta Webhook] Enviando resposta automática para ${from}...`);
                const sendResult = await sendWhatsAppTextMessage({
                  to: from,
                  text: botReplyText,
                  replyToMessageId: messageId,
                });
                console.log('[Meta Webhook] Resposta automática enviada com sucesso:', sendResult);
              } catch (sendError) {
                console.error('[Meta Webhook] Erro ao enviar resposta automática via WhatsApp Graph API:', sendError);
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
