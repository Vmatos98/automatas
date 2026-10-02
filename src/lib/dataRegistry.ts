import { db } from './db';
import { sendWhatsAppTextMessage } from './whatsapp';

export interface RegisteredUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: 'whatsapp_bot' | 'lead_form' | 'meta_app';
  createdAt: string;
  status: 'active' | 'pending_deletion' | 'deleted';
  deletionProtocol?: string;
}

export interface DeletionOtpSession {
  code: string;
  expiresAt: number;
  attempts: number;
  protocol: string;
  userName: string;
  reason: string;
  matchedUserId: string;
}

/**
 * Normaliza número de telefone removendo caracteres não numéricos
 * e padronizando com código do país (55)
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Mascara telefone ou e-mail para exibição segura no front
 */
export function maskContact(contact: string): string {
  if (contact.includes('@')) {
    const [user, domain] = contact.split('@');
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  }
  const digits = contact.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}****${digits.slice(-4)}`;
  }
  return `${contact.slice(0, 2)}****`;
}

export const dataRegistry = {
  /**
   * Procura registro por e-mail ou telefone no banco SQLite
   */
  findUser: (query: string): RegisteredUser | null => {
    const cleanQuery = query.trim().toLowerCase();
    const cleanDigits = query.replace(/\D/g, '');
    const normalizedPhone = cleanDigits ? normalizePhone(cleanDigits) : '';

    if (cleanQuery.includes('@')) {
      const row = db
        .prepare('SELECT * FROM registered_users WHERE LOWER(email) = ? LIMIT 1')
        .get(cleanQuery) as any;
      if (row) {
        return {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          source: row.source,
          status: row.status,
          deletionProtocol: row.deletion_protocol,
          createdAt: row.created_at,
        };
      }
    }

    if (cleanDigits.length >= 8) {
      // Buscar exato com normalização ou final dos dígitos
      const rows = db.prepare('SELECT * FROM registered_users WHERE phone IS NOT NULL').all() as any[];
      const matched = rows.find((r) => {
        if (!r.phone) return false;
        const uNorm = normalizePhone(r.phone);
        return uNorm === normalizedPhone || uNorm.endsWith(cleanDigits);
      });

      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          phone: matched.phone,
          email: matched.email,
          source: matched.source,
          status: matched.status,
          deletionProtocol: matched.deletion_protocol,
          createdAt: matched.created_at,
        };
      }
    }

    return null;
  },

  /**
   * Adiciona ou atualiza um usuário cadastrado no SQLite
   */
  registerUser: (user: Omit<RegisteredUser, 'id' | 'createdAt' | 'status'>): RegisteredUser => {
    const existing = dataRegistry.findUser(user.email || user.phone || '');
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE registered_users
        SET name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            updated_at = ?
        WHERE id = ?
      `).run(user.name || null, user.phone || null, user.email || null, now, existing.id);

      return {
        ...existing,
        name: user.name || existing.name,
        phone: user.phone || existing.phone,
        email: user.email || existing.email,
      };
    }

    const newId = `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      newId,
      user.name,
      user.phone || null,
      user.email || null,
      user.source,
      now,
      now
    );

    return {
      id: newId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      source: user.source,
      status: 'active',
      createdAt: now,
    };
  },

  /**
   * Gera código OTP de 6 dígitos e persiste a sessão no SQLite
   */
  createOtpSession: async (
    phoneOrEmail: string,
    userName: string,
    reason: string
  ): Promise<{
    success: boolean;
    userFound: boolean;
    message: string;
    maskedTarget?: string;
    protocol?: string;
    expiresInSeconds?: number;
    debugCode?: string;
  }> => {
    // 1. Validar se os dados constam no banco SQLite
    const user = dataRegistry.findUser(phoneOrEmail);
    if (!user) {
      return {
        success: false,
        userFound: false,
        message: 'Nenhum registro ou dado pessoal localizado para este identificador em nossos sistemas.',
      };
    }

    if (user.status === 'deleted') {
      return {
        success: false,
        userFound: true,
        message: 'Os dados vinculados a este identificador já foram previamente expurgados de nossa base.',
      };
    }

    // 2. Gerar código OTP de 6 dígitos numéricos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos
    const protocol = `DEL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`;
    const targetKey = phoneOrEmail.trim().toLowerCase();
    const now = new Date().toISOString();

    // Salvar sessão no SQLite (INSERT OR REPLACE)
    db.prepare(`
      INSERT INTO deletion_otps (target_key, code, protocol, user_name, reason, matched_user_id, attempts, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      ON CONFLICT(target_key) DO UPDATE SET
        code = excluded.code,
        protocol = excluded.protocol,
        user_name = excluded.user_name,
        reason = excluded.reason,
        matched_user_id = excluded.matched_user_id,
        attempts = 0,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at
    `).run(targetKey, otp, protocol, userName || user.name, reason, user.id, expiresAt, now);

    // 3. Disparar via WhatsApp se tiver telefone disponível
    const targetPhone = user.phone || (phoneOrEmail.replace(/\D/g, '').length >= 10 ? phoneOrEmail : undefined);
    if (targetPhone) {
      try {
        await sendWhatsAppTextMessage({
          to: targetPhone,
          text: `[automatas.tech] Código de Verificação LGPD: *${otp}*.\nUtilize este código para confirmar seu pedido de exclusão de dados (Protocolo: ${protocol}). Válido por 10 minutos. Se você não fez essa solicitação, por favor desconsidere.`,
        });
      } catch (err) {
        console.warn('[Data Registry] Falha ao enviar WhatsApp OTP:', err);
      }
    }

    return {
      success: true,
      userFound: true,
      message: 'Código de confirmação gerado e enviado com sucesso.',
      maskedTarget: maskContact(phoneOrEmail),
      protocol,
      expiresInSeconds: 600,
      debugCode: otp,
    };
  },

  /**
   * Valida código OTP e confirma o pedido formal de exclusão no SQLite
   */
  verifyOtpAndConfirm: (
    phoneOrEmail: string,
    code: string
  ): {
    success: boolean;
    message: string;
    protocol?: string;
    confirmedAt?: string;
    user?: RegisteredUser;
  } => {
    const targetKey = phoneOrEmail.trim().toLowerCase();
    const session = db
      .prepare('SELECT * FROM deletion_otps WHERE target_key = ? LIMIT 1')
      .get(targetKey) as any;

    if (!session) {
      return {
        success: false,
        message: 'Sessão de verificação não encontrada ou expirada. Solicite um novo código.',
      };
    }

    if (Date.now() > session.expires_at) {
      db.prepare('DELETE FROM deletion_otps WHERE target_key = ?').run(targetKey);
      return {
        success: false,
        message: 'O código de confirmação expirou. Solicite um novo código.',
      };
    }

    if (session.attempts >= 4) {
      db.prepare('DELETE FROM deletion_otps WHERE target_key = ?').run(targetKey);
      return {
        success: false,
        message: 'Número excessivo de tentativas incorretas. Por segurança, inicie um novo pedido.',
      };
    }

    if (session.code !== code.trim()) {
      const nextAttempts = session.attempts + 1;
      db.prepare('UPDATE deletion_otps SET attempts = ? WHERE target_key = ?').run(nextAttempts, targetKey);
      return {
        success: false,
        message: `Código incorreto. Você tem mais ${4 - nextAttempts} tentativa(s).`,
      };
    }

    // Código válido! Gravar auditoria formal e atualizar status no SQLite
    const confirmedAt = new Date().toISOString();
    const protocol = session.protocol;

    db.transaction(() => {
      // 1. Atualizar usuário para 'pending_deletion'
      db.prepare(`
        UPDATE registered_users
        SET status = 'pending_deletion',
            deletion_protocol = ?,
            updated_at = ?
        WHERE id = ?
      `).run(protocol, confirmedAt, session.matched_user_id);

      // 2. Registrar protocolo na tabela de auditoria permanente
      db.prepare(`
        INSERT INTO deletion_protocols (protocol, target_key, user_name, reason, status, confirmed_at)
        VALUES (?, ?, ?, ?, 'AGENDADO_EXPURGO', ?)
        ON CONFLICT(protocol) DO UPDATE SET confirmed_at = excluded.confirmed_at
      `).run(protocol, targetKey, session.user_name, session.reason, confirmedAt);

      // 3. Remover sessão OTP consumida
      db.prepare('DELETE FROM deletion_otps WHERE target_key = ?').run(targetKey);
    })();

    const updatedUser = dataRegistry.findUser(phoneOrEmail);

    return {
      success: true,
      message: 'Titularidade validada com sucesso! O pedido de exclusão foi autenticado.',
      protocol,
      confirmedAt,
      user: updatedUser || undefined,
    };
  },
};
