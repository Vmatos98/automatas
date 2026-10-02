import { NextRequest, NextResponse } from 'next/server';
import { dataRegistry } from '@/lib/dataRegistry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phoneOrEmail, userName, reason, code } = body;

    if (!phoneOrEmail || typeof phoneOrEmail !== 'string') {
      return NextResponse.json(
        { error: 'Telefone ou e-mail é obrigatório para identificação.' },
        { status: 400 }
      );
    }

    // Ação 1: Solicitar código OTP após validar se os dados existem no cadastro
    if (action === 'REQUEST_OTP') {
      const result = await dataRegistry.createOtpSession(
        phoneOrEmail.trim(),
        userName ? userName.trim() : '',
        reason ? reason.trim() : 'Revogação de consentimento / Exclusão total'
      );

      if (!result.userFound) {
        return NextResponse.json(
          {
            success: false,
            userFound: false,
            error: 'NOT_FOUND',
            message:
              'Nenhum registro ou dado pessoal localizado para este identificador em nossos sistemas. Seus dados não constam em nossa base de clientes ou canais.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        userFound: true,
        message: 'Registro localizado! Um código de verificação foi enviado para confirmação de posse.',
        maskedTarget: result.maskedTarget,
        protocol: result.protocol,
        expiresInSeconds: result.expiresInSeconds,
        // Em ambiente de teste/desenvolvimento ou homologação, expor debugCode para facilitar testes
        debugCode: result.debugCode,
      });
    }

    // Ação 2: Validar o código OTP e autenticar a exclusão definitiva
    if (action === 'VERIFY_OTP') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json(
          { error: 'Código de verificação OTP não fornecido.' },
          { status: 400 }
        );
      }

      const verifyResult = dataRegistry.verifyOtpAndConfirm(phoneOrEmail.trim(), code.trim());

      if (!verifyResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_CODE',
            message: verifyResult.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: verifyResult.message,
        protocol: verifyResult.protocol,
        confirmedAt: verifyResult.confirmedAt,
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida. Utilize "REQUEST_OTP" ou "VERIFY_OTP".' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erro na API de exclusão de dados:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a verificação de exclusão de dados.' },
      { status: 500 }
    );
  }
}
