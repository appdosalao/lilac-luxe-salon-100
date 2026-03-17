import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type PaymentStatus = 'active' | 'overdue' | 'cancelled' | 'pending';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string | null;
  phone: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  isActive: 0 | 1;
  planExpiresAt: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

const databasePath = process.env.DATABASE_PATH || './data/app.sqlite';
const resolvedPath = path.resolve(process.cwd(), databasePath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new Database(resolvedPath);

db.pragma('journal_mode = WAL');

export const migrate = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      cpfCnpj TEXT NULL,
      phone TEXT NULL,
      asaasCustomerId TEXT NULL,
      asaasSubscriptionId TEXT NULL,
      isActive INTEGER NOT NULL DEFAULT 0,
      planExpiresAt TEXT NULL,
      paymentStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_asaasCustomerId ON users(asaasCustomerId);
    CREATE INDEX IF NOT EXISTS idx_users_asaasSubscriptionId ON users(asaasSubscriptionId);
  `);
};

const nowIso = () => new Date().toISOString();

export const upsertUserByEmail = (input: {
  name: string;
  email: string;
  cpfCnpj?: string | null;
  phone?: string | null;
}) => {
  const existing = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(input.email) as UserRow | undefined;

  if (existing) {
    db.prepare(
      `UPDATE users
       SET name = ?, cpfCnpj = ?, phone = ?, updatedAt = ?
       WHERE email = ?`
    ).run(input.name, input.cpfCnpj ?? null, input.phone ?? null, nowIso(), input.email);

    return db.prepare('SELECT * FROM users WHERE email = ?').get(input.email) as UserRow;
  }

  const id = crypto.randomUUID();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO users
      (id, name, email, cpfCnpj, phone, asaasCustomerId, asaasSubscriptionId, isActive, planExpiresAt, paymentStatus, createdAt, updatedAt)
     VALUES
      (?, ?, ?, ?, ?, NULL, NULL, 0, NULL, 'pending', ?, ?)`
  ).run(id, input.name, input.email, input.cpfCnpj ?? null, input.phone ?? null, ts, ts);

  return db.prepare('SELECT * FROM users WHERE email = ?').get(input.email) as UserRow;
};

export const getUserByEmail = (email: string) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

export const getUserByAsaasCustomerId = (asaasCustomerId: string) =>
  db
    .prepare('SELECT * FROM users WHERE asaasCustomerId = ?')
    .get(asaasCustomerId) as UserRow | undefined;

export const getUserByAsaasSubscriptionId = (asaasSubscriptionId: string) =>
  db
    .prepare('SELECT * FROM users WHERE asaasSubscriptionId = ?')
    .get(asaasSubscriptionId) as UserRow | undefined;

export const setAsaasCustomerId = (email: string, asaasCustomerId: string) => {
  db.prepare(
    `UPDATE users
     SET asaasCustomerId = ?, updatedAt = ?
     WHERE email = ?`
  ).run(asaasCustomerId, nowIso(), email);
};

export const setSubscription = (asaasCustomerId: string, asaasSubscriptionId: string | null) => {
  db.prepare(
    `UPDATE users
     SET asaasSubscriptionId = ?, updatedAt = ?
     WHERE asaasCustomerId = ?`
  ).run(asaasSubscriptionId, nowIso(), asaasCustomerId);
};

export const setPaymentStateByCustomerId = (asaasCustomerId: string, patch: {
  isActive?: boolean;
  planExpiresAt?: string | null;
  paymentStatus?: PaymentStatus;
}) => {
  const existing = db.prepare('SELECT * FROM users WHERE asaasCustomerId = ?').get(asaasCustomerId) as UserRow | undefined;
  if (!existing) return false;

  const isActive = typeof patch.isActive === 'boolean' ? (patch.isActive ? 1 : 0) : existing.isActive;
  const planExpiresAt = patch.planExpiresAt === undefined ? existing.planExpiresAt : patch.planExpiresAt;
  const paymentStatus = patch.paymentStatus ?? existing.paymentStatus;

  db.prepare(
    `UPDATE users
     SET isActive = ?, planExpiresAt = ?, paymentStatus = ?, updatedAt = ?
     WHERE asaasCustomerId = ?`
  ).run(isActive, planExpiresAt, paymentStatus, nowIso(), asaasCustomerId);
  return true;
};

