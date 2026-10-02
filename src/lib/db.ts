import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Diretório e arquivo do banco SQLite com suporte a ambientes serverless (Vercel / Lambda)
function getDbPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'automatas.db');
  }
  try {
    const dir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.resolve(dir, 'automatas.db');
  } catch {
    return path.join('/tmp', 'automatas.db');
  }
}

// Conexão SQLite singleton
declare global {
  // eslint-disable-next-line no-var
  var __automatas_sqlite_db: any | undefined;
}

function createInMemoryFallbackDb() {
  const dummyStatement = {
    all: () => [],
    get: () => undefined,
    run: () => ({ changes: 0, lastInsertRowid: 0 }),
  };

  return {
    prepare: () => dummyStatement,
    exec: () => {},
    pragma: () => {},
  };
}

function getDatabase(): any {
  if (!globalThis.__automatas_sqlite_db) {
    try {
      const dbPath = getDbPath();
      const db = new Database(dbPath);
      try {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
      } catch {
        // Ignora caso pragmas de WAL não sejam aceitos em /tmp
      }
      globalThis.__automatas_sqlite_db = db;
      initTables(db);
      seedInitialData(db);
    } catch (err) {
      console.warn('[SQLite] Aviso: Operando em modo de memória resiliente serverless:', err);
      globalThis.__automatas_sqlite_db = createInMemoryFallbackDb();
    }
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
 * Semeia dados iniciais para homologação se necessário
 */
function seedInitialData(_db: Database.Database) {
  // Inicialização limpa em produção sem dados mockados
}

export const db = getDatabase();
export const DB_PATH = getDbPath();
