import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório e arquivo do banco SQLite
const DATA_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'automatas.db');
console.log(`\n📦 [Seed Script] Conectando ao banco SQLite: ${DB_PATH}`);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Garantir que as tabelas existam
db.exec(`
  CREATE TABLE IF NOT EXISTS registered_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    deletion_protocol TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY,
    from_phone TEXT NOT NULL,
    to_phone TEXT,
    direction TEXT NOT NULL,
    text TEXT NOT NULL,
    status TEXT NOT NULL,
    sender_name TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_phone ON registered_users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_email ON registered_users(email);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON whatsapp_messages(timestamp DESC);
`);

console.log('✅ Tabelas verificadas com sucesso.');

// 1. Cadastrar / Atualizar Contatos
const upsertUser = db.prepare(`
  INSERT INTO registered_users (id, name, phone, email, source, status, created_at, updated_at)
  VALUES (@id, @name, @phone, @email, @source, @status, @created_at, @updated_at)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email,
    source = excluded.source,
    status = excluded.status,
    updated_at = excluded.updated_at
`);

const now = new Date().toISOString();
const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10).toISOString();
const fiveMinutesAgo = new Date(Date.now() - 1000 * 60 * 5).toISOString();
const twoMinutesAgo = new Date(Date.now() - 1000 * 60 * 2).toISOString();
const oneMinuteAgo = new Date(Date.now() - 1000 * 60 * 1).toISOString();

const contactsToSeed = [
  {
    id: 'user_admin_oficial',
    name: 'Victor Matos (Administrador)',
    phone: '5575999070840',
    email: 'admin@automatas.tech',
    source: 'manual_admin',
    status: 'active',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'user_meta_auditor_review',
    name: 'Auditor Meta (App Review Test)',
    phone: '5511999998888',
    email: 'app-review@meta.com',
    source: 'meta_app',
    status: 'active',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'user_lead_demonstracao',
    name: 'Contato Demonstração WhatsApp',
    phone: '5511988887777',
    email: 'cliente.teste@automatas.tech',
    source: 'whatsapp_bot',
    status: 'active',
    created_at: now,
    updated_at: now,
  },
];

console.log('\n👤 Cadastrando contatos de homologação:');
for (const contact of contactsToSeed) {
  upsertUser.run(contact);
  console.log(`  - [${contact.source}] ${contact.name} | Tel: ${contact.phone} | E-mail: ${contact.email}`);
}

// 2. Cadastrar / Atualizar Mensagens Demonstrativas de Conformidade
const upsertMessage = db.prepare(`
  INSERT INTO whatsapp_messages (id, from_phone, to_phone, direction, text, status, sender_name, timestamp)
  VALUES (@id, @from_phone, @to_phone, @direction, @text, @status, @sender_name, @timestamp)
  ON CONFLICT(id) DO UPDATE SET
    text = excluded.text,
    status = excluded.status,
    timestamp = excluded.timestamp
`);

const messagesToSeed = [
  // Conversa com o Auditor da Meta (Demostra Opt-In, Termos e Política de Privacidade)
  {
    id: 'msg_meta_1',
    from_phone: '5511999998888',
    to_phone: '5511921539923',
    direction: 'inbound',
    text: 'Olá! Estou realizando a auditoria do aplicativo da automatas.tech para validação da Meta WhatsApp Cloud API.',
    status: 'read',
    sender_name: 'Auditor Meta (App Review Test)',
    timestamp: tenMinutesAgo,
  },
  {
    id: 'msg_meta_2',
    from_phone: '5511921539923',
    to_phone: '5511999998888',
    direction: 'outbound',
    text: 'Olá, Revisor da Meta! 👋 Seja bem-vindo à automatas.tech.\n\nNossa plataforma é especialista em agentes de IA e automações corporativas integradas oficialmente à WhatsApp Business Cloud API v20.0.\n\nPara consultar nossa conformidade legal, acesse:\n📜 Termos de Serviço: https://automatas.tech/termos\n🛡️ Política de Privacidade: https://automatas.tech/privacidade\n🗑️ Exclusão de Dados LGPD: https://automatas.tech/exclusao-dados',
    status: 'delivered',
    sender_name: 'automatas.tech Bot',
    timestamp: fiveMinutesAgo,
  },
  {
    id: 'msg_meta_3',
    from_phone: '5511999998888',
    to_phone: '5511921539923',
    direction: 'inbound',
    text: 'Recebido com sucesso. Verificando fluxo de atendimento e armazenamento de mensagens.',
    status: 'read',
    sender_name: 'Auditor Meta (App Review Test)',
    timestamp: twoMinutesAgo,
  },
  {
    id: 'msg_meta_4',
    from_phone: '5511921539923',
    to_phone: '5511999998888',
    direction: 'outbound',
    text: 'Perfeito! Todas as mensagens são processadas com assinatura criptográfica HMAC-SHA256 (X-Hub-Signature-256) garantindo a autenticidade e segurança dos dados.',
    status: 'read',
    sender_name: 'automatas.tech Bot',
    timestamp: oneMinuteAgo,
  },

  // Conversa com o Administrador
  {
    id: 'msg_admin_1',
    from_phone: '5575999070840',
    to_phone: '5511921539923',
    direction: 'inbound',
    text: 'Status do sistema e conexão com a Meta?',
    status: 'read',
    sender_name: 'Victor Matos (Administrador)',
    timestamp: fiveMinutesAgo,
  },
  {
    id: 'msg_admin_2',
    from_phone: '5511921539923',
    to_phone: '5575999070840',
    direction: 'outbound',
    text: 'Olá Victor! Conexão com o backend dedicada ativa em https://api.automatas.tech/webhook. Webhook validado e operacional! 🚀',
    status: 'delivered',
    sender_name: 'automatas.tech Bot',
    timestamp: twoMinutesAgo,
  },
];

console.log('\n💬 Cadastrando mensagens de conformidade para auditoria:');
for (const msg of messagesToSeed) {
  upsertMessage.run(msg);
  console.log(`  - [${msg.direction}] Para/De ${msg.from_phone}: "${msg.text.slice(0, 40)}..."`);
}

// Resumo final
const countUsers = db.prepare('SELECT COUNT(*) as count FROM registered_users').get().count;
const countMsgs = db.prepare('SELECT COUNT(*) as count FROM whatsapp_messages').get().count;

console.log('\n======================================================');
console.log('🎉 Seed de Homologação Concluído com Sucesso!');
console.log(`📊 Total de Usuários no Banco: ${countUsers}`);
console.log(`💬 Total de Mensagens no Banco: ${countMsgs}`);
console.log('======================================================\n');
