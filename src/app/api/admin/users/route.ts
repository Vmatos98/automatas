import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export interface AdminUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: 'active' | 'pending_deletion' | 'deleted' | 'blocked';
  deletion_protocol?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/users
 * Retorna lista de usuários e estatísticas para o painel administrativo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'active' | 'leads' | 'whatsapp' | 'deleted'
    const search = (searchParams.get('q') || '').trim().toLowerCase();

    let query = 'SELECT * FROM registered_users';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter === 'active') {
      conditions.push("status = 'active'");
    } else if (filter === 'leads') {
      conditions.push("source = 'lead_form'");
    } else if (filter === 'whatsapp') {
      conditions.push("source = 'whatsapp_bot'");
    } else if (filter === 'deleted') {
      conditions.push("status IN ('pending_deletion', 'deleted')");
    }

    if (search) {
      conditions.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC LIMIT 200';

    const users = db.prepare(query).all(...params) as AdminUser[];

    // Estatísticas gerais para os cards do topo
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM registered_users').get() as { count: number }).count;
    const activeUsers = (db.prepare("SELECT COUNT(*) as count FROM registered_users WHERE status = 'active'").get() as { count: number }).count;
    const whatsappUsers = (db.prepare("SELECT COUNT(*) as count FROM registered_users WHERE source = 'whatsapp_bot'").get() as { count: number }).count;
    const deletionRequests = (db.prepare("SELECT COUNT(*) as count FROM registered_users WHERE status IN ('pending_deletion', 'deleted')").get() as { count: number }).count;

    return NextResponse.json({
      success: true,
      users,
      stats: {
        total: totalUsers,
        active: activeUsers,
        whatsapp: whatsappUsers,
        deletions: deletionRequests,
      },
    });
  } catch (error) {
    console.error('Erro no GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Erro ao listar usuários.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Cadastro manual de novo usuário/lead pelo administrador
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, source = 'manual_admin' } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const now = new Date().toISOString();
    const newId = `usr_${Date.now()}`;

    db.prepare(`
      INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(newId, name.trim(), cleanPhone, cleanEmail, source, now, now);

    return NextResponse.json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: {
        id: newId,
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        source,
        status: 'active',
        created_at: now,
      },
    });
  } catch (error) {
    console.error('Erro no POST /api/admin/users:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar usuário.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Atualiza status (ex: bloquear, ativar) ou dados do usuário
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, name, email, phone } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (name) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email ? String(email).trim().toLowerCase() : null);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? String(phone).replace(/\D/g, '') : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.prepare(`UPDATE registered_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro no PATCH /api/admin/users:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users
 * Exclusão definitiva ou expurgo de dados LGPD
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    // Buscar telefone para limpar mensagens associadas se houver
    const user = db.prepare('SELECT phone FROM registered_users WHERE id = ?').get(id) as { phone: string | null } | undefined;

    if (user?.phone) {
      db.prepare('DELETE FROM whatsapp_messages WHERE from_phone = ? OR to_phone = ?').run(user.phone, user.phone);
    }

    db.prepare('DELETE FROM registered_users WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Usuário e dados associados excluídos com sucesso!' });
  } catch (error) {
    console.error('Erro no DELETE /api/admin/users:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário.' }, { status: 500 });
  }
}
