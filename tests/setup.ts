import "dotenv/config";
import path from "path";

// Carrega .env do diretório web/ (onde o Turso está configurado)
const envPath = path.resolve(__dirname, "../web/.env");
require("dotenv").config({ path: envPath });

// Verifica se as variáveis essenciais estão definidas
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL não definido no .env — testes de integração podem falhar");
}
if (!process.env.TURSO_AUTH_TOKEN) {
  console.warn("⚠️  TURSO_AUTH_TOKEN não definido no .env — testes de integração podem falhar");
}