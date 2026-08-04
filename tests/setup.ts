import "dotenv/config";
import path from "path";

// Carrega .env do diretório web/ (onde o Turso está configurado)
const envPath = path.resolve(__dirname, "../web/.env");
require("dotenv").config({ path: envPath });

// ─────────────────────────────────────────────────────────────
// Banco LOCAL isolado para testes (em vez do Turso remoto)
// ─────────────────────────────────────────────────────────────
// setupFiles roda antes de CADA arquivo de teste, então cada arquivo
// começa com um banco SQLite local limpo (por worker), sem depender
// de Turso, token ou rede. A promise fica em globalThis para que os
// testes aguardem via waitForTestDb() antes de tocar no Prisma.
import { prepareTestDb } from "./helpers/local-db";

(globalThis as unknown as { __TEST_DB_READY__: Promise<void> }).__TEST_DB_READY__ =
  prepareTestDb();
