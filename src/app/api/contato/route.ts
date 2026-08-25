import { NextRequest, NextResponse } from 'next/server';

const PRODUCTION_WEBHOOK_URL = process.env.N8N_LEAD_WEBHOOK_URL || 'https://leads-service.automatas.tech/webhook/site-lead';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificação de segurança: Origin e Referer
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Permite chamadas internas da mesma origem / localhost / domínio oficial
    if (origin) {
      const allowedOrigins = [
        'https://automatas.tech',
        'https://www.automatas.tech',
        `http://${host}`,
        `https://${host}`,
      ];

      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (!isAllowed) {
        return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
      }
    }

    const body = await request.json();

    // 2. Proteção Anti-bot / Honeypot: Se o campo oculto estiver preenchido, rejeita silenciosamente
    if (body._gotcha || body.website_url) {
      return NextResponse.json({ success: true, message: 'Processado com sucesso.' });
    }

    const { nome, email, telefone, preferencia, servico, motivo } = body;

    // 3. Validação básica de campos obrigatórios
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      return NextResponse.json({ error: 'Nome inválido ou não fornecido.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    const cleanPhone = String(telefone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Número de contato inválido.' }, { status: 400 });
    }

    // 4. Encaminhamento seguro Server-to-Server para o webhook de produção do n8n
    const n8nPayload = {
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      preferencia: preferencia || 'WhatsApp',
      servico: servico || 'Desenvolvimento de Site',
      motivo: motivo ? String(motivo).trim() : ''
    };

    const webhookResponse = await fetch(PRODUCTION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AutomatasTech-SiteServer/1.0',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text().catch(() => '');
      console.error(`Erro retornado pelo n8n (${webhookResponse.status}):`, errorText);
      return NextResponse.json(
        { error: 'Não foi possível registrar o contato no momento.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na rota /api/contato:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação.' },
      { status: 500 }
    );
  }
}
