/**
 * Helper de banco local para testes.
 *
 * Cria um banco SQLite LOCAL (via `file:` URL do adapter libSQL) isolado por
 * worker do Jest. Assim os testes de integração/database:
 *   - Não dependem do Turso remoto (nem de token/network)
 *   - Não poluem o banco de produção
 *   - Começam SEMPRE com estado limpo (o arquivo é apagado antes de cada
 *     arquivo de teste, porque setup.ts roda antes de cada arquivo)
 *
 * Uso:
 *   tests/setup.ts  →  chama prepareTestDb() (fire-and-forget, guarda a promise
 *                      em globalThis.__TEST_DB_READY__)
 *   testes          →  await waitForTestDb() no beforeAll antes de tocar no Prisma
 */

import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

const DATA_DIR = path.resolve(__dirname, "../../data");

/** IDs FIXOS para o seed — mantêm o cache de tenantId do offers.ts válido entre arquivos de teste. */
const TEST_TENANT_ID = "test-tenant-ci";
const TEST_USER_ID = "test-user-ci";
const TEST_USER_EMAIL = "cliente@teste.com";

function resolveDbPath(): string {
  const workerId = process.env.JEST_WORKER_ID || "1";
  return path.join(DATA_DIR, `test-prisma-worker-${workerId}.db`);
}

/** Lê e ordena todos os migration.sql do web/prisma/migrations. */
function listMigrationFiles(): string[] {
  const migrationsDir = path.resolve(__dirname, "../../web/prisma/migrations");
  if (!fs.existsSync(migrationsDir)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(migrationsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sql = path.join(migrationsDir, entry.name, "migration.sql");
    if (fs.existsSync(sql)) files.push(sql);
  }

  // Ordem alfabética = ordem cronológica dos diretórios (20260707..., 20260709...)
  return files.sort();
}

/**
 * Prepara o banco local do worker corrente:
 * 1. Apaga o arquivo .db (estado limpo)
 * 2. Aplica todas as migrations do schema
 * 3. Faz o seed do tenant + usuário de teste (cliente@teste.com)
 *
 * Resolve quando o banco está pronto para uso.
 */
export async function prepareTestDb(): Promise<void> {
  const dbPath = resolveDbPath();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Aponta o Prisma (src/lib/prisma.ts) para o banco local em vez do Turso
  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
  delete process.env.TURSO_AUTH_TOKEN;

  const client = createClient({ url: `file:${dbPath.replace(/\\/g, "/")}` });

  try {
    // 1. Migrations
    const migrationFiles = listMigrationFiles();
    if (migrationFiles.length === 0) {
      throw new Error(
        "Nenhum migration.sql encontrado em web/prisma/migrations — não é possível preparar o banco de teste."
      );
    }

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(file, "utf8");
      // Cada statement termina em ';'. Comentários '--' são inofensivos no SQLite.
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await client.batch(statements);
    }

    // 2. Seed — tenant + usuário de teste (ids fixos para estabilidade)
    await client.batch([
      `INSERT INTO "Tenant" ("id", "name", "plan", "status", "createdAt", "updatedAt")
       VALUES ('${TEST_TENANT_ID}', 'Teste CI', 'free', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      `INSERT INTO "User" ("id", "name", "email", "password", "role", "createdAt", "updatedAt", "tenantId")
       VALUES ('${TEST_USER_ID}', 'Cliente Teste', '${TEST_USER_EMAIL}', 'seed-ci-placeholder', 'client', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '${TEST_TENANT_ID}')`,
    ]);
  } finally {
    await client.close();
  }
}

/**
 * Aguarda o banco local ficar pronto (chamado no beforeAll dos testes que usam Prisma).
 */
export async function waitForTestDb(): Promise<void> {
  const ready = (globalThis as unknown as { __TEST_DB_READY__?: Promise<void> })
    .__TEST_DB_READY__;
  if (ready) {
    await ready;
  } else {
    // Fallback: prepara na hora se setup.ts não tiver sido executado
    await prepareTestDb();
  }
}
