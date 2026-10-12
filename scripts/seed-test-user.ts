/**
 * Seed — Cria usuário de teste (teste@rendaextra.com) + tenant no Turso.
 *
 * Idempotente: pode rodar múltiplas vezes sem efeito colateral.
 * Usado pelo CI para garantir que os testes de database tenham um tenant.
 *
 * Uso: npx ts-node scripts/seed-test-user.ts
 * Requer: DATABASE_URL e TURSO_AUTH_TOKEN no ambiente (ou .env)
 */

import "dotenv/config";
import path from "path";

// Tenta carregar dotenv do web/ (onde o .env com Turso costuma estar)
require("dotenv").config({ path: path.resolve(__dirname, "../web/.env") });

// bcryptjs está em web/node_modules — precisamos importar de lá explicitamente
// pois o script roda da raiz do monorepo onde bcryptjs não está instalado.
// Como fallback, usa um hash pré-computado via Python (bcrypt.hashpw) se o import falhar.
const BCRYPT_HASH_SENHA123 = "$2b$10$ehemqhDBgBKWAodQAXJnd.xjQ.4ixauYBqbd.fOrJLqBM55hJpmj.";
async function hashPassword(password: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require("../web/node_modules/bcryptjs");
    return await bcrypt.hash(password, 10);
  } catch {
    // bcryptjs não disponível no ambiente — usar hash pré-computado
    // Este hash foi gerado via Python: bcrypt.hashpw("senha123", bcrypt.gensalt(10))
    if (password === "senha123") return BCRYPT_HASH_SENHA123;
    throw new Error("bcryptjs não disponível e hash pré-computado não existe para esta senha");
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL não definido — pulando seed. Testes de database serão ignorados.");
    process.exit(0);
  }

  // Dynamic import para evitar crash se DATABASE_URL não estiver definida
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const { PrismaClient } = await import("../src/generated/prisma/client");

  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // Cria tenant de teste se não existir
    const tenantName = "Teste CI";
    let tenant = await prisma.tenant.findFirst({
      where: { name: tenantName },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          plan: "free",
          status: "active",
        },
      });
      console.log(`✅ Tenant criado: ${tenant.id} (${tenant.name})`);
    } else {
      console.log(`ℹ️  Tenant já existe: ${tenant.id} (${tenant.name})`);
    }

    // Credenciais de teste — senha hashada com bcrypt (compatível com auth.config.ts)
    const testEmail = "teste@rendaextra.com";
    const testPassword = "senha123";

    // Upsert: cria ou atualiza o usuário com senha hashada
    const hashedPassword = await hashPassword(testPassword);

    const user = await prisma.user.upsert({
      where: { email: testEmail },
      create: {
        name: "Usuário Teste",
        email: testEmail,
        password: hashedPassword,
        role: "admin",
        emailVerified: new Date(),
        consentAt: new Date(),
        tenantId: tenant.id,
      },
      update: {
        name: "Usuário Teste",
        password: hashedPassword,
        role: "admin",
        emailVerified: new Date(),
        consentAt: new Date(),
        tenantId: tenant.id,
      },
    });

    console.log(`✅ Usuário criado/atualizado: ${user.id} (${user.email})`);
    console.log("📝 Credenciais de teste:");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);

    console.log("✅ Seed concluído com sucesso.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Seed falhou:", err.message);
  process.exit(1);
});
