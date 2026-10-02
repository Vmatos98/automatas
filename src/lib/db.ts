import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Diretório e arquivo do banco SQLite
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'automatas.db');

// Conexão SQLite singleton
declare global {
  // eslint-disable-next-line no-var
  var __automatas_sqlite_db: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (!globalThis.__automatas_sqlite_db) {
    const db = new Database(DB_PATH);
    // Habilitar Write-Ahead Logging para alta performance e concorrência segura
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    globalThis.__automatas_sqlite_db = db;
    initTables(db);
    seedInitialData(db);
  }
  return globalThis.__automatas_sqlite_db;
}

/**
 * Criação das tabelas essenciais para a Fase 1 (Homologação Meta & Leads)
 */
function initTables(db: Database.Database) {
  db.exec(`
    -- 1. Usuários e Cadastros Ativos (Leads, WhatsApp e Clientes)
    CREATE TABLE IF NOT EXISTS registered_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      source TEXT NOT NULL, -- 'whatsapp_bot', 'lead_form', 'meta_app'
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_deletion', 'deleted'
      deletion_protocol TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Sessões Temporárias de Código OTP para Exclusão de Dados
    CREATE TABLE IF NOT EXISTS deletion_otps (
      target_key TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      protocol TEXT NOT NULL,
      user_name TEXT,
      reason TEXT,
      matched_user_id TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 3. Registro e Auditoria Formal de Protocolos LGPD
    CREATE TABLE IF NOT EXISTS deletion_protocols (
      protocol TEXT PRIMARY KEY,
      target_key TEXT NOT NULL,
      user_name TEXT,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'AGENDADO_EXPURGO',
      confirmed_at TEXT NOT NULL
    );

    -- 4. Histórico de Mensagens WhatsApp
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      from_phone TEXT NOT NULL,
      to_phone TEXT,
      direction TEXT NOT NULL, -- 'inbound', 'outbound'
      text TEXT NOT NULL,
      status TEXT NOT NULL, -- 'received', 'sent', 'delivered', 'read', 'failed'
      sender_name TEXT,
      timestamp TEXT NOT NULL
    );

    -- Índices para busca ultrarrápida por telefone e e-mail
    CREATE INDEX IF NOT EXISTS idx_users_phone ON registered_users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON registered_users(email);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON whatsapp_messages(timestamp DESC);
  `);
}

/**
 * Semeia dados iniciais para homologação e testes de auditoria
 */
function seedInitialData(db: Database.Database) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM registered_users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'reg_demo_1',
      'Cliente Demonstração',
      '5511999998888',
      'cliente.demo@automatas.tech',
      'whatsapp_bot',
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    );

    insertUser.run(
      'reg_demo_2',
      'Auditor Meta / Desenvolvedor',
      '5511988887777',
      'auditoria@meta.com',
      'meta_app',
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  const msgCount = db.prepare('SELECT COUNT(*) as count FROM whatsapp_messages').get() as { count: number };
  if (msgCount.count === 0) {
    const insertMsg = db.prepare(`
      INSERT INTO whatsapp_messages (id, from_phone, to_phone, direction, text, status, sender_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMsg.run(
      'demo-msg-1',
      '5511999998888',
      'automatas.tech Bot',
      'inbound',
      'Olá, gostaria de saber como funciona a automação de WhatsApp da automatas.tech!',
      'read',
      'Cliente Demonstração',
      new Date(Date.now() - 1000 * 60 * 20).toISOString()
    );

    insertMsg.run(
      'demo-msg-2',
      'automatas.tech Bot',
      '5511999998888',
      'outbound',
      'Olá! Bem-vindo à automatas.tech. Nossa plataforma conecta sistemas inteligentes e IA ao seu WhatsApp empresarial.',
      'delivered',
      null,
      new Date(Date.now() - 1000 * 60 * 19).toISOString()
    );
  }
}

export const db = getDatabase();
export { DB_PATH };
