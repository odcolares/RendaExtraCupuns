/**
 * Script de setup do Turso (libSQL serverless).
 *
 * Uso:
 *   1. Crie uma conta em https://turso.tech (login com GitHub)
 *   2. Gere um token em Settings → API Tokens
 *   3. Execute: npx ts-node scripts/setup-turso.ts
 *   4. Cole o token quando solicitado
 *
 * O script:
 *   - Cria uma organização (se não existir)
 *   - Cria um banco de dados "rendaextra-cupuns"
 *   - Cria um token de acesso para o banco
 *   - Atualiza o .env com DATABASE_URL e TURSO_AUTH_TOKEN
 *   - Gera o Prisma Client
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const ENV_PATH = path.resolve(__dirname, "../.env");
const TURSO_API = "https://api.turso.tech/v1";

// ── Helpers ──────────────────────────────────────────────

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function api(
  token: string,
  method: string,
  path: string,
  body?: unknown
) {
  const url = `${TURSO_API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function updateEnv(key: string, value: string) {
  let env = "";
  try {
    env = fs.readFileSync(ENV_PATH, "utf-8");
  } catch {
    // arquivo não existe, será criado
  }

  const regex = new RegExp(`^${key}=.*`, "m");
  const line = `${key}=${value}`;

  if (regex.test(env)) {
    env = env.replace(regex, line);
  } else {
    env += `\n${line}`;
  }

  fs.writeFileSync(ENV_PATH, env, "utf-8");
  console.log(`  ✅ ${key} salvo no .env`);
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║         Setup — Turso (libSQL Serverless)         ║
║                                                   ║
║  Precisa de uma conta em turso.tech (grátis 9GB)  ║
╚═══════════════════════════════════════════════════╝
  `);

  // ── 1. Obter token ──────────────────────────────────
  let token = process.env.TURSO_API_TOKEN || "";
  if (!token) {
    token = await ask("Cole seu Turso API Token: ");
  }
  if (!token) {
    console.log("❌ Token obrigatório. Gere em: https://turso.tech/settings/api-tokens");
    process.exit(1);
  }

  // ── 2. Verificar/quem é o usuário ───────────────────
  console.log("\n🔍 Verificando token...");
  let orgSlug = "";
  try {
    const orgs = await api(token, "GET", "/organizations");
    if (orgs.organizations?.length > 0) {
      orgSlug = orgs.organizations[0].slug;
      console.log(`  Organização: ${orgSlug}`);
    } else {
      // Tenta criar organização
      const name = await ask("Nenhuma organização encontrada. Nome para criar: ");
      const newOrg = await api(token, "POST", "/organizations", { name });
      orgSlug = newOrg.slug;
      console.log(`  ✅ Organização ${orgSlug} criada`);
    }
  } catch (err: any) {
    console.log(`  Token parece válido, usando organização padrão`);
    orgSlug = (await ask("Slug da organização: ")) || "personal";
  }

  // ── 3. Criar banco de dados ─────────────────────────
  const DB_NAME = "rendaextra-cupuns";
  console.log(`\n📦 Criando banco "${DB_NAME}"...`);

  let dbUrl = "";
  try {
    const db = await api(token, "POST", `/organizations/${orgSlug}/databases`, {
      name: DB_NAME,
      group: "default",
    });
    dbUrl = db.database?.hostname
      ? `libsql://${db.database.hostname}`
      : "";
    console.log(`  ✅ Banco criado: ${dbUrl}`);
  } catch (err: any) {
    // Pode já existir
    console.log(`  ⚠️  Pode já existir, buscando informações...`);
    try {
      const dbs = await api(token, "GET", `/organizations/${orgSlug}/databases`);
      const found = dbs.databases?.find((d: any) => d.Name === DB_NAME);
      if (found) {
        dbUrl = found.hostname ? `libsql://${found.hostname}` : `libsql://${DB_NAME}-${orgSlug}.turso.io`;
        console.log(`  ✅ Banco encontrado: ${dbUrl}`);
      }
    } catch {
      console.log(`  ❌ Erro ao buscar banco`);
    }
  }

  if (!dbUrl) {
    // Fallback: constrói URL manualmente
    dbUrl = `libsql://${DB_NAME}-${orgSlug}.turso.io`;
    console.log(`  Usando URL estimada: ${dbUrl}`);
  }

  // ── 4. Criar token de acesso ao banco ───────────────
  console.log(`\n🔑 Criando token de acesso ao banco...`);
  let authToken = "";
  try {
    const tokenResult = await api(
      token,
      "POST",
      `/organizations/${orgSlug}/databases/${DB_NAME}/auth/tokens`,
      { expiration: "never" }
    );
    authToken = tokenResult.jwt || "";
    console.log(`  ✅ Token de acesso gerado`);
  } catch (err: any) {
    console.log(`  ⚠️  Não foi possível gerar token automático`);
    authToken = await ask("Cole o TURSO_AUTH_TOKEN (criado manualmente): ");
  }

  // ── 5. Atualizar .env ───────────────────────────────
  console.log(`\n📝 Atualizando .env...`);
  updateEnv("DATABASE_URL", dbUrl);
  if (authToken) {
    updateEnv("TURSO_AUTH_TOKEN", authToken);
  }
  updateEnv("TURSO_ORG", orgSlug);
  updateEnv("TURSO_DB_NAME", DB_NAME);

  // ── 6. Rodar migrate ────────────────────────────────
  console.log(`\n🔄 Rodando prisma migrate...`);
  try {
    execSync("npx prisma migrate dev --name turso_init", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });
    console.log(`  ✅ Migrations aplicadas!`);
  } catch (err) {
    console.log(`  ⚠️  Migrate falhou. Execute manualmente:`);
    console.log(`     cd web && npx prisma migrate dev --name turso_init`);
  }

  // ── 7. Generate ─────────────────────────────────────
  console.log(`\n🔄 Gerando Prisma Client...`);
  try {
    execSync("npx prisma generate", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });
    console.log(`  ✅ Prisma Client gerado!`);
  } catch (err) {
    console.log(`  ⚠️  Generate falhou. Execute: npx prisma generate`);
  }

  console.log(`
╔═══════════════════════════════════════════════════╗
║  ✅  Setup concluído!                             ║
║                                                   ║
║  DATABASE_URL e TURSO_AUTH_TOKEN salvos no .env   ║
║                                                   ║
║  Próximo passo: deploy no Vercel                  ║
╚═══════════════════════════════════════════════════╝
  `);
}

main().catch((err) => {
  console.error(`\n❌ Erro: ${err.message}`);
  process.exit(1);
});
