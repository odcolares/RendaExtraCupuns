/**
 * Database — conexão SQLite via sql.js.
 *
 * Inicializa o banco a partir de arquivo .db (ou cria novo),
 * executa migrations e exporta os dados no disco a cada escrita.
 *
 * sql.js é SQLite puro compilado pra WebAssembly — zero dependência nativa.
 */

import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("Database");

// ==============================================================
// Config
// ==============================================================

const DEFAULT_DB_PATH = path.resolve(__dirname, "../../data/ofertas.db");

let db: SqlJsDatabase | null = null;
let dbPath: string = DEFAULT_DB_PATH;

// ==============================================================
// Inicialização
// ==============================================================

/**
 * Inicializa a conexão com o banco SQLite.
 * - Se o arquivo .db existir, carrega os dados dele
 * - Se não existir, cria um banco novo
 * - Executa as migrations automaticamente
 *
 * @param filePath - Caminho opcional para o arquivo .db
 */
export async function initDatabase(filePath?: string): Promise<void> {
  if (db) {
    log.debug("Database já inicializado");
    return;
  }

  if (filePath) {
    dbPath = path.resolve(filePath);
  }

  // Garantir que o diretório existe
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log.debug("Diretório do database criado", { dir });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    log.info("Database carregado do arquivo", { path: dbPath, size: buffer.length });
  } else {
    db = new SQL.Database();
    log.info("Novo database criado em memória", { path: dbPath });
  }

  runMigrations();
  saveToDisk();
  log.info("Database inicializado com sucesso");
}

/**
 * Retorna a instância atual do banco.
 */
export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error("Database não inicializado. Chame initDatabase() primeiro.");
  }
  return db;
}

/**
 * Salva o estado atual do banco no arquivo .db no disco.
 */
export function saveToDisk(): void {
  if (!db) return;

  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    log.debug("Database salvo no disco", { path: dbPath, size: data.length });
  } catch (err) {
    log.error("Erro ao salvar database no disco", {
      error: (err as Error).message,
    });
  }
}

/**
 * Fecha a conexão com o banco.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    saveToDisk();
    db.close();
    db = null;
    log.info("Database fechado");
  }
}

// ==============================================================
// Migrations
// ==============================================================

const MIGRATIONS: string[] = [
  // Tabela principal de ofertas
  `CREATE TABLE IF NOT EXISTS offers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    original_price  REAL,
    current_price   REAL,
    discount        INTEGER,
    platform        TEXT NOT NULL,
    original_url    TEXT NOT NULL,
    affiliate_link  TEXT,
    offer_data      TEXT,
    detected_at     DATETIME DEFAULT (datetime('now')),
    published       BOOLEAN DEFAULT 0,
    published_at    DATETIME
  )`,
  // Índices para consultas comuns
  `CREATE INDEX IF NOT EXISTS idx_offers_detected_at ON offers(detected_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_offers_platform ON offers(platform)`,
  `CREATE INDEX IF NOT EXISTS idx_offers_published ON offers(published)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_url ON offers(original_url)`,
];

function runMigrations(): void {
  if (!db) return;

  const existingTables = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  const tableNames = existingTables[0]?.values.map((v) => v[0]) || [];

  if (tableNames.includes("offers")) {
    // Mesmo com tabela existente, rodar migrações incrementais
    runPostMigrations();
    return;
  }

  for (const sql of MIGRATIONS) {
    try {
      db!.run(sql);
    } catch (err) {
      log.error("Erro na migration", {
        sql: sql.substring(0, 60),
        error: (err as Error).message,
      });
    }
  }

  log.info("Migrations executadas", { total: MIGRATIONS.length });

  // Migrações incrementais após criação inicial
  runPostMigrations();
}

/**
 * Migrações incrementais — rodam mesmo em banco já existente.
 * Cada migração é idempotente (pode rodar múltiplas vezes sem efeito colateral).
 */
function runPostMigrations(): void {
  if (!db) return;

  // Migration v2 (2026-06-22): índice de URL deixa de ser UNIQUE
  // para permitir republicação de ofertas/cupons após virada de data.
  try {
    db!.run("DROP INDEX IF EXISTS idx_offers_url");
    db!.run(
      "CREATE INDEX IF NOT EXISTS idx_offers_url ON offers(original_url)"
    );
    log.info("Migration v2: índice idx_offers_url alterado para não único");
  } catch (err) {
    log.warn("Migration v2: erro ao recriar índice", {
      error: (err as Error).message,
    });
  }
}
